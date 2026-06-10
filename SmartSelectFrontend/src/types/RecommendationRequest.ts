import { Category } from "./Category";

export interface RecommendationRequest {
  category: Category;
  budget: number;
  profession: string;
  usage: string;
  // Optional shared
  brandPreference?: string;
  // Laptop-specific
  ram?: string;
  storage?: string;
  processor?: string;
  graphicsCard?: string;
  displaySize?: string;
  // Smartphone-specific
  smartphoneRam?: string;
  smartphoneStorage?: string;
  cameraPriority?: string;
  battery?: string;
  fiveGPreference?: string;
}
