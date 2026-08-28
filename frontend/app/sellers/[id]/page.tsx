import { SellerProfile } from "@/components/seller-profile";
export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <SellerProfile id={id} />; }
