export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  imageUrl?: string;
  categoryName: string;
}
