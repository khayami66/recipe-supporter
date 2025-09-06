import React, { useState } from 'react';
import { Check, ShoppingCart, ArrowLeft, Package } from 'lucide-react';
import { ShoppingListItem, IngredientCategory, PurchasedItem } from '../types';

interface MobileShoppingPageProps {
  shoppingList: ShoppingListItem[];
  purchasedItems: PurchasedItem[];
  onUpdateShoppingList: (updatedList: ShoppingListItem[]) => void;
  onSavePurchasedItems: (items: { ingredientName: string; amount: number; unit: string; category: string }[]) => Promise<void>;
  onUpdateInventoryFromPurchase: (items: { ingredientName: string; amount: number; unit: string; category: string }[]) => Promise<void>;
  onBack: () => void;
}

const MobileShoppingPage: React.FC<MobileShoppingPageProps> = ({
  shoppingList,
  purchasedItems,
  onUpdateShoppingList,
  onSavePurchasedItems,
  onUpdateInventoryFromPurchase,
  onBack,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categories: IngredientCategory[] = ['野菜', '肉・魚', '調味料', 'その他'];

  const getCategoryColor = (category: IngredientCategory) => {
    const colors: Record<IngredientCategory, string> = {
      '野菜': 'bg-green-500',
      '肉・魚': 'bg-red-500',
      '調味料': 'bg-orange-500',
      'その他': 'bg-gray-500',
    };
    return colors[category];
  };

  const getCategoryLightColor = (category: IngredientCategory) => {
    const colors: Record<IngredientCategory, string> = {
      '野菜': 'bg-green-100 border-green-300',
      '肉・魚': 'bg-red-100 border-red-300',
      '調味料': 'bg-orange-100 border-orange-300',
      'その他': 'bg-gray-100 border-gray-300',
    };
    return colors[category];
  };

  const toggleItem = (itemId: string) => {
    if (isConfirmed) return;
    
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleConfirm = async () => {
    if (selectedItems.size === 0) return;
    
    setIsLoading(true);
    
    try {
      // 選択されたアイテムの情報を取得
      const selectedItemsData = Array.from(selectedItems).map(itemId => {
        const item = shoppingList.find(item => item.ingredient.id === itemId);
        if (!item) return null;
        
        const shortage = Math.max(0, item.needed - item.inStock);
        return {
          ingredientName: item.ingredient.name,
          amount: shortage,
          unit: item.ingredient.unit,
          category: item.ingredient.category,
        };
      }).filter(Boolean) as { ingredientName: string; amount: number; unit: string; category: string }[];

      // データベースに購入済みアイテムを保存
      await onSavePurchasedItems(selectedItemsData);
      
      // 在庫を自動更新
      await onUpdateInventoryFromPurchase(selectedItemsData);
      
      // 買い物リストを更新
      const updatedList = shoppingList.map(item => ({
        ...item,
        isChecked: selectedItems.has(item.ingredient.id)
      }));
      
      onUpdateShoppingList(updatedList);
      setIsConfirmed(true);
    } catch (error) {
      console.error('Error confirming purchase:', error);
      alert('購入の確定に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedItems(new Set());
    setIsConfirmed(false);
  };

  // 今日購入済みのアイテムを取得
  const getTodayPurchasedItems = () => {
    const today = new Date().toDateString();
    return purchasedItems.filter(item => 
      item.purchasedDate.toDateString() === today
    );
  };

  // 購入が必要なアイテムのうち、今日購入済みでないものをフィルタリング
  const getItemsToShop = () => {
    const todayPurchased = getTodayPurchasedItems();
    
    return shoppingList.filter(item => {
      const shortage = Math.max(0, item.needed - item.inStock);
      if (shortage <= 0) return false;
      
      // 今日購入済みのアイテムは除外
      const isPurchasedToday = todayPurchased.some(purchased => 
        purchased.ingredientName === item.ingredient.name &&
        purchased.unit === item.ingredient.unit
      );
      
      return !isPurchasedToday;
    });
  };

  // 購入が必要なアイテムのみフィルタリング
  const itemsToShop = getItemsToShop();

  // 表示するアイテムを決定
  const displayItems = isConfirmed 
    ? itemsToShop.filter(item => !selectedItems.has(item.ingredient.id))
    : itemsToShop;

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = displayItems.filter(item => item.ingredient.category === category);
    return acc;
  }, {} as Record<IngredientCategory, ShoppingListItem[]>);

  const selectedCount = selectedItems.size;
  const totalCount = itemsToShop.length;

  if (isConfirmed) {
    const todayPurchased = getTodayPurchasedItems();
    const remainingItems = displayItems;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={20} />
                <span>戻る</span>
              </button>
              <h1 className="text-xl font-bold text-gray-800">買い物完了</h1>
              <button
                onClick={handleReset}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg"
              >
                リセット
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* 購入済みアイテム */}
          <div>
            <h2 className="text-lg font-semibold text-green-600 mb-3 flex items-center">
              <Check size={20} className="mr-2" />
              購入済み ({todayPurchased.length}件)
            </h2>
            <div className="space-y-2">
              {todayPurchased.map(item => (
                <div
                  key={item.id}
                  className="bg-green-50 border border-green-200 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">{item.ingredientName}</span>
                    <span className="text-green-600 font-semibold">
                      {item.amount}{item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 未購入アイテム */}
          {remainingItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-600 mb-3 flex items-center">
                <ShoppingCart size={20} className="mr-2" />
                未購入 ({remainingItems.length}件)
              </h2>
              <div className="space-y-2">
                {remainingItems.map(item => {
                  const shortage = Math.max(0, item.needed - item.inStock);
                  return (
                    <div
                      key={item.ingredient.id}
                      className="bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-800">{item.ingredient.name}</span>
                        <span className="text-red-600 font-semibold">
                          {shortage}{item.ingredient.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
              <span>戻る</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">買い物リスト</h1>
            <div className="w-16"></div>
          </div>

          <div className="bg-gray-100 rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">選択済み</span>
              <span className="font-medium text-gray-800">
                {selectedCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (selectedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-24">
        {totalCount === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">購入が必要な商品がありません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map(category => {
              const items = groupedItems[category];
              if (!items || items.length === 0) {
                return null;
              }

              return (
                <div key={category}>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white mb-3 ${getCategoryColor(category)}`}>
                    <Package size={16} className="mr-2" />
                    {category}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {items.map(item => {
                      const shortage = Math.max(0, item.needed - item.inStock);
                      const isSelected = selectedItems.has(item.ingredient.id);
                      
                      return (
                        <button
                          key={item.ingredient.id}
                          onClick={() => toggleItem(item.ingredient.id)}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                            isSelected
                              ? `${getCategoryColor(item.ingredient.category)} text-white border-transparent shadow-lg`
                              : `${getCategoryLightColor(item.ingredient.category)} hover:shadow-md active:scale-95`
                          }`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <h3 className={`font-semibold text-xs leading-tight ${
                              isSelected ? 'text-white' : 'text-gray-800'
                            }`}>
                              {item.ingredient.name}
                            </h3>
                            {isSelected && (
                              <Check size={14} className="text-white flex-shrink-0 ml-1" />
                            )}
                          </div>
                          <div className={`text-base font-bold ${
                            isSelected ? 'text-white' : 'text-gray-900'
                          }`}>
                            {shortage}{item.ingredient.unit}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 確定ボタン */}
      {totalCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
              selectedCount > 0 && !isLoading
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={24} />
                <span>
                  {selectedCount > 0 
                    ? `${selectedCount}件の買い物を確定` 
                    : '商品を選択してください'
                  }
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileShoppingPage;