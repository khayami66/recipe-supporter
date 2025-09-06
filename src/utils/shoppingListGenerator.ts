import { Recipe, ShoppingListItem, InventoryItem, RecipeBreakdown, MenuPlan } from '../types';
import { supabase } from '../lib/supabase';

export const generateShoppingList = (
  menuPlan: MenuPlan,
  inventory: InventoryItem[]
): Promise<ShoppingListItem[]> => {
  return generateShoppingListFromDatabase(menuPlan, inventory);
};

const generateShoppingListFromDatabase = async (
  menuPlan: MenuPlan,
  inventory: InventoryItem[]
): Promise<ShoppingListItem[]> => {
  // すべてのレシピから必要な食材を収集
  const neededIngredients = new Map<string, { amount: number; ingredient: any; breakdown: RecipeBreakdown[] }>();

  menuPlan.recipes.forEach(recipe => {
    recipe.ingredients.forEach(ingredient => {
      const key = ingredient.name;
      if (neededIngredients.has(key)) {
        const existing = neededIngredients.get(key)!;
        existing.amount += ingredient.amount;
        existing.breakdown.push({
          recipeName: recipe.name,
          day: recipe.day,
          amount: ingredient.amount,
        });
      } else {
        neededIngredients.set(key, {
          amount: ingredient.amount,
          ingredient,
          breakdown: [{
            recipeName: recipe.name,
            day: recipe.day,
            amount: ingredient.amount,
          }],
        });
      }
    });
  });

  // 在庫と照らし合わせて買い物リストを作成
  const shoppingList: ShoppingListItem[] = [];

  neededIngredients.forEach(({ amount, ingredient, breakdown }, name) => {
    const inventoryItem = inventory.find(item => 
      item.name === name && item.unit === ingredient.unit
    );
    
    const inStock = inventoryItem ? inventoryItem.amount : 0;
    
    shoppingList.push({
      ingredient,
      needed: amount,
      inStock,
      isChecked: false,
      breakdown,
    });
  });

  return shoppingList.sort((a, b) => {
    // カテゴリ順でソート
    const categoryOrder = ['野菜', '肉・魚', '調味料', 'その他'];
    const aIndex = categoryOrder.indexOf(a.ingredient.category);
    const bIndex = categoryOrder.indexOf(b.ingredient.category);
    
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    
    // 同じカテゴリ内では名前順
    return a.ingredient.name.localeCompare(b.ingredient.name, 'ja');
  });
};