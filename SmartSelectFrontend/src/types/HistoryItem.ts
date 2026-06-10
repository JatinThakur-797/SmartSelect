
import { Category } from "./Category";
import { Product } from "./Product";

export interface HistoryItem {
  id: number;
  category: Category;
  budget: number;
  profession: string;
  usage: string;
  products: Product[];
  createdAt: string;
}