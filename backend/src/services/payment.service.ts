import Stripe from "stripe";
import { Prisma, PaymentStatus, RefundStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/api-error.js";

const getStripe = () => {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(503, "Stripe test mode is not configured", "STRIPE_NOT_CONFIGURED");
  return new Stripe(env.STRIPE_SECRET_KEY);
};

const cents = (value: Prisma.Decimal | number) => Math.round(Number(value) * 100);
const publicPayment = (payment: { id: string; provider: string; status: PaymentStatus; amount: Prisma.Decimal; currency: string; createdAt: Date }) => ({ id: payment.id, provider: payment.provider, status: payment.status, amount: Number(payment.amount), currency: payment.currency, createdAt: payment.createdAt });

export const createCheckoutSession = async (userId: string, orderId: string) => {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: { orderBy: { createdAt: "asc" } }, payments: { where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] } }, orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!order) throw new ApiError(404, "Order not found", "ORDER_NOT_FOUND");
  if (["CANCELLED", "REFUNDED"].includes(order.status)) throw new ApiError(409, "This order cannot be paid", "ORDER_NOT_PAYABLE");
  if (order.paymentStatus === PaymentStatus.SUCCEEDED || order.paymentStatus === PaymentStatus.REFUNDED) throw new ApiError(409, "This order has already been paid", "ORDER_ALREADY_PAID");
  const existing = order.payments[0];
  if (existing?.checkoutSessionId) return { payment: publicPayment(existing), checkoutUrl: null };

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((item) => ({ price_data: { currency: order.currency.toLowerCase(), product_data: { name: item.productName }, unit_amount: cents(item.unitPrice) }, quantity: item.quantity })),
    metadata: { orderId: order.id },
    success_url: `${env.FRONTEND_URL}/orders/${order.id}?payment=success`,
    cancel_url: `${env.FRONTEND_URL}/orders/${order.id}?payment=cancelled`,
  }, { idempotencyKey: `checkout-${order.id}` });
  if (!session.id) throw new ApiError(502, "Stripe did not return a checkout session", "STRIPE_SESSION_FAILED");
  const payment = await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findFirst({ where: { orderId: order.id, status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] } }, orderBy: { createdAt: "desc" } });
    if (current) return current;
    await tx.order.update({ where: { id: order.id }, data: { paymentProvider: "stripe", paymentRef: session.id, paymentStatus: PaymentStatus.PROCESSING } });
    return tx.payment.create({ data: { orderId: order.id, provider: "stripe", checkoutSessionId: session.id, status: PaymentStatus.PROCESSING, amount: order.totalAmount, currency: order.currency } });
  });
  return { payment: publicPayment(payment), checkoutUrl: session.url };
};

const syncPayment = async (providerPaymentId: string, status: PaymentStatus) => prisma.$transaction(async (tx) => {
  const payment = await tx.payment.findFirst({ where: { OR: [{ providerPaymentId }, { checkoutSessionId: providerPaymentId }] } });
  if (!payment) return null;
  await tx.payment.update({ where: { id: payment.id }, data: { providerPaymentId, status } });
  await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: status } });
  return payment.orderId;
});

export const processStripeWebhook = async (rawBody: Buffer, signature: string | undefined) => {
  if (!env.STRIPE_WEBHOOK_SECRET) throw new ApiError(503, "Stripe webhook is not configured", "STRIPE_NOT_CONFIGURED");
  if (!signature) throw new ApiError(400, "Missing Stripe signature", "INVALID_WEBHOOK_SIGNATURE");
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET); } catch { throw new ApiError(400, "Invalid Stripe webhook signature", "INVALID_WEBHOOK_SIGNATURE"); }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.processedStripeEvent.create({ data: { eventId: event.id, type: event.type } });
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid" && session.payment_intent) {
          const payment = await tx.payment.findUnique({ where: { checkoutSessionId: session.id } });
          if (payment) { await tx.payment.update({ where: { id: payment.id }, data: { providerPaymentId: String(session.payment_intent), status: PaymentStatus.SUCCEEDED } }); await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: PaymentStatus.SUCCEEDED } }); }
        }
      } else if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
        const intent = event.data.object as Stripe.PaymentIntent;
        const status = event.type.endsWith("succeeded") ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED;
        const payment = await tx.payment.findFirst({ where: { providerPaymentId: intent.id } });
        if (payment) { await tx.payment.update({ where: { id: payment.id }, data: { status } }); await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: status } }); }
      } else if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const providerPaymentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (providerPaymentId) {
          const payment = await tx.payment.findFirst({ where: { providerPaymentId } });
          if (payment) {
            const amount = new Prisma.Decimal(charge.amount_refunded).dividedBy(100);
            const status = charge.amount_refunded >= charge.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
            await tx.refund.upsert({ where: { providerRefundId: `charge_${charge.id}` }, update: { amount, status: RefundStatus.SUCCEEDED }, create: { paymentId: payment.id, providerRefundId: `charge_${charge.id}`, amount, currency: payment.currency, status: RefundStatus.SUCCEEDED } });
            await tx.payment.update({ where: { id: payment.id }, data: { status } }); await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: status } });
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { duplicate: true, eventId: event.id };
    throw error;
  }
  return { duplicate: false, eventId: event.id };
};

export const refundOrder = async (orderId: string, amountInput?: number, reason?: string) => {
  const payment = await prisma.payment.findFirst({ where: { orderId, status: { in: [PaymentStatus.SUCCEEDED, PaymentStatus.PARTIALLY_REFUNDED] } }, orderBy: { createdAt: "desc" }, include: { refunds: { where: { status: { in: [RefundStatus.PENDING, RefundStatus.SUCCEEDED] } } }, order: { select: { totalAmount: true, currency: true } } } });
  if (!payment?.providerPaymentId) throw new ApiError(409, "A successful Stripe payment is required", "PAYMENT_NOT_REFUNDABLE");
  const alreadyRefunded = payment.refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
  const amount = amountInput ?? Number(payment.order.totalAmount) - alreadyRefunded;
  if (!Number.isFinite(amount) || amount <= 0 || amount > Number(payment.order.totalAmount) - alreadyRefunded) throw new ApiError(400, "Refund amount is invalid", "INVALID_REFUND_AMOUNT");
  const stripe = getStripe();
  const refund = await stripe.refunds.create({ payment_intent: payment.providerPaymentId, amount: Math.round(amount * 100), reason: reason === "requested_by_customer" || reason === "duplicate" || reason === "fraudulent" ? reason : undefined }, { idempotencyKey: `refund-${orderId}-${Math.round(amount * 100)}` });
  const status = refund.status === "succeeded" ? RefundStatus.SUCCEEDED : refund.status === "failed" ? RefundStatus.FAILED : RefundStatus.PENDING;
  let saved;
  try {
    saved = await prisma.$transaction(async (tx) => { const record = await tx.refund.create({ data: { paymentId: payment.id, providerRefundId: refund.id, amount: new Prisma.Decimal(refund.amount).dividedBy(100), currency: payment.order.currency, status, reason: reason || null } }); const newPaymentStatus = status === RefundStatus.SUCCEEDED ? (amount >= Number(payment.order.totalAmount) - alreadyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED) : payment.status; await tx.payment.update({ where: { id: payment.id }, data: { status: newPaymentStatus } }); await tx.order.update({ where: { id: orderId }, data: { paymentStatus: newPaymentStatus } }); return record; });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    saved = await prisma.refund.findUniqueOrThrow({ where: { providerRefundId: refund.id } });
  }
  return { id: saved.id, status: saved.status, amount: Number(saved.amount), currency: saved.currency, providerRefundId: "configured" };
};

export const listSellerTransactions = async (sellerId: string) => {
  const allocations = await prisma.sellerOrderAllocation.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" }, include: { order: { select: { id: true, paymentStatus: true, status: true, createdAt: true, payments: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 } }, }, seller: { select: { id: true } } } });
  return allocations.map((allocation) => ({ id: allocation.id, orderId: allocation.orderId, currency: allocation.currency, grossAmount: Number(allocation.grossAmount), platformFeeAmount: Number(allocation.platformFeeAmount), sellerNetAmount: Number(allocation.sellerNetAmount), feeRate: Number(allocation.feeRate), paymentStatus: allocation.order.paymentStatus, orderStatus: allocation.order.status, createdAt: allocation.createdAt }));
};

export const listAdminPayments = async () => {
  const payments = await prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, orderId: true, provider: true, status: true, amount: true, currency: true, createdAt: true, updatedAt: true, refunds: { select: { id: true, amount: true, currency: true, status: true, createdAt: true } } } });
  return payments.map((payment) => ({ ...payment, amount: Number(payment.amount), refunds: payment.refunds.map((refund) => ({ ...refund, amount: Number(refund.amount) })) }));
};

export const listAdminAllocations = async () => {
  const allocations = await prisma.sellerOrderAllocation.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, orderId: true, sellerId: true, grossAmount: true, platformFeeAmount: true, sellerNetAmount: true, feeRate: true, currency: true, createdAt: true, order: { select: { paymentStatus: true, status: true } } } });
  return allocations.map((allocation) => ({ ...allocation, grossAmount: Number(allocation.grossAmount), platformFeeAmount: Number(allocation.platformFeeAmount), sellerNetAmount: Number(allocation.sellerNetAmount), feeRate: Number(allocation.feeRate) }));
};
