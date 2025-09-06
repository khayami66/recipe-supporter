import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserSettings, InventoryItem, MenuPlan, ShoppingListItem, FavoriteRecipe, PurchasedItem, Recipe, RecipeRating } from '../types';

export const useUserData = (userId: string | null) => {
  const [userSettings, setUserSettings] = useState<UserSettings>({
    familyCount: 0,
    preferences: '',
    familyMembers: [],
    lastUpdated: new Date(),
    recipeFrequency: {
      S: 2, // デフォルト: 2日に1回
      A: 3, // デフォルト: 3日に1回
      B: 7, // デフォルト: 7日に1回
      C: 30, // デフォルト: 30日に1回
    },
  });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [menuPlan, setMenuPlan] = useState<MenuPlan | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [menuHistory, setMenuHistory] = useState<MenuPlan[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [recipeRatings, setRecipeRatings] = useState<RecipeRating[]>([]);
  const [loading, setLoading] = useState(false);

  // レシピ評価を読み込み
  const loadRecipeRatings = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_recipe_ratings')
        .select('*')
        .eq('user_id', userId)
        .order('rated_date', { ascending: false });

      if (error) {
        console.error('Error loading recipe ratings:', error);
        return;
      }

      const ratings: RecipeRating[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        recipeName: item.recipe_name,
        taste: item.taste,
        cookingTime: item.cooking_time,
        difficulty: item.difficulty,
        wouldMakeAgain: item.would_make_again,
        ratedDate: new Date(item.rated_date),
        createdAt: new Date(item.created_at),
      }));

      setRecipeRatings(ratings);
    } catch (error) {
      console.error('Error loading recipe ratings:', error);
    }
  };

  // ユーザー設定を読み込み
  const loadUserSettings = async () => {
    if (!userId) return;

    try {
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading user settings:', error);
        return;
      }


      if (data) {
        console.log('[loadUserSettings] データベースから取得した生データ:', data);
        
        // family_membersの処理
        let familyMembers = [];
        console.log('[loadUserSettings] family_members型:', typeof data.family_members, 'データ:', data.family_members);
        
        // family_membersがtext型なので、JSON文字列として扱う
        let parsedFamilyMembers = [];
        if (data.family_members) {
          try {
            if (typeof data.family_members === 'string') {
              parsedFamilyMembers = JSON.parse(data.family_members);
            } else if (Array.isArray(data.family_members)) {
              parsedFamilyMembers = data.family_members;
            }
          } catch (e) {
            console.error('[loadUserSettings] JSON parse error:', e);
            parsedFamilyMembers = [];
          }
        }
        
        if (Array.isArray(parsedFamilyMembers) && parsedFamilyMembers.length > 0) {
          console.log('[loadUserSettings] family_membersが存在する場合の処理');
          familyMembers = parsedFamilyMembers.map((member: any) => ({
            ...member,
            birthDate: member.birthDate ? (() => {
              const date = new Date(member.birthDate);
              return isNaN(date.getTime()) ? new Date('') : date;
            })() : new Date('')
          }));
        } else if (data.family_count > 0) {
          console.log('[loadUserSettings] family_membersが空だがfamily_countがある場合、デフォルトを生成');
          // family_membersが空だがfamily_countがある場合、デフォルトを生成
          familyMembers = Array.from({ length: data.family_count }, (_, i) => ({
            id: crypto.randomUUID(),
            birthDate: new Date(''),
            gender: 'male',
            appetiteLevel: 3,
            name: `家族${i + 1}`,
          }));
        }

        const settings = {
          familyCount: data.family_count || 0,
          preferences: data.preferences || '',
          familyMembers,
          healthMode: data.health_mode || 'normal',
          recipeFrequency: data.recipe_frequency || {
            S: 2,
            A: 3,
            B: 7,
            C: 30,
          },
          lastUpdated: data.updated_at ? new Date(data.updated_at) : new Date(),
        };

        setUserSettings(settings);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // ユーザー設定を保存
  const saveUserSettings = async (settings: UserSettings) => {
    if (!userId) {
      console.warn('No user ID available for saving settings');
      return;
    }

    try {
      console.log('[saveUserSettings] 保存する設定:', settings);
      
      // family_membersをJSON文字列として保存（text型のため）
      const familyMembersForDB = settings.familyMembers?.map(member => ({
        ...member,
        birthDate: member.birthDate instanceof Date && !isNaN(member.birthDate.getTime()) 
          ? member.birthDate.toISOString() 
          : null
      })) || [];

      // JSON文字列に変換
      const familyMembersJSON = JSON.stringify(familyMembersForDB);

      console.log('[saveUserSettings] データベース保存用データ:', {
        family_count: settings.familyCount,
        family_members: familyMembersJSON,
        preferences: settings.preferences
      });


      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          family_count: settings.familyCount,
          preferences: settings.preferences,
          family_members: familyMembersJSON,
          health_mode: settings.healthMode,
          recipe_frequency: settings.recipeFrequency,
          updated_at: new Date().toISOString(),
        })
        .select();

      if (error) {
        console.error('Error saving user settings:', error);
        return;
      }

      console.log('[saveUserSettings] 保存成功:', data);
      setUserSettings(settings);
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  // 在庫を読み込み
  const loadInventory = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading inventory:', error);
        return;
      }

      const inventoryItems: InventoryItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        amount: parseFloat(item.amount),
        unit: item.unit,
        category: item.category as any,
        expirationDate: new Date(item.expiration_date),
        addedDate: new Date(item.created_at),
      }));

      setInventory(inventoryItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  // 在庫を保存
  const saveInventory = async (inventoryItems: InventoryItem[]) => {
    if (!userId) return;

    try {
      // 既存の在庫を削除
      await supabase
        .from('user_inventory')
        .delete()
        .eq('user_id', userId);

      // 新しい在庫を挿入
      if (inventoryItems.length > 0) {
        const { error } = await supabase
          .from('user_inventory')
          .insert(
            inventoryItems.map(item => {
              return {
                id: item.id,
                user_id: userId,
                name: item.name,
                amount: item.amount,
                unit: item.unit,
                category: item.category,
                expiration_date: item.expirationDate.toISOString().split('T')[0],
                created_at: item.addedDate.toISOString(),
              };
            })
          );

        if (error) {
          console.error('Error saving inventory:', error);
          return;
        }
      }

      setInventory(inventoryItems);
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  };

  // メニュープランを読み込み
  const loadMenuPlan = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_menu_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading menu plan:', error);
        return;
      }

      if (data) {
        setMenuPlan({
          recipes: data.recipes.map((recipe: any) => ({
            ...recipe,
            scheduledDate: new Date(recipe.scheduledDate)
          })),
          generatedDate: new Date(data.generated_date),
          startDate: new Date(data.generated_date),
          endDate: new Date(data.generated_date),
        });
      }
    } catch (error) {
      console.error('Error loading menu plan:', error);
    }
  };

  // メニュー履歴を読み込み
  const loadMenuHistory = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_menu_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading menu history:', error);
        return;
      }

      const menuPlans: MenuPlan[] = data.map(item => ({
        recipes: item.recipes.map((recipe: any) => ({
          ...recipe,
          scheduledDate: new Date(recipe.scheduledDate)
        })),
        generatedDate: new Date(item.generated_date),
        startDate: new Date(item.generated_date), // 個別保存なので同じ日付
        endDate: new Date(item.generated_date),
      }));

      setMenuHistory(menuPlans);
    } catch (error) {
      console.error('Error loading menu history:', error);
    }
  };

  // メニュープランを保存
  const saveMenuPlan = async (plan: MenuPlan | null) => {
    if (!userId) return;

    // nullの場合はメニュープランをクリア
    if (!plan) {
      setMenuPlan(null);
      return;
    }

    try {
      // 期間が重複するメニューを削除
      const { error: deleteError } = await supabase
        .from('user_menu_plans')
        .delete()
        .eq('user_id', userId)
        .gte('generated_date', plan.startDate.toISOString().split('T')[0])
        .lte('generated_date', plan.endDate.toISOString().split('T')[0]);

      if (deleteError) {
        console.error('Error deleting overlapping menu plans:', deleteError);
      }

      // 各レシピを個別に保存（日付ごと）
      const insertPromises = plan.recipes.map(recipe => 
        supabase
          .from('user_menu_plans')
          .insert({
            user_id: userId,
            recipes: [recipe], // 1つのレシピのみを配列で保存
            generated_date: recipe.scheduledDate.toISOString(),
          })
      );

      const results = await Promise.all(insertPromises);
      
      // エラーチェック
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Error saving menu plan:', errors);
        return;
      }

      setMenuPlan(plan);
      // 履歴も更新
      await loadMenuHistory();
    } catch (error) {
      console.error('Error saving menu plan:', error);
    }
  };

  // 買い物リストを読み込み
  const loadShoppingList = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_shopping_lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading shopping list:', error);
        return;
      }

      if (data) {
        setShoppingList(data.items.map((item: any) => ({
          ...item,
          breakdown: item.breakdown || []
        })));
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  };

  // 買い物リストを保存
  const saveShoppingList = async (items: ShoppingListItem[]) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_shopping_lists')
        .upsert({
          user_id: userId,
          items: items,
        });

      if (error) {
        console.error('Error saving shopping list:', error);
        return;
      }

      setShoppingList(items);
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  };

  // 購入済みアイテムを読み込み
  const loadPurchasedItems = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_purchased_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading purchased items:', error);
        return;
      }

      const items: PurchasedItem[] = data.map(item => ({
        id: item.id,
        ingredientName: item.ingredient_name,
        amount: parseFloat(item.amount),
        unit: item.unit,
        category: item.category as any,
        purchasedDate: new Date(item.purchased_date),
        createdAt: new Date(item.created_at),
      }));

      setPurchasedItems(items);
    } catch (error) {
      console.error('Error loading purchased items:', error);
    }
  };

  // 購入済みアイテムを保存
  const savePurchasedItems = async (items: { ingredientName: string; amount: number; unit: string; category: string }[]) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_purchased_items')
        .insert(
          items.map(item => ({
            user_id: userId,
            ingredient_name: item.ingredientName,
            amount: item.amount,
            unit: item.unit,
            category: item.category,
            purchased_date: new Date().toISOString().split('T')[0],
          }))
        );

      if (error) {
        console.error('Error saving purchased items:', error);
        return;
      }

      // 購入済みアイテムを再読み込み
      await loadPurchasedItems();
    } catch (error) {
      console.error('Error saving purchased items:', error);
    }
  };

  // お気に入りを読み込み
  const loadFavorites = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading favorites:', error);
        return;
      }

      const favoriteRecipes: FavoriteRecipe[] = data.map(item => ({
        id: item.id,
        recipeName: item.recipe_name,
        cookingTime: item.cooking_time,
        difficulty: item.difficulty,
        ingredients: item.ingredients,
        createdAt: new Date(item.created_at),
      }));

      setFavorites(favoriteRecipes);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  // お気に入りを追加
  const addToFavorites = async (recipe: { name: string; cookingTime: number; difficulty: number; ingredients: any[] }) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: userId,
          recipe_name: recipe.name,
          cooking_time: recipe.cookingTime,
          difficulty: recipe.difficulty,
          ingredients: recipe.ingredients,
        });

      if (error) {
        console.error('Error adding to favorites:', error);
        return;
      }

      // お気に入りを再読み込み
      await loadFavorites();
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  // お気に入りを削除
  const removeFromFavorites = async (favoriteId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) {
        console.error('Error removing from favorites:', error);
        return;
      }

      // お気に入りを再読み込み
      await loadFavorites();
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  // 完了した日を読み込み
  const loadCompletedDays = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_completed_days')
        .select('completed_date')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading completed days:', error);
        return;
      }

      const completedSet = new Set<string>();
      data.forEach(item => {
        const date = new Date(item.completed_date);
        completedSet.add(date.toDateString());
      });

      setCompletedDays(completedSet);
    } catch (error) {
      console.error('Error loading completed days:', error);
    }
  };

  // 日を完了としてマーク
  const markDayAsCompleted = async (date: Date, recipes: Recipe[], ratings?: { recipeName: string; taste: number; cookingTime: number; difficulty: number; wouldMakeAgain: number }[]) => {
    if (!userId) return;

    try {
      // 評価データがある場合は保存
      if (ratings && ratings.length > 0) {
        // 各レシピの既存評価を個別に削除してから挿入（上書き）
        for (const rating of ratings) {
          // 既存の評価を削除
          await supabase
            .from('user_recipe_ratings')
            .delete()
            .eq('user_id', userId)
            .eq('recipe_name', rating.recipeName);
        }

        const { error: ratingsError } = await supabase
          .from('user_recipe_ratings')
          .insert(
            ratings.map(rating => ({
              user_id: userId,
              recipe_name: rating.recipeName,
              taste: rating.taste,
              cooking_time: rating.cookingTime,
              difficulty: rating.difficulty,
              would_make_again: rating.wouldMakeAgain,
              rated_date: date.toISOString().split('T')[0],
            }))
          );

        if (ratingsError) {
          console.error('Error saving recipe ratings:', ratingsError);
        }
        
        // 評価データをリアルタイムで更新
        await loadRecipeRatings();
      }

      const { error } = await supabase
        .from('user_completed_days')
        .upsert({
          user_id: userId,
          completed_date: date.toISOString().split('T')[0],
          recipes_used: recipes,
        }, {
          onConflict: 'user_id,completed_date'
        });

      if (error) {
        console.error('Error marking day as completed:', error);
        return;
      }

      // ローカル状態を更新
      const newCompletedDays = new Set(completedDays);
      newCompletedDays.add(date.toDateString());
      setCompletedDays(newCompletedDays);
    } catch (error) {
      console.error('Error marking day as completed:', error);
    }
  };

  // 完了状態をリセット
  const resetDayCompletion = async (date: Date) => {
    if (!userId) return;

    try {
      // 完了記録を削除
      await supabase
        .from('user_completed_days')
        .delete()
        .eq('user_id', userId)
        .eq('completed_date', date.toISOString().split('T')[0]);

      // 評価記録も削除
      await supabase
        .from('user_recipe_ratings')
        .delete()
        .eq('user_id', userId)
        .eq('rated_date', date.toISOString().split('T')[0]);

      // ローカル状態を更新
      const newCompletedDays = new Set(completedDays);
      newCompletedDays.delete(date.toDateString());
      setCompletedDays(newCompletedDays);
    } catch (error) {
      console.error('Error resetting day completion:', error);
      throw error;
    }
  };
  // データをクリア
  const clearUserData = () => {
    setUserSettings({
      familyCount: 0,
      preferences: '',
      familyMembers: [],
      healthMode: 'normal',
      recipeFrequency: {
        S: 2,
        A: 3,
        B: 7,
        C: 30,
      },
      lastUpdated: new Date(),
    });
    setInventory([]);
    setMenuPlan(null);
    setShoppingList([]);
    setFavorites([]);
    setMenuHistory([]);
    setPurchasedItems([]);
    setCompletedDays(new Set());
    setRecipeRatings([]);
  };

  // 全データを読み込み
  const loadAllData = async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    
    try {
      await Promise.all([
        loadUserSettings(),
        loadInventory(),
        loadMenuPlan(),
        loadShoppingList(),
        loadFavorites(),
        loadMenuHistory(),
        loadPurchasedItems(),
        loadCompletedDays(),
        loadRecipeRatings(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ユーザーIDが変更されたときにデータを読み込み
  useEffect(() => {
    if (userId) {
      loadAllData();
    } else {
      // ログアウト時はローカル状態をリセット（DBのデータは保持される）
      clearUserData();
    }
  }, [userId]);

  return {
    userSettings,
    inventory,
    menuPlan,
    shoppingList,
    favorites,
    menuHistory,
    purchasedItems,
    completedDays,
    recipeRatings,
    loading,
    saveUserSettings,
    saveInventory,
    saveMenuPlan,
    saveShoppingList,
    addToFavorites,
    removeFromFavorites,
    savePurchasedItems,
    markDayAsCompleted,
    clearUserData,
    resetDayCompletion,
  };
};