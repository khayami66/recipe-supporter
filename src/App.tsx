import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import MenuPage from './pages/MenuPage';
import ShoppingListPage from './pages/ShoppingListPage';
import InventoryPage from './pages/InventoryPage';
import FavoritesPage from './pages/FavoritesPage';
import CalendarPage from './pages/CalendarPage';
import MobileShoppingPage from './pages/MobileShoppingPage';
import RecipeRatingModal from './components/RecipeRatingModal';
import { FamilyMember, MenuPlan, ShoppingListItem, InventoryItem, UserSettings } from './types';
import { generateMenuPlan, generateMenuWithDify } from './utils/menuGenerator';
import { generateShoppingList } from './utils/shoppingListGenerator';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';

function App() {
  const { user, loading: authLoading, signUp, signIn, signOut } = useAuth();
  const {
    userSettings,
    inventory,
    menuPlan,
    shoppingList,
    favorites,
    menuHistory,
    purchasedItems,
    completedDays,
    recipeRatings,
    loading: dataLoading,
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
  } = useUserData(user?.id || null);
  
  const [currentPage, setCurrentPage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [recipesToRate, setRecipesToRate] = useState<any[]>([]);

  // 認証が必要なページかチェック
  const requiresAuth = (page: string) => {
    return ['menu', 'shopping', 'mobile-shopping', 'inventory', 'favorites'].includes(page);
  };

  // 認証が必要なページにアクセスしようとした時の処理
  const handlePageChange = (page: string) => {
    if (requiresAuth(page) && !user) {
      setShowAuthModal(true);
      return;
    }
    setCurrentPage(page);
  };

  const handleSignOut = async () => {
    await signOut();
    clearUserData(); // ログアウト時はローカル状態をクリア（再ログイン時にDBから復元）
    setCurrentPage('home');
  };

  // 基本設定が未設定の場合は設定画面を表示
  useEffect(() => {
    if (user && userSettings.familyCount === 0 && (!userSettings.familyMembers || userSettings.familyMembers.length === 0)) {
      setCurrentPage('settings');
    } else if (user && menuPlan) {
      setCurrentPage('menu');
    }
  }, [user, userSettings.familyCount, userSettings.familyMembers, menuPlan]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    saveUserSettings(newSettings);
  };

  const handleGenerateMenu = (
    familyData: FamilyMember, 
    startDate: Date, 
    endDate: Date, 
    options?: {
      busyDates?: string[];
      maxCookingTime?: number;
      cuisineDistribution?: { japanese: number; western: number; chinese: number };
      useDifyBot?: boolean;
      difyConfig?: { apiEndpoint: string; apiKey: string };
    }
  ) => async () => {
    console.log('[メニュー生成開始]', {
      user: !!user,
      familyData,
      useDifyBot: options?.useDifyBot,
      hasConfig: !!options?.difyConfig,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // メニュー生成時に買い物リストをクリア
    saveShoppingList([]);
    
    let recipes: Recipe[];
    
    if (options?.useDifyBot && options?.difyConfig) {
      // Difyチャットボットを使用
      console.log('[Dify API使用] 設定:', options.difyConfig);
      try {
        recipes = await generateMenuWithDify(
          userSettings,
          inventory,
          startDate,
          endDate,
          options,
          options.difyConfig
        );
        console.log('[Dify生成成功] レシピ数:', recipes.length);
      } catch (error) {
        console.error('[Dify生成エラー]', error);
        throw error;
      }
    } else {
      // ローカル生成を使用
      console.log('[ローカル生成使用]');
      recipes = generateMenuPlan(
        familyData,
        startDate,
        endDate,
        userSettings,
        inventory,
        options?.busyDates,
        options?.maxCookingTime,
        options?.cuisineDistribution
      );
    }
    
    const newMenuPlan: MenuPlan = {
      recipes,
      generatedDate: new Date(),
      startDate,
      endDate,
    };
    console.log('[メニュープラン作成]', {
      recipesCount: recipes.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    saveMenuPlan(newMenuPlan);
    console.log('[画面遷移] menu画面へ');
    setCurrentPage('menu');
  };

  const handleGenerateShoppingList = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (menuPlan) {
      const newShoppingList = await generateShoppingList(menuPlan, inventory);
      saveShoppingList(newShoppingList);
      setCurrentPage('shopping');
    }
  };

  // 在庫が変更されたときに買い物リストを自動更新
  useEffect(() => {
    const updateShoppingListIfExists = async () => {
      if (user && menuPlan && shoppingList.length > 0) {
        const updatedShoppingList = await generateShoppingList(menuPlan, inventory);
        saveShoppingList(updatedShoppingList);
      }
    };

    updateShoppingListIfExists();
  }, [inventory, user, menuPlan]); // inventoryが変更されるたびに実行

  // 購入アイテムから在庫を更新
  const updateInventoryFromPurchase = async (purchasedItems: { ingredientName: string; amount: number; unit: string; category: string }[]) => {
    if (!user) return;

    // 現在の在庫を取得
    const currentInventory = [...inventory];
    
    // 購入したアイテムを在庫に反映
    purchasedItems.forEach(purchasedItem => {
      // 既存の在庫アイテムを検索
      const existingItemIndex = currentInventory.findIndex(item => 
        item.name === purchasedItem.ingredientName && 
        item.unit === purchasedItem.unit &&
        item.category === purchasedItem.category
      );
      
      if (existingItemIndex >= 0) {
        // 既存アイテムの数量を増加
        currentInventory[existingItemIndex] = {
          ...currentInventory[existingItemIndex],
          amount: currentInventory[existingItemIndex].amount + purchasedItem.amount,
        };
      } else {
        // 新しいアイテムを追加（デフォルトで1週間後の賞味期限）
        const newItem: InventoryItem = {
          id: crypto.randomUUID(),
          name: purchasedItem.ingredientName,
          amount: purchasedItem.amount,
          unit: purchasedItem.unit,
          category: purchasedItem.category as IngredientCategory,
          expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
          addedDate: new Date(),
        };
        currentInventory.push(newItem);
      }
    });
    
    // 更新された在庫を保存
    await saveInventory(currentInventory);
  };

  // 調理済みにマークして在庫から食材を消費
  const handleMarkAsCooked = async (dayRecipes: any[], date: Date) => {
    if (!user) return;

    // 評価モーダルを表示
    setRecipesToRate(dayRecipes);
    setShowRatingModal(true);
  };

  // 評価を保存して調理完了処理を実行
  const handleSubmitRatings = async (ratings: { recipeName: string; taste: number; cookingTime: number; difficulty: number; wouldMakeAgain: number }[]) => {
    if (!user || recipesToRate.length === 0) return;

    // 評価対象のレシピから日付を取得
    const date = recipesToRate[0]?.scheduledDate || new Date();

    try {
      // 使用した食材を在庫から引く
      const currentInventory = [...inventory];
      
      recipesToRate.forEach(recipe => {
        recipe.ingredients.forEach((ingredient: any) => {
          const existingItemIndex = currentInventory.findIndex(item => 
            item.name === ingredient.name && 
            item.unit === ingredient.unit &&
            item.category === ingredient.category
          );
          
          if (existingItemIndex >= 0) {
            const currentAmount = currentInventory[existingItemIndex].amount;
            const newAmount = Math.max(0, currentAmount - ingredient.amount);
            
            if (newAmount === 0) {
              // 在庫が0になった場合はアイテムを削除
              currentInventory.splice(existingItemIndex, 1);
            } else {
              // 在庫を減らす
              currentInventory[existingItemIndex] = {
                ...currentInventory[existingItemIndex],
                amount: newAmount,
              };
            }
          }
        });
      });
      
      // 更新された在庫を保存
      await saveInventory(currentInventory);
      
      // 評価と一緒に調理済みとしてマーク
      await markDayAsCompleted(date, recipesToRate, ratings);
      
      // モーダルを閉じる
      setShowRatingModal(false);
      setRecipesToRate([]);
    } catch (error) {
      console.error('[調理完了エラー]', error);
      throw error;
    }
  };

  const handleBackToHome = () => {
    // メニュープランと買い物リストをクリア
    saveMenuPlan(null);
    saveShoppingList([]);
    setCurrentPage('home');
  };

  const handleNavigateToSettings = () => {
    setCurrentPage('settings');
  };

  // 認証中の表示
  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            settings={userSettings}
            onGenerateMenu={handleGenerateMenu}
            onNavigateToSettings={handleNavigateToSettings}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            settings={userSettings}
            onUpdateSettings={handleUpdateSettings}
          />
        );
      case 'menu':
        if (!user) {
          setShowAuthModal(true);
          return (
            <HomePage
              settings={userSettings}
              onGenerateMenu={handleGenerateMenu}
              onNavigateToSettings={handleNavigateToSettings}
            />
          );
        }
        return (
          <MenuPage
            menuPlan={menuPlan}
            onGenerateShoppingList={handleGenerateShoppingList}
            onBackToHome={handleBackToHome}
            onAddToFavorites={addToFavorites}
            onRemoveFromFavorites={removeFromFavorites}
            onUpdateMenuPlan={saveMenuPlan}
            favorites={favorites}
            userSettings={userSettings}
          />
        );
      case 'shopping':
        if (!user) {
          setShowAuthModal(true);
          return (
            <HomePage
              settings={userSettings}
              onGenerateMenu={handleGenerateMenu}
              onNavigateToSettings={handleNavigateToSettings}
            />
          );
        }
        return (
          <ShoppingListPage
            shoppingList={shoppingList}
            onUpdateShoppingList={saveShoppingList}
            onNavigateToMobileShopping={() => setCurrentPage('mobile-shopping')}
          />
        );
      case 'mobile-shopping':
        if (!user) {
          setShowAuthModal(true);
          return (
            <HomePage
              settings={userSettings}
              onGenerateMenu={handleGenerateMenu}
              onNavigateToSettings={handleNavigateToSettings}
            />
          );
        }
        return (
          <MobileShoppingPage
            shoppingList={shoppingList}
            purchasedItems={purchasedItems}
            onUpdateShoppingList={saveShoppingList}
            onSavePurchasedItems={savePurchasedItems}
            onUpdateInventoryFromPurchase={updateInventoryFromPurchase}
            onBack={() => setCurrentPage('shopping')}
          />
        );
      case 'inventory':
        if (!user) {
          setShowAuthModal(true);
          return (
            <HomePage
              settings={userSettings}
              onGenerateMenu={handleGenerateMenu}
              onNavigateToSettings={handleNavigateToSettings}
            />
          );
        }
        return (
          <InventoryPage
            inventory={inventory}
            onUpdateInventory={saveInventory}
          />
        );
      case 'favorites':
        if (!user) {
          setShowAuthModal(true);
          return (
            <HomePage
              settings={userSettings}
              onGenerateMenu={handleGenerateMenu}
              onNavigateToSettings={handleNavigateToSettings}
            />
          );
        }
        return (
          <FavoritesPage
            favorites={favorites}
            recipeRatings={recipeRatings}
            onRemoveFromFavorites={removeFromFavorites}
          />
        );
      case 'calendar':
        return (
          <CalendarPage
            menuHistory={menuHistory}
            onMarkAsCooked={handleMarkAsCooked}
            completedDays={completedDays}
            onResetDay={resetDayCompletion}
          />
        );
      default:
        return (
          <HomePage
            settings={userSettings}
            onGenerateMenu={handleGenerateMenu}
            onNavigateToSettings={handleNavigateToSettings}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="md:ml-64">
        {renderCurrentPage()}
      </main>

      {/* Navigation */}
      <Navigation 
        currentPage={currentPage} 
        onPageChange={handlePageChange}
        user={user}
        onSignOut={handleSignOut}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignUp={signUp}
        onSignIn={signIn}
      />

      {/* Recipe Rating Modal */}
      <RecipeRatingModal
        isOpen={showRatingModal}
        recipes={recipesToRate}
        onClose={() => {
          setShowRatingModal(false);
          setRecipesToRate([]);
        }}
        onSubmitRatings={handleSubmitRatings}
      />
    </div>
  );
}

export default App;