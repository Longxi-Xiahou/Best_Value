import { SHIPPING_METHODS, getShippingMethod } from "../config/shipping.js";
import { ApiError } from "../utils/api-error.js";

export const listShippingMethods = () => SHIPPING_METHODS;

export const requireShippingMethod = (id: string) => {
  const method = getShippingMethod(id);
  if (!method) throw new ApiError(400, "Shipping method is not available", "SHIPPING_METHOD_NOT_FOUND");
  return method;
};
