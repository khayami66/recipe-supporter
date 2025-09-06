import React from 'react';
import { Clock, Star, ChevronDown, ChevronUp, ShoppingCart, Heart, Utensils, Soup, Salad, RefreshCw, CheckCircle } from 'lucide-react';
import { MenuPlan, FavoriteRecipe } from '../types';
import { generateMenuPlan } from '../utils/menuGenerator';

interface MenuPageProps {
  menuPlan: MenuPlan | null;
  onGenerateShoppingList: () => Promise<void>;
  onBackToHome: () => void;
  onAddToFavorites: (recipe: { name: string; cookingTime: number; difficulty: number; ingredients: any[] }) => void;
  onRemoveFromFavorites: (recipeName: string) => void;
  onUpdateMenuPlan: (updatedMenuPlan: MenuPlan) => void;
  favorites: FavoriteRecipe[];
  userSettings: { familyCount: number; preferences: string };
}

const MenuPage: React.FC<MenuPageProps> = ({ 
  menuPlan, 
  onGenerateShoppingList, 
  onBackToHome, 
  onAddToFavorites, 
  onRemoveFromFavorites,
  onUpdateMenuPlan,
  favorites,
  userSettings,
}) => {
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());
  const [draggedDay, setDraggedDay] = React.useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = React.useState<string | null>(null);
  const [isChangingDay, setIsChangingDay] = React.useState<string | null>(null);

  const toggleCard = (recipeId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(recipeId)) {
      newExpanded.delete(recipeId);
    } else {
      newExpanded.add(recipeId);
    }
    setExpandedCards(newExpanded);
  };

  const handleAddToFavorites = (recipe: any) => {
    onAddToFavorites({
      name: recipe.name,
      cookingTime: recipe.cookingTime,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
    });
  };

  const handleRemoveFromFavorites = (recipeName: string) => {
    const favorite = favorites.find(fav => fav.recipeName === recipeName);
    if (favorite) {
      onRemoveFromFavorites(favorite.id);
    }
  };

  const handleToggleFavorite = (recipe: any) => {
    if (isInFavorites(recipe.name)) {
      handleRemoveFromFavorites(recipe.name);
    } else {
      handleAddToFavorites(recipe);
    }
  };

  const isInFavorites = (recipeName: string) => {
    return favorites.some(fav => fav.recipeName === recipeName);
  };

  // メニュー内容を入れ替える（日付・曜日は固定）
  const swapMenuContents = (day1: string, day2: string) => {
    if (!menuPlan || day1 === day2) return;

    // 各曜日のレシピを取得（カテゴリ別に整理）
    const day1Recipes = menuPlan.recipes.filter(recipe => recipe.day === day1);
    const day2Recipes = menuPlan.recipes.filter(recipe => recipe.day === day2);
    
    // カテゴリ別にレシピを分類
    const getRecipesByCategory = (recipes: any[]) => ({
      main: recipes.find(r => r.category === 'main') || null,
      side: recipes.find(r => r.category === 'side') || null,
      soup: recipes.find(r => r.category === 'soup') || null,
    });
    
    const day1Menu = getRecipesByCategory(day1Recipes);
    const day2Menu = getRecipesByCategory(day2Recipes);
    
    // 献立全体を入れ替え（削除なし、内容のみ入れ替え）
    const updatedRecipes = menuPlan.recipes.map(recipe => {
      if (recipe.day === day1) {
        // day1のレシピにday2の献立内容を適用
        const day2Recipe = day2Menu[recipe.category as keyof typeof day2Menu];
        if (day2Recipe) {
          return {
            ...recipe, // 元のID、日付、曜日を維持
            name: day2Recipe.name,
            cookingTime: day2Recipe.cookingTime,
            difficulty: day2Recipe.difficulty,
            ingredients: day2Recipe.ingredients,
          };
        }
        // day2に対応するカテゴリがない場合は削除対象としてマーク
        return { ...recipe, _shouldRemove: true };
      } else if (recipe.day === day2) {
        // day2のレシピにday1の献立内容を適用
        const day1Recipe = day1Menu[recipe.category as keyof typeof day1Menu];
        if (day1Recipe) {
          return {
            ...recipe, // 元のID、日付、曜日を維持
            name: day1Recipe.name,
            cookingTime: day1Recipe.cookingTime,
            difficulty: day1Recipe.difficulty,
            ingredients: day1Recipe.ingredients,
          };
        }
        // day1に対応するカテゴリがない場合は削除対象としてマーク
        return { ...recipe, _shouldRemove: true };
      }
      // その他の曜日はそのまま
      return recipe;
    });
    
    // 削除対象のレシピを除外
    const filteredRecipes = updatedRecipes.filter(recipe => !recipe._shouldRemove);
    
    // 新しく追加が必要なレシピを処理
    const addNewRecipes = (targetDay: string, sourceMenu: any, targetDate: Date) => {
      ['main', 'side', 'soup'].forEach(category => {
        const sourceRecipe = sourceMenu[category];
        if (sourceRecipe) {
          // 対象の曜日に既にそのカテゴリのレシピがあるかチェック
          const existsInTarget = filteredRecipes.some(r => 
            r.day === targetDay && r.category === category
          );
          
          if (!existsInTarget) {
            // 新しいレシピを追加
            filteredRecipes.push({
              ...sourceRecipe,
              id: `${sourceRecipe.id}-swapped-${Date.now()}-${Math.random()}`,
              day: targetDay,
              scheduledDate: targetDate,
            });
          }
        }
      });
    };
    
    // day1にday2の献立を追加（不足分）
    addNewRecipes(day1, day2Menu, day1Recipes[0]?.scheduledDate || new Date());
    
    // day2にday1の献立を追加（不足分）
    addNewRecipes(day2, day1Menu, day2Recipes[0]?.scheduledDate || new Date());

    const updatedMenuPlan = { ...menuPlan, recipes: filteredRecipes };
    onUpdateMenuPlan(updatedMenuPlan);
  };

  // 特定の曜日のメニューを変更
  const changeDayMenu = async (day: string) => {
    if (!menuPlan) return;

    setIsChangingDay(day);

    try {
      // その日の日付を取得
      const dayRecipes = menuPlan.recipes.filter(recipe => recipe.day === day);
      if (dayRecipes.length === 0) return;
      
      const targetDate = dayRecipes[0].scheduledDate;
      
      // 既存のその日のレシピを削除
      const updatedRecipes = menuPlan.recipes.filter(recipe => recipe.day !== day);
      
      // 新しいレシピを生成
      const familyData = {
        count: userSettings.familyCount,
        preferences: userSettings.preferences || undefined,
      };

      const newRecipes = generateMenuPlan(familyData, targetDate, targetDate).map(recipe => ({
        ...recipe,
        scheduledDate: new Date(targetDate), // 正確な日付を設定
        day: day // 正確な曜日を設定
      }));
      
      // 削除後のレシピリストに新しいレシピを追加
      const finalRecipes = updatedRecipes.concat(newRecipes);

      const updatedMenuPlan = { ...menuPlan, recipes: finalRecipes };
      onUpdateMenuPlan(updatedMenuPlan);
    } catch (error) {
      console.error('Error changing day menu:', error);
    } finally {
      setIsChangingDay(null);
    }
  };

  // ドラッグ&ドロップのハンドラー
  const handleDragStart = (e: React.DragEvent, day: string) => {
    setDraggedDay(day);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    if (draggedDay && draggedDay !== day) {
      swapMenuContents(draggedDay, day);
    }
    setDraggedDay(null);
    setDragOverDay(null);
  };

  const handleDragEnd = () => {
    setDraggedDay(null);
    setDragOverDay(null);
  };

  // タッチイベントのハンドラー（モバイル対応）
  const handleTouchStart = (day: string) => {
    setDraggedDay(day);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dayCard = element?.closest('[data-day]');
    if (dayCard) {
      const day = dayCard.getAttribute('data-day');
      if (day) {
        setDragOverDay(day);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (draggedDay && dragOverDay && draggedDay !== dragOverDay) {
      swapMenuContents(draggedDay, dragOverDay);
    }
    setDraggedDay(null);
    setDragOverDay(null);
  };

  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      '月曜日': 'border-l-red-400 bg-red-50',
      '火曜日': 'border-l-orange-400 bg-orange-50',
      '水曜日': 'border-l-yellow-400 bg-yellow-50',
      '木曜日': 'border-l-green-400 bg-green-50',
      '金曜日': 'border-l-blue-400 bg-blue-50',
      '土曜日': 'border-l-indigo-400 bg-indigo-50',
      '日曜日': 'border-l-purple-400 bg-purple-50',
    };
    return colors[day] || 'border-l-gray-400 bg-gray-50';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'main': return <Utensils size={16} className="text-red-600" />;
      case 'side': return <Salad size={16} className="text-green-600" />;
      case 'soup': return <Soup size={16} className="text-blue-600" />;
      default: return <Utensils size={16} className="text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'main': return '主菜';
      case 'side': return '副菜';
      case 'soup': return '汁物';
      default: return '';
    }
  };

  // 日付ごとにレシピをグループ化
  const groupedRecipes = menuPlan?.recipes
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()) // 日付順でソート
    .reduce((acc, recipe) => {
    const dateKey = recipe.scheduledDate.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: recipe.scheduledDate,
        day: recipe.day,
        recipes: []
      };
    }
    acc[dateKey].recipes.push(recipe);
    return acc;
  }, {} as Record<string, { date: Date; day: string; recipes: any[] }>) || {};

  if (!menuPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">メニューがまだ生成されていません</p>
          <button
            onClick={onBackToHome}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">今週のメニュー</h1>
          <p className="text-sm text-gray-600 mt-1">
            {menuPlan.generatedDate.toLocaleDateString('ja-JP')} に生成
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(groupedRecipes).map((dayGroup) => {
            const dayKey = dayGroup.date.toDateString();
            const isExpanded = expandedCards.has(dayKey);
            const isDragging = draggedDay === dayGroup.day;
            const isDragOver = dragOverDay === dayGroup.day;
            const isChanging = isChangingDay === dayGroup.day;
            const mainRecipe = dayGroup.recipes.find(r => r.category === 'main');
            const sideRecipes = dayGroup.recipes.filter(r => r.category === 'side');
            const soupRecipes = dayGroup.recipes.filter(r => r.category === 'soup');
            
            return (
              <div
                key={dayKey}
                data-day={dayGroup.day}
                draggable
                onDragStart={(e) => handleDragStart(e, dayGroup.day)}
                onDragOver={(e) => handleDragOver(e, dayGroup.day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dayGroup.day)}
                onDragEnd={handleDragEnd}
                onTouchStart={() => handleTouchStart(dayGroup.day)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`bg-white rounded-lg shadow-md border-l-4 transition-all duration-200 hover:shadow-lg cursor-move ${
                  isDragging ? 'opacity-50 scale-105 shadow-xl' : ''
                } ${
                  isDragOver ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
                } ${
                  isChanging ? 'opacity-60' : ''
                } ${
                  getDayColor(dayGroup.day)
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{dayGroup.day}</h3>
                      <p className="text-sm text-gray-500">
                        {dayGroup.date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => changeDayMenu(dayGroup.day)}
                        disabled={isChanging}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          isChanging
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                        }`}
                        title="この日のメニューを変更"
                      >
                        {isChanging ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RefreshCw size={18} />
                        )}
                      </button>
                      {mainRecipe && (
                        <button
                          onClick={() => handleToggleFavorite(mainRecipe)}
                          className={`p-2 rounded-lg transition-colors duration-200 ${
                            isInFavorites(mainRecipe.name)
                              ? 'text-red-500 bg-red-50'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title={isInFavorites(mainRecipe.name) ? 'お気に入りから削除' : 'お気に入りに追加'}
                        >
                          <Heart size={18} className={isInFavorites(mainRecipe.name) ? 'fill-current' : ''} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleCard(dayKey)}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* 献立の概要表示 */}
                  <div className="space-y-2 mb-4">
                    {mainRecipe && (
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon('main')}
                        <span className="text-sm font-medium text-gray-700">{getCategoryLabel('main')}:</span>
                        <span className="text-sm text-gray-900 font-semibold">{mainRecipe.name}</span>
                      </div>
                    )}
                    {sideRecipes.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon('side')}
                        <span className="text-sm font-medium text-gray-700">{getCategoryLabel('side')}:</span>
                        <span className="text-sm text-gray-900">{sideRecipes.map(r => r.name).join(', ')}</span>
                      </div>
                    )}
                    {soupRecipes.length > 0 && (
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon('soup')}
                        <span className="text-sm font-medium text-gray-700">{getCategoryLabel('soup')}:</span>
                        <span className="text-sm text-gray-900">{soupRecipes.map(r => r.name).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* 調理時間と難易度（主菜ベース） */}
                  {mainRecipe && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-gray-600">
                        <Clock size={16} className="mr-1" />
                        <span className="text-sm">
                          約{dayGroup.recipes.reduce((total, r) => total + r.cookingTime, 0)}分
                        </span>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={`${
                              i < mainRecipe.difficulty
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-gray-200 pt-4 animate-in slide-in-from-top duration-200">
                      {dayGroup.recipes.map((recipe) => (
                        <div key={recipe.id} className="mb-4 last:mb-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {getCategoryIcon(recipe.category)}
                            <h6 className="font-semibold text-gray-800">{recipe.name}</h6>
                            <span className="text-xs text-gray-500">({recipe.cookingTime}分)</span>
                          </div>
                          <ul className="space-y-1 ml-6">
                            {recipe.ingredients.map((ingredient) => (
                              <li
                                key={ingredient.id}
                                className="text-sm text-gray-600 flex justify-between"
                              >
                                <span>{ingredient.name}</span>
                                <span className="text-gray-500">
                                  {ingredient.amount}{ingredient.unit}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* ドラッグ中の視覚的フィードバック */}
                {isDragging && (
                  <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                    <p className="text-blue-600 font-semibold">移動中...</p>
                  </div>
                )}
                
                {isDragOver && draggedDay !== dayGroup.day && (
                  <div className="absolute inset-0 bg-green-100 bg-opacity-50 rounded-lg flex items-center justify-center border-2 border-green-400 border-dashed">
                    <p className="text-green-600 font-semibold">ここに移動</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onGenerateShoppingList}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <ShoppingCart size={20} />
            <span>買い物リストを作成</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;