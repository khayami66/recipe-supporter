import React, { useState } from 'react';
import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Star, ChefHat, Utensils, Soup, Salad, CheckCircle, RotateCcw } from 'lucide-react';
import { MenuPlan } from '../types';

interface CalendarPageProps {
  menuHistory: MenuPlan[];
  onMarkAsCooked: (dayRecipes: any[], date: Date) => Promise<void>;
  completedDays: Set<string>;
  onResetDay: (date: Date) => Promise<void>;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ menuHistory, onMarkAsCooked, completedDays, onResetDay }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [cookingDay, setCookingDay] = useState<string | null>(null);
  const [resettingDay, setResettingDay] = useState<string | null>(null);

  // 初期表示を最新のメニューがある月に設定
  useEffect(() => {
    if (menuHistory.length > 0) {
      const latestMenu = menuHistory[0]; // 最新のメニュー（降順でソート済み）
      const latestDate = new Date(latestMenu.generatedDate);
      setCurrentDate(latestDate);
    }
  }, [menuHistory]);

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // カレンダーの日付配列を生成
  const calendarDays = [];
  
  // 前月の日付を追加（空白埋め）
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(currentYear, currentMonth, -i);
    calendarDays.push({ date: prevDate, isCurrentMonth: false });
  }
  
  // 当月の日付を追加
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    calendarDays.push({ date, isCurrentMonth: true });
  }
  
  // 次月の日付を追加（42日になるまで）
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextDate = new Date(currentYear, currentMonth + 1, day);
    calendarDays.push({ date: nextDate, isCurrentMonth: false });
  }

  // 指定日のメニューを取得
  const getMenuForDate = (date: Date) => {
    // 指定日に該当するレシピを全て取得
    const recipesForDate: any[] = [];
    
    menuHistory.forEach(menu => {
      menu.recipes.forEach(recipe => {
        const recipeDate = new Date(recipe.scheduledDate);
        if (recipeDate.toDateString() === date.toDateString()) {
          recipesForDate.push(recipe);
        }
      });
    });
    
    return recipesForDate.length > 0 ? { recipes: recipesForDate } : null;
  };

  // 月を変更
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 日付をクリック
  const handleDateClick = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDate(date);
  };

  // 日付が今日かどうか
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // 日付が選択されているかどうか
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // その日が調理済みかチェック
  const isDayCooked = (date: Date) => {
    return completedDays.has(date.toDateString());
  };

  // 指定日にメニューがあるかチェック
  const hasMenuForDate = (date: Date) => {
    return menuHistory.some(menu => 
      menu.recipes.some(recipe => {
        const recipeDate = new Date(recipe.scheduledDate);
        return recipeDate.toDateString() === date.toDateString();
      })
    );
  };

  // カテゴリアイコンを取得
  // 調理済みにマーク
  const handleMarkAsCooked = async (date: Date, recipes: any[]) => {
    setCookingDay(date.toDateString());

    try {
      await onMarkAsCooked(recipes, date);
    } catch (error) {
      console.error('Error marking as cooked:', error);
    } finally {
      setCookingDay(null);
    }
  };

  // 完了状態をリセット
  const handleResetDay = async (date: Date) => {
    setResettingDay(date.toDateString());

    try {
      await onResetDay(date);
    } catch (error) {
      console.error('Error resetting day:', error);
    } finally {
      setResettingDay(null);
    }
  };
  // カテゴリアイコンを取得
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'main': return <Utensils size={14} className="text-red-600" />;
      case 'side': return <Salad size={14} className="text-green-600" />;
      case 'soup': return <Soup size={14} className="text-blue-600" />;
      default: return <Utensils size={14} className="text-gray-600" />;
    }
  };


  // カテゴリラベルを取得
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'main': return '主菜';
      case 'side': return '副菜';
      case 'soup': return '汁物';
      default: return '';
    }
  };

  // 選択された日のメニュー
  const selectedMenu = selectedDate ? getMenuForDate(selectedDate) : null;

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Calendar size={28} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-800">料理カレンダー</h1>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            作った料理の履歴をカレンダーで確認できます
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* カレンダーヘッダー */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeMonth('prev')}
                className="p-2 hover:bg-blue-400 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft size={24} />
              </button>
              
              <h2 className="text-2xl font-bold">
                {currentYear}年 {monthNames[currentMonth]}
              </h2>
              
              <button
                onClick={() => changeMonth('next')}
                className="p-2 hover:bg-blue-400 rounded-lg transition-colors duration-200"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={`p-4 text-center font-semibold ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const hasMenu = hasMenuForDate(day.date);
             const dayMenu = hasMenu ? getMenuForDate(day.date) : null;
             const menuCount = dayMenu ? dayMenu.recipes.length : 0;
              const isCooked = isDayCooked(day.date);
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day.date, day.isCurrentMonth)}
                  className={`border-b border-r border-gray-200 transition-all duration-200 hover:bg-gray-50 ${
                    !day.isCurrentMonth
                      ? 'text-gray-300 bg-gray-50'
                      : isSelected(day.date)
                      ? 'bg-blue-100 text-blue-800'
                      : isCooked && day.isCurrentMonth
                      ? 'bg-green-100 text-green-800 font-bold'
                      : isToday(day.date)
                      ? 'bg-orange-100 text-orange-800 font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={{
                    minHeight: hasMenu && day.isCurrentMonth ? `${Math.max(80, 40 + menuCount * 20)}px` : '60px'
                  }}
                >
                  <div className="h-full">
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-center" style={{ height: '32px' }}>
                        <span className="text-sm font-medium">
                          {day.date.getDate()}
                        </span>
                        {isCooked && day.isCurrentMonth && (
                          <span className="ml-1 text-xs bg-green-500 text-white px-1 rounded-full font-bold">✓</span>
                        )}
                      </div>
                      {hasMenu && day.isCurrentMonth && dayMenu && (
                        <div className="text-xs space-y-1 text-left px-2" style={{ flex: 1 }}>
                          {(() => {
                            const mainDish = dayMenu.recipes.find(r => r.category === 'main');
                            const sideDish = dayMenu.recipes.find(r => r.category === 'side');
                            const soup = dayMenu.recipes.find(r => r.category === 'soup');
                        
                            return (
                              <>
                                {mainDish && (
                                 <div className="text-red-600 font-medium leading-tight truncate text-left">
                                    {mainDish.name}
                                  </div>
                                )}
                                {sideDish && (
                                 <div className="text-green-600 leading-tight truncate text-left">
                                    {sideDish.name}
                                  </div>
                                )}
                                {soup && (
                                 <div className="text-blue-600 leading-tight truncate text-left">
                                    {soup.name}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                         </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 選択された日のメニュー詳細 */}
        {selectedDate && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ChefHat size={24} className="text-orange-500" />
              <h3 className="text-xl font-bold text-gray-800">
                {selectedDate.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              {isDayCooked(selectedDate) && (
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">完了済み</span>
                  <button
                    onClick={() => handleResetDay(selectedDate)}
                    disabled={resettingDay === selectedDate.toDateString()}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      resettingDay === selectedDate.toDateString()
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                    }`}
                    title="評価をリセット"
                  >
                    {resettingDay === selectedDate.toDateString() ? (
                      <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    <span>リセット</span>
                  </button>
                </div>
              )}
            </div>

            {selectedMenu ? (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  この日の献立（{selectedMenu.recipes.length}品）
                </p>
                
                {/* 完了ボタン */}
                {!isDayCooked(selectedDate) && (
                  <div className="mb-6">
                    <button
                      onClick={() => handleMarkAsCooked(selectedDate, selectedMenu.recipes)}
                      disabled={cookingDay === selectedDate.toDateString()}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        cookingDay === selectedDate.toDateString()
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {cookingDay === selectedDate.toDateString() ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      <span>{cookingDay === selectedDate.toDateString() ? '処理中...' : '完了'}</span>
                    </button>
                  </div>
                )}
                
                {/* カテゴリ別に料理を表示 */}
                <div className="space-y-6">
                  {['main', 'side', 'soup'].map(category => {
                    const categoryRecipes = selectedMenu.recipes.filter(recipe => recipe.category === category);
                    if (categoryRecipes.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                          {getCategoryIcon(category)}
                          <h4 className="font-semibold text-gray-800">{getCategoryLabel(category)}</h4>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {categoryRecipes.map((recipe) => (
                            <div
                              key={recipe.id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                            >
                              <h5 className="font-semibold text-gray-800 mb-2">
                                {recipe.name}
                              </h5>
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <Clock size={14} className="mr-1" />
                                  <span>{recipe.cookingTime}分</span>
                                </div>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={14}
                                      className={`${
                                        i < recipe.difficulty
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <h6 className="text-xs font-medium text-gray-700 mb-1">材料:</h6>
                                <div className="grid grid-cols-1 gap-1">
                                  {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                                    <div key={index} className="flex justify-between text-xs text-gray-600">
                                      <span>{ingredient.name}</span>
                                      <span>{ingredient.amount}{ingredient.unit}</span>
                                    </div>
                                  ))}
                                  {recipe.ingredients.length > 4 && (
                                    <div className="text-xs text-gray-500 text-center mt-1">
                                      他{recipe.ingredients.length - 4}品目
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <ChefHat size={48} className="mx-auto" />
                </div>
                <p className="text-gray-500">この日の献立はありません</p>
                <p className="text-gray-400 text-sm mt-1">
                  メニューを生成すると、ここに記録が表示されます
                </p>
              </div>
            )}
          </div>
        )}

        {/* 統計情報 */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {menuHistory.length}
            </div>
            <div className="text-sm text-gray-600">総メニュー数</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {menuHistory.reduce((total, menu) => total + menu.recipes.length, 0)}
            </div>
            <div className="text-sm text-gray-600">総料理数</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {menuHistory.filter(menu => {
                return menu.recipes.some(recipe => {
                  const recipeDate = new Date(recipe.scheduledDate);
                  return recipeDate.getMonth() === currentMonth && recipeDate.getFullYear() === currentYear;
                });
              }).length}
            </div>
            <div className="text-sm text-gray-600">今月のメニュー</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {menuHistory.filter(menu => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return menu.recipes.some(recipe => {
                  const recipeDate = new Date(recipe.scheduledDate);
                  return recipeDate >= weekAgo;
                });
              }).length}
            </div>
            <div className="text-sm text-gray-600">最近1週間</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;