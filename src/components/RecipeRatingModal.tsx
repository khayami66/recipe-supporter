import React, { useState } from 'react';
import { X, Star, Clock, ChefHat, Heart, Utensils } from 'lucide-react';

interface RecipeRatingModalProps {
  isOpen: boolean;
  recipes: any[];
  onClose: () => void;
  onSubmitRatings: (ratings: { recipeName: string; taste: number; cookingTime: number; difficulty: number; wouldMakeAgain: number }[]) => Promise<void>;
}

const RecipeRatingModal: React.FC<RecipeRatingModalProps> = ({
  isOpen,
  recipes,
  onClose,
  onSubmitRatings,
}) => {
  const [ratings, setRatings] = useState<Record<string, { taste: number; cookingTime: number; difficulty: number; wouldMakeAgain: number }>>(() => {
    // 初期値として各レシピに☆1を設定
    const initialRatings: Record<string, { taste: number; cookingTime: number; difficulty: number; wouldMakeAgain: number }> = {};
    recipes.forEach(recipe => {
      initialRatings[recipe.name] = {
        taste: 1,
        cookingTime: 1,
        difficulty: 1,
        wouldMakeAgain: 1,
      };
    });
    return initialRatings;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const updateRating = (recipeName: string, category: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [recipeName]: {
        ...prev[recipeName],
        [category]: value,
      },
    }));
  };

  const getRating = (recipeName: string, category: string) => {
    return ratings[recipeName]?.[category as keyof typeof ratings[string]] || 1;
  };

  const getOverallRating = (recipeName: string) => {
    const taste = getRating(recipeName, 'taste');
    const cookingTime = getRating(recipeName, 'cookingTime');
    const difficulty = getRating(recipeName, 'difficulty');
    const wouldMakeAgain = getRating(recipeName, 'wouldMakeAgain');
    
    const totalStars = taste + cookingTime + difficulty + wouldMakeAgain;
    
    if (totalStars >= 18) return 'S';
    if (totalStars >= 14) return 'A';
    if (totalStars >= 7) return 'B';
    return 'C';
  };

  const getOverallRatingColor = (rating: string) => {
    switch (rating) {
      case 'S': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 'A': return 'bg-gradient-to-r from-green-400 to-green-500 text-white';
      case 'B': return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white';
      case 'C': return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      default: return 'bg-gray-300 text-gray-600';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const ratingsData = recipes.map(recipe => ({
        recipeName: recipe.name,
        taste: getRating(recipe.name, 'taste'),
        cookingTime: getRating(recipe.name, 'cookingTime'),
        difficulty: getRating(recipe.name, 'difficulty'),
        wouldMakeAgain: getRating(recipe.name, 'wouldMakeAgain'),
      }));

      await onSubmitRatings(ratingsData);
      onClose();
    } catch (error) {
      console.error('Error submitting ratings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (recipeName: string, category: string, label: string, icon: React.ReactNode) => {
    const currentRating = getRating(recipeName, category);
    
    return (
      <div className="mb-4">
        <div className="flex items-center mb-2">
          {icon}
          <span className="text-sm font-medium text-gray-700 ml-2">{label}</span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => updateRating(recipeName, category, star)}
              className={`p-1 transition-colors duration-200 ${
                star <= currentRating
                  ? 'text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            >
              <Star size={24} className={star <= currentRating ? 'fill-current' : ''} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'main': return <Utensils size={16} className="text-red-600" />;
      case 'side': return <ChefHat size={16} className="text-green-600" />;
      case 'soup': return <Heart size={16} className="text-blue-600" />;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">料理の評価</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            今日作った料理はいかがでしたか？5段階で評価してください。
          </p>

          <div className="space-y-8">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50 relative">
                <div className="flex items-center mb-4">
                  {getCategoryIcon(recipe.category)}
                  <h3 className="text-lg font-semibold text-gray-800 ml-2">
                    {recipe.name}
                  </h3>
                  <span className="text-sm text-gray-500 ml-2">
                    ({getCategoryLabel(recipe.category)})
                  </span>
                </div>

                {/* 総合評価 */}
                <div className="absolute top-4 right-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${getOverallRatingColor(getOverallRating(recipe.name))}`}>
                    {getOverallRating(recipe.name)}
                  </div>
                  <div className="text-xs text-center mt-1 text-gray-500">
                    {getRating(recipe.name, 'taste') + getRating(recipe.name, 'cookingTime') + getRating(recipe.name, 'difficulty') + getRating(recipe.name, 'wouldMakeAgain')}/20
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderStarRating(
                    recipe.name,
                    'taste',
                    'おいしかった',
                    <Heart size={18} className="text-red-500" />
                  )}
                  
                  {renderStarRating(
                    recipe.name,
                    'cookingTime',
                    '調理時間',
                    <Clock size={18} className="text-blue-500" />
                  )}
                  
                  {renderStarRating(
                    recipe.name,
                    'difficulty',
                    '難易度',
                    <ChefHat size={18} className="text-orange-500" />
                  )}
                  
                  {renderStarRating(
                    recipe.name,
                    'wouldMakeAgain',
                    'またつくりたい',
                    <Star size={18} className="text-purple-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-4 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isSubmitting ? '保存中...' : '評価を保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeRatingModal;