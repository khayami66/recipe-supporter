import React, { useState } from 'react';
import { Heart, Clock, Star, Trash2, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { FavoriteRecipe, RecipeRating } from '../types';

interface FavoritesPageProps {
  favorites: FavoriteRecipe[];
  recipeRatings: RecipeRating[];
  onRemoveFromFavorites: (favoriteId: string) => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ favorites, recipeRatings, onRemoveFromFavorites }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'favorites' | 'S' | 'A' | 'B' | 'C'>('favorites');

  const toggleCard = (favoriteId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(favoriteId)) {
      newExpanded.delete(favoriteId);
    } else {
      newExpanded.add(favoriteId);
    }
    setExpandedCards(newExpanded);
  };

  // 評価レベルを計算
  const calculateRatingLevel = (rating: RecipeRating): 'S' | 'A' | 'B' | 'C' => {
    const totalScore = rating.taste + rating.cookingTime + rating.difficulty + rating.wouldMakeAgain;
    if (totalScore >= 18) return 'S';
    if (totalScore >= 14) return 'A';
    if (totalScore >= 7) return 'B';
    return 'C';
  };

  // 評価レベル別にレシピを分類
  const ratingsByLevel = {
    S: recipeRatings.filter(rating => calculateRatingLevel(rating) === 'S'),
    A: recipeRatings.filter(rating => calculateRatingLevel(rating) === 'A'),
    B: recipeRatings.filter(rating => calculateRatingLevel(rating) === 'B'),
    C: recipeRatings.filter(rating => calculateRatingLevel(rating) === 'C'),
  };

  // 評価レベルの色を取得
  const getRatingColor = (level: string) => {
    switch (level) {
      case 'S': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 'A': return 'bg-gradient-to-r from-green-400 to-green-500 text-white';
      case 'B': return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white';
      case 'C': return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      default: return 'bg-gray-300 text-gray-600';
    }
  };

  // タブの色を取得
  const getTabColor = (level: string) => {
    switch (level) {
      case 'S': return 'border-yellow-500 text-yellow-600 bg-yellow-50';
      case 'A': return 'border-green-500 text-green-600 bg-green-50';
      case 'B': return 'border-blue-500 text-blue-600 bg-blue-50';
      case 'C': return 'border-gray-500 text-gray-600 bg-gray-50';
      default: return 'border-red-500 text-red-600 bg-red-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <Heart size={28} className="text-red-500" />
            <h1 className="text-2xl font-bold text-gray-800">お気に入り・評価済みレシピ</h1>
          </div>
          
          {/* タブ */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border-2 ${
                activeTab === 'favorites'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Heart size={16} className="inline mr-1" />
              お気に入り ({favorites.length})
            </button>
            {(['S', 'A', 'B', 'C'] as const).map(level => (
              <button
                key={level}
                onClick={() => setActiveTab(level)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border-2 ${
                  activeTab === level
                    ? getTabColor(level)
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Award size={16} className="inline mr-1" />
                {level}級 ({ratingsByLevel[level].length})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {activeTab === 'favorites' ? (
          // お気に入りタブの内容
          favorites.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((favorite) => {
                const isExpanded = expandedCards.has(favorite.id);
                return (
                  <div
                    key={favorite.id}
                    className="bg-white rounded-lg shadow-md border-l-4 border-l-red-400 bg-red-50 transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <Heart size={18} className="text-red-500 fill-current" />
                          <span className="text-sm text-red-600 font-medium">お気に入り</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onRemoveFromFavorites(favorite.id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
                            title="お気に入りから削除"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => toggleCard(favorite.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                          >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                        {favorite.recipeName}
                      </h4>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-gray-600">
                          <Clock size={16} className="mr-1" />
                          <span className="text-sm">{favorite.cookingTime}分</span>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={`${
                                i < favorite.difficulty
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 pt-4 animate-in slide-in-from-top duration-200">
                          <h5 className="font-medium text-gray-700 mb-2">必要な食材：</h5>
                          <ul className="space-y-1">
                            {favorite.ingredients.map((ingredient, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 flex justify-between"
                              >
                                <span>{ingredient.name}</span>
                                <span className="text-gray-500">
                                  {ingredient.amount}{ingredient.unit}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-3 text-xs text-gray-500">
                            追加日：{favorite.createdAt.toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Heart size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                お気に入りレシピがありません
              </h3>
              <p className="text-gray-500 mb-4">
                メニューページでレシピをお気に入りに追加してみましょう
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                <h4 className="font-semibold text-blue-800 mb-2">💡 使い方</h4>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• メニューページでハートボタンをクリック</li>
                  <li>• 気に入ったレシピを保存</li>
                  <li>• いつでもここから確認可能</li>
                </ul>
              </div>
            </div>
          )
        ) : (
          // 評価別タブの内容
          ratingsByLevel[activeTab].length > 0 ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-l-gray-300">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRatingColor(activeTab)}`}>
                    {activeTab}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {activeTab}級料理 ({ratingsByLevel[activeTab].length}件)
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {activeTab === 'S' && '家族に大好評だった料理'}
                  {activeTab === 'A' && '満足度の高い料理'}
                  {activeTab === 'B' && '普通の料理'}
                  {activeTab === 'C' && '改善が必要な料理（今後の献立に含まれません）'}
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ratingsByLevel[activeTab].map((rating) => {
                  const isExpanded = expandedCards.has(rating.id);
                  const ratingLevel = calculateRatingLevel(rating);
                  return (
                    <div
                      key={rating.id}
                      className="bg-white rounded-lg shadow-md border-l-4 border-l-gray-400 transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${getRatingColor(ratingLevel)}`}>
                              {ratingLevel}
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                              {rating.taste + rating.cookingTime + rating.difficulty + rating.wouldMakeAgain}/20点
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500">
                              {rating.ratedDate.toLocaleDateString('ja-JP')}
                            </div>
                            <button
                              onClick={() => toggleCard(rating.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            >
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                          {rating.recipeName}
                        </h4>

                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">おいしさ:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={`${
                                    i < rating.taste
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">調理時間:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={`${
                                    i < rating.cookingTime
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">難易度:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={`${
                                    i < rating.difficulty
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">また作りたい:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={`${
                                    i < rating.wouldMakeAgain
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-200 pt-4 animate-in slide-in-from-top duration-200">
                            <div className="text-xs text-gray-500">
                              詳細評価を表示中
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Award size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {activeTab}級の評価済みレシピがありません
              </h3>
              <p className="text-gray-500 mb-4">
                料理を作って評価すると、ここに表示されます
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                <h4 className="font-semibold text-blue-800 mb-2">💡 使い方</h4>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• メニューページでハートボタンをクリック</li>
                  <li>• 気に入ったレシピを保存</li>
                  <li>• いつでもここから確認可能</li>
                </ul>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;