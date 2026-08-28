import { SellerProductForm } from "@/components/seller-product-form";
export default async function EditSellerProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <SellerProductForm productId={id} />; }
