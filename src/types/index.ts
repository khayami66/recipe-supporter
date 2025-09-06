export interface FamilyMember {
  count: number;
  preferences?: string;
}

export interface FamilyMemberDetail {
  id: string;
  birthDate: Date;
  gender: 'male' | 'female';
  appetiteLevel: number; // 1-5段階
  name?: string;
}

export interface Recipe {
  id: string;
  name: string;
  cookingTime: number; // minutes
  difficulty: number; // 1-5 stars
  ingredients: Ingredient[];
  day: string;
  scheduledDate: Date;
  category: 'main' | 'side' | 'soup';
}

export interface Meal {
  id: string;
  day: string;
  scheduledDate: Date;
  main: Recipe;
  side?: Recipe;
  soup?: Recipe;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
}

export interface InventoryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  expirationDate: Date;
  addedDate: Date;
}

export type IngredientCategory = '野菜' | '肉・魚' | '調味料' | 'その他';

export interface MenuPlan {
  recipes: Recipe[];
  generatedDate: Date;
  startDate: Date;
  endDate: Date;
}

export interface ShoppingListItem {
  ingredient: Ingredient;
  needed: number;
  inStock: number;
  isChecked: boolean;
  breakdown: RecipeBreakdown[];
}

export interface RecipeBreakdown {
  recipeName: string;
  day: string;
  amount: number;
}

export interface UserSettings {
  familyCount: number;
  preferences: string;
  familyMembers: FamilyMemberDetail[];
  lastUpdated: Date;
  healthMode: 'normal' | 'diet' | 'workout';
  recipeFrequency: {
    S: number; // 何日に1回
    A: number;
    B: number;
    C: number;
  };
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export interface FavoriteRecipe {
  id: string;
  recipeName: string;
  cookingTime: number;
  difficulty: number;
  ingredients: Ingredient[];
  createdAt: Date;
}

export interface PurchasedItem {
  id: string;
  ingredientName: string;
  amount: number;
  unit: string;
  category: IngredientCategory;
  purchasedDate: Date;
  createdAt: Date;
}

export interface RecipeRating {
  id: string;
  userId: string;
  recipeName: string;
  taste: number; // 1-5 (おいしかった)
  cookingTime: number; // 1-5 (調理時間の満足度)
  difficulty: number; // 1-5 (難易度の満足度)
  wouldMakeAgain: number; // 1-5 (またつくりたい)
  ratedDate: Date;
  createdAt: Date;
}