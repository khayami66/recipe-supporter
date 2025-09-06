import React, { useState } from 'react';
import { Check, RotateCcw, Package, ChevronDown, ChevronUp, Calendar, Smartphone } from 'lucide-react';
import { ShoppingListItem, IngredientCategory } from '../types';

interface ShoppingListPageProps {
  shoppingList: ShoppingListItem[];
  onUpdateShoppingList: (updatedList: ShoppingListItem[]) => void;
  onNavigateToMobileShopping?: () => void;
}

const ShoppingListPage: React.FC<ShoppingListPageProps> = ({
  shoppingList,
  onUpdateShoppingList,
  onNavigateToMobileShopping,
}) => {
  const [filter, setFilter] = useState<IngredientCategory | 'all'>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const categories: IngredientCategory[] = ['野菜', '肉・魚', '調味料', 'その他'];

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleItemCheck = (itemId: string) => {
    const updatedList = shoppingList.map(item =>
      item.ingredient.id === itemId
        ? { ...item, isChecked: !item.isChecked }
        : item
    );
    onUpdateShoppingList(updatedList);
  };

  const clearCheckedItems = () => {
    const updatedList = shoppingList.filter(item => !item.isChecked);
    onUpdateShoppingList(updatedList);
  };

  const filteredItems = shoppingList.filter(item =>
    filter === 'all' || item.ingredient.category === filter
  );

  const groupedItems = categories.reduce((acc, category) => {
    acc[category] = filteredItems.filter(item => item.ingredient.category === category);
    return acc;
  }, {} as Record<IngredientCategory, ShoppingListItem[]>);

  const getCategoryColor = (category: IngredientCategory) => {
    const colors: Record<IngredientCategory, string> = {
      '野菜': 'text-green-600 bg-green-100',
      '肉・魚': 'text-red-600 bg-red-100',
      '調味料': 'text-orange-600 bg-orange-100',
      'その他': 'text-gray-600 bg-gray-100',
    };
    return colors[category];
  };

  const checkedCount = shoppingList.filter(item => item.isChecked).length;
  const totalCount = shoppingList.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">買い物リスト</h1>
            <div className="flex space-x-2">
              {onNavigateToMobileShopping && (
                <button
                  onClick={onNavigateToMobileShopping}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <Smartphone size={16} />
                  <span>モバイル版</span>
                </button>
              )}
              <button
                onClick={clearCheckedItems}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                disabled={checkedCount === 0}
              >
                <RotateCcw size={16} />
                <span>クリア</span>
              </button>
            </div>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                filter === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filter === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-4 bg-gray-100 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">進捗状況</span>
              <span className="font-medium text-gray-800">
                {checkedCount} / {totalCount} 完了
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {categories.map(category => {
          const items = groupedItems[category];
          if (!items || items.length === 0) return null;

          return (
            <div key={category} className="mb-6">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getCategoryColor(category)}`}>
                <Package size={16} className="mr-2" />
                {category}
              </div>

              <div className="space-y-2">
                {items.map(item => {
                  const shortage = Math.max(0, item.needed - item.inStock);
                  const hasShortage = shortage > 0;
                  const isExpanded = expandedItems.has(item.ingredient.id);

                  return (
                    <div
                      key={item.ingredient.id}
                      className={`bg-white rounded-lg p-4 shadow-sm border transition-all duration-200 ${
                        item.isChecked
                          ? 'bg-gray-50 opacity-60'
                          : hasShortage
                          ? 'border-red-200 bg-red-50'
                          : 'border-gray-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleItemCheck(item.ingredient.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-all duration-200 ${
                            item.isChecked
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {item.isChecked && <Check size={14} />}
                        </button>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className={`font-medium ${item.isChecked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {item.ingredient.name}
                            </h3>
                            <div className="text-right ml-4">
                              <p className={`font-semibold ${hasShortage ? 'text-red-600' : 'text-gray-800'}`}>
                                {shortage}{item.ingredient.unit}
                              </p>
                              <p className="text-xs text-gray-500">
                                必要: {item.needed}{item.ingredient.unit}
                              </p>
                              <p className="text-xs text-gray-500">
                                在庫: {item.inStock}{item.ingredient.unit}
                              </p>
                            </div>
                          </div>
                              <button
                                onClick={() => toggleItemExpansion(item.ingredient.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                title="内訳を表示"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <Calendar size={14} className="mr-2" />
                            料理別内訳
                          </h4>
                          <div className="space-y-2">
                            {item.breakdown.map((breakdown, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {breakdown.recipeName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {breakdown.day}
                                  </p>
                                </div>
                                <p className="text-sm font-semibold text-gray-700">
                                  {breakdown.amount}{item.ingredient.unit}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-100">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-gray-700">合計必要量</span>
                              <span className="font-semibold text-gray-800">
                                {item.needed}{item.ingredient.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">買い物リストが空です</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingListPage;