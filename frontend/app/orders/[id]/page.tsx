import { OrderDetailPage } from "@/components/order-detail-page";

export default async function OrderDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailPage id={id} />;
}
