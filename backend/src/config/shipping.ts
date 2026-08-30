export const SHIPPING_METHODS = [
  { id: "STANDARD", name: "Standard shipping", estimatedDelivery: "5–7 business days", price: 8 },
  { id: "EXPRESS", name: "Express shipping", estimatedDelivery: "2–3 business days", price: 20 },
] as const;

export type ShippingMethodId = (typeof SHIPPING_METHODS)[number]["id"];

export const getShippingMethod = (id: string) => SHIPPING_METHODS.find((method) => method.id === id);
