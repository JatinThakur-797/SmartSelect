
import { Category } from "./Category";
import { Product } from "./Product";

export interface RecommendationResponse {
  products: Product[];
  category: Category;
  budget: number;
  profession: string;
  servedFromCache: boolean;
  cachedAt: string | null;
  cacheAgeLabel: string | null;
  generatedAt: string;
}