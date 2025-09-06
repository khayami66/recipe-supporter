import { Recipe, FamilyMember, Ingredient, UserSettings, InventoryItem } from '../types';
import { convertToDifyRequest, convertFromDifyResponse, callDifyChatbot, DifyChatbotRequest, DifyChatbotResponse } from '../services/chatbotService';

// Difyチャットボットを使用したメニュー生成
export const generateMenuWithDify = async (
  userSettings: UserSettings,
  inventory: InventoryItem[],
  startDate: Date,
  endDate: Date,
  options?: {
    busyDates?: string[];
    maxCookingTime?: number;
    cuisineDistribution?: { japanese: number; western: number; chinese: number };
  },
  difyConfig?: {
    apiEndpoint: string;
    apiKey: string;
  }
): Promise<Recipe[]> => {
  if (!difyConfig?.apiEndpoint || !difyConfig?.apiKey) {
    throw new Error('Dify設定が不完全です');
  }

  try {
    // システムデータをDify形式に変換
    const difyRequest = convertToDifyRequest(userSettings, inventory, startDate, endDate, options);
    
    // DifyチャットボットAPI呼び出し
    const difyResponse = await callDifyChatbot(difyRequest, difyConfig.apiEndpoint, difyConfig.apiKey);
    
    // Dify出力をシステム形式に変換
    const recipes = convertFromDifyResponse(difyResponse);
    
    return recipes;
  } catch (error) {
    console.error('[menuGenerator.generateMenuWithDify] エラー', error);
    throw error;
  }
};

// レシピデータベース（チャットボット仕様に対応）
const recipeDatabase = {
  main: {
    japanese: [
      {
        name: '鶏の照り焼き',
        time: 25,
        difficulty: 2,
        ingredients: [
          { name: '鶏もも肉', qty: 300, unit: 'g', category: '肉・魚' },
          { name: '醤油', qty: 30, unit: 'ml', category: '調味料' },
          { name: 'みりん', qty: 30, unit: 'ml', category: '調味料' },
          { name: '砂糖', qty: 15, unit: 'g', category: '調味料' },
        ],
      },
      {
        name: '鮭の塩焼き',
        time: 15,
        difficulty: 1,
        ingredients: [
          { name: '鮭', qty: 400, unit: 'g', category: '肉・魚' },
          { name: '塩', qty: 5, unit: 'g', category: '調味料' },
          { name: 'レモン', qty: 1, unit: '個', category: '野菜' },
        ],
      },
      {
        name: '豚の生姜焼き',
        time: 20,
        difficulty: 2,
        ingredients: [
          { name: '豚ロース肉', qty: 400, unit: 'g', category: '肉・魚' },
          { name: '生姜', qty: 20, unit: 'g', category: '野菜' },
          { name: '醤油', qty: 45, unit: 'ml', category: '調味料' },
          { name: 'みりん', qty: 30, unit: 'ml', category: '調味料' },
          { name: '玉ねぎ', qty: 200, unit: 'g', category: '野菜' },
        ],
      },
      {
        name: '親子丼',
        time: 20,
        difficulty: 2,
        ingredients: [
          { name: '鶏もも肉', qty: 200, unit: 'g', category: '肉・魚' },
          { name: '卵', qty: 3, unit: '個', category: 'その他' },
          { name: '玉ねぎ', qty: 100, unit: 'g', category: '野菜' },
          { name: 'だし汁', qty: 200, unit: 'ml', category: '調味料' },
          { name: 'お米', qty: 300, unit: 'g', category: 'その他' },
        ],
      },
      {
        name: 'さばの味噌煮',
        time: 30,
        difficulty: 3,
        ingredients: [
          { name: 'さば', qty: 400, unit: 'g', category: '肉・魚' },
          { name: '味噌', qty: 60, unit: 'g', category: '調味料' },
          { name: '砂糖', qty: 30, unit: 'g', category: '調味料' },
          { name: '生姜', qty: 15, unit: 'g', category: '野菜' },
        ],
      },
    ],
    western: [
      {
        name: 'ハンバーグ',
        time: 35,
        difficulty: 3,
        ingredients: [
          { name: '牛ひき肉', qty: 300, unit: 'g', category: '肉・魚' },
          { name: '豚ひき肉', qty: 200, unit: 'g', category: '肉・魚' },
          { name: '玉ねぎ', qty: 100, unit: 'g', category: '野菜' },
          { name: 'パン粉', qty: 50, unit: 'g', category: 'その他' },
          { name: '卵', qty: 1, unit: '個', category: 'その他' },
        ],
      },
      {
        name: 'チキンステーキ',
        time: 30,
        difficulty: 3,
        ingredients: [
          { name: '鶏胸肉', qty: 400, unit: 'g', category: '肉・魚' },
          { name: 'オリーブオイル', qty: 30, unit: 'ml', category: '調味料' },
          { name: 'にんにく', qty: 20, unit: 'g', category: '野菜' },
          { name: 'ローズマリー', qty: 5, unit: 'g', category: '調味料' },
        ],
      },
      {
        name: 'ビーフシチュー',
        time: 60,
        difficulty: 4,
        ingredients: [
          { name: '牛肉', qty: 400, unit: 'g', category: '肉・魚' },
          { name: 'じゃがいも', qty: 300, unit: 'g', category: '野菜' },
          { name: '人参', qty: 200, unit: 'g', category: '野菜' },
          { name: '玉ねぎ', qty: 200, unit: 'g', category: '野菜' },
          { name: 'デミグラスソース', qty: 200, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: 'グリルチキン',
        time: 25,
        difficulty: 2,
        ingredients: [
          { name: '鶏もも肉', qty: 400, unit: 'g', category: '肉・魚' },
          { name: 'オリーブオイル', qty: 15, unit: 'ml', category: '調味料' },
          { name: '塩', qty: 5, unit: 'g', category: '調味料' },
          { name: 'こしょう', qty: 2, unit: 'g', category: '調味料' },
        ],
      },
      {
        name: 'ポークソテー',
        time: 20,
        difficulty: 2,
        ingredients: [
          { name: '豚ロース肉', qty: 400, unit: 'g', category: '肉・魚' },
          { name: 'バター', qty: 20, unit: 'g', category: '調味料' },
          { name: '塩', qty: 5, unit: 'g', category: '調味料' },
          { name: 'こしょう', qty: 2, unit: 'g', category: '調味料' },
        ],
      },
    ],
    chinese: [
      {
        name: '麻婆豆腐',
        time: 25,
        difficulty: 3,
        ingredients: [
          { name: '豆腐', qty: 300, unit: 'g', category: 'その他' },
          { name: '豚ひき肉', qty: 150, unit: 'g', category: '肉・魚' },
          { name: '豆板醤', qty: 15, unit: 'g', category: '調味料' },
          { name: '醤油', qty: 30, unit: 'ml', category: '調味料' },
          { name: 'ねぎ', qty: 50, unit: 'g', category: '野菜' },
        ],
      },
      {
        name: '青椒肉絲',
        time: 20,
        difficulty: 2,
        ingredients: [
          { name: '豚肉', qty: 200, unit: 'g', category: '肉・魚' },
          { name: 'ピーマン', qty: 150, unit: 'g', category: '野菜' },
          { name: 'たけのこ', qty: 100, unit: 'g', category: '野菜' },
          { name: 'オイスターソース', qty: 30, unit: 'ml', category: '調味料' },
          { name: 'ごま油', qty: 15, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: 'エビチリ',
        time: 30,
        difficulty: 4,
        ingredients: [
          { name: 'エビ', qty: 300, unit: 'g', category: '肉・魚' },
          { name: 'ケチャップ', qty: 60, unit: 'ml', category: '調味料' },
          { name: '豆板醤', qty: 10, unit: 'g', category: '調味料' },
          { name: 'にんにく', qty: 10, unit: 'g', category: '野菜' },
          { name: '生姜', qty: 10, unit: 'g', category: '野菜' },
        ],
      },
      {
        name: '回鍋肉',
        time: 25,
        difficulty: 3,
        ingredients: [
          { name: '豚バラ肉', qty: 300, unit: 'g', category: '肉・魚' },
          { name: 'キャベツ', qty: 300, unit: 'g', category: '野菜' },
          { name: 'ピーマン', qty: 100, unit: 'g', category: '野菜' },
          { name: '甜麺醤', qty: 30, unit: 'g', category: '調味料' },
          { name: 'ごま油', qty: 15, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: '酢豚',
        time: 40,
        difficulty: 4,
        ingredients: [
          { name: '豚肉', qty: 300, unit: 'g', category: '肉・魚' },
          { name: 'ピーマン', qty: 150, unit: 'g', category: '野菜' },
          { name: '人参', qty: 100, unit: 'g', category: '野菜' },
          { name: 'パイナップル', qty: 150, unit: 'g', category: '野菜' },
          { name: '酢', qty: 45, unit: 'ml', category: '調味料' },
          { name: '砂糖', qty: 30, unit: 'g', category: '調味料' },
        ],
      },
    ],
  },
  side: {
    japanese: [
      {
        name: 'ほうれん草のお浸し',
        time: 15,
        difficulty: 1,
        ingredients: [
          { name: 'ほうれん草', qty: 200, unit: 'g', category: '野菜' },
          { name: '醤油', qty: 15, unit: 'ml', category: '調味料' },
          { name: 'だし汁', qty: 15, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: 'ブロッコリーの胡麻和え',
        time: 12,
        difficulty: 1,
        ingredients: [
          { name: 'ブロッコリー', qty: 150, unit: 'g', category: '野菜' },
          { name: 'すりごま', qty: 15, unit: 'g', category: '調味料' },
          { name: '醤油', qty: 8, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: 'きんぴらごぼう',
        time: 20,
        difficulty: 2,
        ingredients: [
          { name: 'ごぼう', qty: 150, unit: 'g', category: '野菜' },
          { name: '人参', qty: 100, unit: 'g', category: '野菜' },
          { name: '醤油', qty: 15, unit: 'ml', category: '調味料' },
          { name: 'みりん', qty: 15, unit: 'ml', category: '調味料' },
          { name: 'ごま油', qty: 10, unit: 'ml', category: '調味料' },
        ],
      },
    ],
    western: [
      {
        name: 'シーザーサラダ',
        time: 10,
        difficulty: 1,
        ingredients: [
          { name: 'レタス', qty: 200, unit: 'g', category: '野菜' },
          { name: 'トマト', qty: 150, unit: 'g', category: '野菜' },
          { name: 'シーザードレッシング', qty: 30, unit: 'ml', category: '調味料' },
          { name: 'パルメザンチーズ', qty: 20, unit: 'g', category: 'その他' },
        ],
      },
      {
        name: 'コールスロー',
        time: 15,
        difficulty: 1,
        ingredients: [
          { name: 'キャベツ', qty: 200, unit: 'g', category: '野菜' },
          { name: '人参', qty: 50, unit: 'g', category: '野菜' },
          { name: 'マヨネーズ', qty: 30, unit: 'ml', category: '調味料' },
          { name: '酢', qty: 15, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: 'ガーリックブレッド',
        time: 12,
        difficulty: 1,
        ingredients: [
          { name: 'フランスパン', qty: 200, unit: 'g', category: 'その他' },
          { name: 'バター', qty: 30, unit: 'g', category: '調味料' },
          { name: 'にんにく', qty: 10, unit: 'g', category: '野菜' },
          { name: 'パセリ', qty: 5, unit: 'g', category: '野菜' },
        ],
      },
    ],
    chinese: [
      {
        name: 'もやしナムル',
        time: 10,
        difficulty: 1,
        ingredients: [
          { name: 'もやし', qty: 200, unit: 'g', category: '野菜' },
          { name: 'ごま油', qty: 15, unit: 'ml', category: '調味料' },
          { name: '塩', qty: 3, unit: 'g', category: '調味料' },
          { name: 'にんにく', qty: 5, unit: 'g', category: '野菜' },
        ],
      },
      {
        name: '中華風きゅうり',
        time: 8,
        difficulty: 1,
        ingredients: [
          { name: 'きゅうり', qty: 200, unit: 'g', category: '野菜' },
          { name: 'ごま油', qty: 10, unit: 'ml', category: '調味料' },
          { name: '醤油', qty: 10, unit: 'ml', category: '調味料' },
          { name: '酢', qty: 10, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: '春雨サラダ',
        time: 15,
        difficulty: 2,
        ingredients: [
          { name: '春雨', qty: 100, unit: 'g', category: 'その他' },
          { name: 'きゅうり', qty: 100, unit: 'g', category: '野菜' },
          { name: 'ハム', qty: 80, unit: 'g', category: '肉・魚' },
          { name: 'ごま油', qty: 15, unit: 'ml', category: '調味料' },
          { name: '醤油', qty: 15, unit: 'ml', category: '調味料' },
        ],
      },
    ],
  },
  soup: {
    japanese: [
      {
        name: '味噌汁',
        time: 10,
        difficulty: 1,
        ingredients: [
          { name: '味噌', qty: 45, unit: 'g', category: '調味料' },
          { name: 'だし汁', qty: 400, unit: 'ml', category: '調味料' },
          { name: 'わかめ', qty: 20, unit: 'g', category: '野菜' },
          { name: '豆腐', qty: 100, unit: 'g', category: 'その他' },
        ],
      },
      {
        name: 'すまし汁',
        time: 8,
        difficulty: 1,
        ingredients: [
          { name: 'だし汁', qty: 400, unit: 'ml', category: '調味料' },
          { name: '醤油', qty: 8, unit: 'ml', category: '調味料' },
          { name: '塩', qty: 2, unit: 'g', category: '調味料' },
          { name: 'ねぎ', qty: 30, unit: 'g', category: '野菜' },
        ],
      },
    ],
    western: [
      {
        name: 'コーンスープ',
        time: 12,
        difficulty: 1,
        ingredients: [
          { name: 'コーン缶', qty: 200, unit: 'g', category: 'その他' },
          { name: '牛乳', qty: 200, unit: 'ml', category: 'その他' },
          { name: 'コンソメ', qty: 5, unit: 'g', category: '調味料' },
          { name: 'バター', qty: 10, unit: 'g', category: '調味料' },
        ],
      },
      {
        name: 'オニオンスープ',
        time: 25,
        difficulty: 2,
        ingredients: [
          { name: '玉ねぎ', qty: 300, unit: 'g', category: '野菜' },
          { name: 'コンソメ', qty: 10, unit: 'g', category: '調味料' },
          { name: 'バター', qty: 15, unit: 'g', category: '調味料' },
          { name: 'チーズ', qty: 50, unit: 'g', category: 'その他' },
        ],
      },
    ],
    chinese: [
      {
        name: 'わかめスープ',
        time: 8,
        difficulty: 1,
        ingredients: [
          { name: 'わかめ', qty: 15, unit: 'g', category: '野菜' },
          { name: '鶏がらスープの素', qty: 5, unit: 'g', category: '調味料' },
          { name: 'ごま油', qty: 5, unit: 'ml', category: '調味料' },
        ],
      },
      {
        name: '卵スープ',
        time: 10,
        difficulty: 1,
        ingredients: [
          { name: '卵', qty: 2, unit: '個', category: 'その他' },
          { name: '鶏がらスープの素', qty: 5, unit: 'g', category: '調味料' },
          { name: 'ねぎ', qty: 30, unit: 'g', category: '野菜' },
        ],
      },
      {
        name: '酸辣湯',
        time: 15,
        difficulty: 3,
        ingredients: [
          { name: '豆腐', qty: 150, unit: 'g', category: 'その他' },
          { name: '卵', qty: 1, unit: '個', category: 'その他' },
          { name: 'きくらげ', qty: 20, unit: 'g', category: '野菜' },
          { name: '酢', qty: 30, unit: 'ml', category: '調味料' },
          { name: 'ラー油', qty: 5, unit: 'ml', category: '調味料' },
        ],
      },
    ],
  },
};

const getDayName = (date: Date): string => {
  const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  return days[date.getDay()];
};

// 在庫から食材を検索
const findInventoryItem = (ingredientName: string, unit: string, inventory: InventoryItem[]) => {
  return inventory.find(item => 
    item.name === ingredientName && 
    item.unit === unit &&
    item.expirationDate > new Date() // 期限切れでない
  );
};

// ダイエットモードでの料理フィルタリング
const filterRecipesByDietMode = (recipes: any[], dietMode: boolean) => {
  if (!dietMode) return recipes;
  
  // ダイエットモードでは揚げ物や高脂質料理を除外
  const avoidKeywords = ['揚げ', 'フライ', '天ぷら', 'カツ', 'から揚げ'];
  return recipes.filter(recipe => 
    !avoidKeywords.some(keyword => recipe.name.includes(keyword))
  );
};

// 調理時間制限での料理フィルタリング
const filterRecipesByTime = (recipes: any[], maxTime: number) => {
  return recipes.filter(recipe => recipe.time <= maxTime);
};

// チャットボット仕様に従ったメニュー生成
export const generateMenuPlanFromChatbotSpec = (
  familyData: FamilyMember,
  startDate: Date,
  endDate: Date,
  userSettings: UserSettings,
  inventory: InventoryItem[],
  busyDates: string[] = [],
  maxCookingTime: number = 60,
  cuisineDistribution: { japanese: number; western: number; chinese: number }
): Recipe[] => {
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // チャットボット仕様の入力データを構築
  const chatbotRequest: ChatbotMenuRequest = {
    week_start_date: startDate.toISOString().split('T')[0],
    days: dayCount,
    people: familyData.count,
    diet_mode: userSettings.healthMode === 'diet',
    budget_per_day_jpy: 1500,
    time_limit_per_day_min: maxCookingTime,
    preferred_genres: ['和食', '洋食', '中華'],
    avoid_genres: [],
    allergies: [],
    dislikes: [],
    must_use_ingredients: [],
    inventory: inventory.map(item => ({
      invId: item.id,
      name: item.name,
      qty: item.amount,
      unit: item.unit,
      category: item.category,
      expires_at: item.expirationDate.toISOString().split('T')[0],
      priority_hint: (() => {
        const daysUntilExpiry = Math.ceil((item.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 3) return 'near_expiry';
        if (item.amount > 500) return 'overstock'; // 大量在庫
        return 'normal';
      })(),
    })),
    pantry: [
      { name: '醤油', unit: 'ml' },
      { name: '塩', unit: 'g' },
      { name: '味噌', unit: 'g' },
      { name: 'みりん', unit: 'ml' },
      { name: '砂糖', unit: 'g' },
      { name: 'ごま油', unit: 'ml' },
      { name: 'オリーブオイル', unit: 'ml' },
      { name: 'バター', unit: 'g' },
    ],
    busy_dates: busyDates,
    max_cooking_time: maxCookingTime,
    cuisine_distribution: cuisineDistribution,
  };

  // メニュー生成ロジック
  const response = generateChatbotMenuResponse(chatbotRequest);
  
  // チャットボット出力をシステム形式に変換
  return convertChatbotResponseToRecipes(response);
};

// チャットボット仕様のメニュー生成ロジック
const generateChatbotMenuResponse = (request: ChatbotMenuRequest): ChatbotMenuResponse => {
  const menus = [];
  const notes: string[] = [];
  const usedInventoryItems: string[] = [];

  // 料理ジャンルの配分を計算
  const totalDays = request.days;
  const distribution = request.cuisine_distribution || {
    japanese: Math.ceil(totalDays * 0.4),
    western: Math.ceil(totalDays * 0.3),
    chinese: Math.floor(totalDays * 0.3),
  };

  // 日付ごとのジャンルを決定
  const dailyGenres: string[] = [];
  for (let i = 0; i < distribution.japanese; i++) dailyGenres.push('japanese');
  for (let i = 0; i < distribution.western; i++) dailyGenres.push('western');
  for (let i = 0; i < distribution.chinese; i++) dailyGenres.push('chinese');
  
  // シャッフル
  for (let i = dailyGenres.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dailyGenres[i], dailyGenres[j]] = [dailyGenres[j], dailyGenres[i]];
  }

  for (let day = 0; day < request.days; day++) {
    const currentDate = new Date(request.week_start_date);
    currentDate.setDate(currentDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const isBusyDay = request.busy_dates?.includes(dateStr);
    const timeLimit = isBusyDay ? request.max_cooking_time || 30 : request.time_limit_per_day_min;
    
    const genre = dailyGenres[day] || 'japanese';
    const genreKey = genre as keyof typeof recipeDatabase.main;

    // 主菜を選択
    let availableMainDishes = recipeDatabase.main[genreKey] || recipeDatabase.main.japanese;
    availableMainDishes = filterRecipesByDietMode(availableMainDishes, request.diet_mode);
    availableMainDishes = filterRecipesByTime(availableMainDishes, timeLimit);
    
    const mainRecipe = availableMainDishes[Math.floor(Math.random() * availableMainDishes.length)];
    const mainWithInventory = applyInventoryToRecipe(mainRecipe, request.inventory, usedInventoryItems, request.people);

    // 副菜を選択（80%の確率）
    let sideRecipe = null;
    if (Math.random() < 0.8) {
      let availableSideDishes = recipeDatabase.side[genreKey] || recipeDatabase.side.japanese;
      availableSideDishes = filterRecipesByDietMode(availableSideDishes, request.diet_mode);
      availableSideDishes = filterRecipesByTime(availableSideDishes, timeLimit - mainWithInventory.time);
      
      if (availableSideDishes.length > 0) {
        const selectedSide = availableSideDishes[Math.floor(Math.random() * availableSideDishes.length)];
        sideRecipe = applyInventoryToRecipe(selectedSide, request.inventory, usedInventoryItems, request.people);
      }
    }

    // 汁物を選択（60%の確率）
    let soupRecipe = null;
    if (Math.random() < 0.6) {
      let availableSoups = recipeDatabase.soup[genreKey] || recipeDatabase.soup.japanese;
      availableSoups = filterRecipesByDietMode(availableSoups, request.diet_mode);
      const remainingTime = timeLimit - mainWithInventory.time - (sideRecipe?.time || 0);
      availableSoups = filterRecipesByTime(availableSoups, remainingTime);
      
      if (availableSoups.length > 0) {
        const selectedSoup = availableSoups[Math.floor(Math.random() * availableSoups.length)];
        soupRecipe = applyInventoryToRecipe(selectedSoup, request.inventory, usedInventoryItems, request.people);
      }
    }

    menus.push({
      date: dateStr,
      main: mainWithInventory,
      side: sideRecipe,
      soup: soupRecipe,
    });
  }

  // 在庫使用のノートを追加
  if (usedInventoryItems.length > 0) {
    notes.push(`在庫を活用: ${usedInventoryItems.join(', ')}`);
  }

  return {
    week_start_date: request.week_start_date,
    menus,
    notes,
  };
};

// 在庫を料理に適用
const applyInventoryToRecipe = (
  recipe: any,
  inventory: ChatbotMenuRequest['inventory'],
  usedInventoryItems: string[],
  people: number
) => {
  const adjustedIngredients = recipe.ingredients.map((ingredient: any) => {
    // 人数に応じて分量調整（4人前基準）
    const adjustedQty = Math.ceil(ingredient.qty * (people / 4));
    
    // 在庫から該当する食材を検索
    const inventoryItem = inventory.find(inv => 
      inv.name === ingredient.name && 
      inv.unit === ingredient.unit &&
      new Date(inv.expires_at) > new Date() // 期限切れでない
    );

    let invId = null;
    if (inventoryItem && inventoryItem.qty >= adjustedQty) {
      invId = inventoryItem.invId;
      // 在庫を消費
      inventoryItem.qty -= adjustedQty;
      if (!usedInventoryItems.includes(inventoryItem.name)) {
        usedInventoryItems.push(inventoryItem.name);
      }
    }

    return {
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: ingredient.name,
      qty: adjustedQty,
      unit: ingredient.unit,
      category: ingredient.category,
      invId,
    };
  });

  return {
    id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: recipe.name,
    genre: getGenreLabel(recipe),
    time: recipe.time,
    difficulty: recipe.difficulty,
    ingredients: adjustedIngredients,
  };
};

// ジャンルラベルを取得
const getGenreLabel = (recipe: any) => {
  // レシピの特徴から和食・洋食・中華を判定
  const japanesKeywords = ['照り焼き', '塩焼き', '生姜焼き', '親子丼', '味噌煮', 'お浸し', '胡麻和え', 'きんぴら', '味噌汁', 'すまし汁'];
  const westernKeywords = ['ハンバーグ', 'ステーキ', 'シチュー', 'グリル', 'ソテー', 'サラダ', 'コールスロー', 'ガーリック', 'コーンスープ', 'オニオンスープ'];
  const chineseKeywords = ['麻婆', '青椒', 'エビチリ', '回鍋肉', '酢豚', 'ナムル', '中華風', '春雨', 'わかめスープ', '卵スープ', '酸辣湯'];

  if (japanesKeywords.some(keyword => recipe.name.includes(keyword))) return '和食';
  if (westernKeywords.some(keyword => recipe.name.includes(keyword))) return '洋食';
  if (chineseKeywords.some(keyword => recipe.name.includes(keyword))) return '中華';
  
  return '和食'; // デフォルト
};

// チャットボット出力をシステム形式に変換
const convertChatbotResponseToRecipes = (response: ChatbotMenuResponse): Recipe[] => {
  const recipes: Recipe[] = [];

  response.menus.forEach(menu => {
    const date = new Date(menu.date);
    const dayName = getDayName(date);

    // 主菜を追加
    if (menu.main) {
      recipes.push({
        id: menu.main.id,
        name: menu.main.name,
        cookingTime: menu.main.time,
        difficulty: menu.main.difficulty,
        ingredients: menu.main.ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          amount: ing.qty,
          unit: ing.unit,
          category: ing.category as any,
        })),
        day: dayName,
        scheduledDate: date,
        category: 'main',
      });
    }

    // 副菜を追加
    if (menu.side) {
      recipes.push({
        id: menu.side.id,
        name: menu.side.name,
        cookingTime: menu.side.time,
        difficulty: menu.side.difficulty,
        ingredients: menu.side.ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          amount: ing.qty,
          unit: ing.unit,
          category: ing.category as any,
        })),
        day: dayName,
        scheduledDate: date,
        category: 'side',
      });
    }

    // 汁物を追加
    if (menu.soup) {
      recipes.push({
        id: menu.soup.id,
        name: menu.soup.name,
        cookingTime: menu.soup.time,
        difficulty: menu.soup.difficulty,
        ingredients: menu.soup.ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          amount: ing.qty,
          unit: ing.unit,
          category: ing.category as any,
        })),
        day: dayName,
        scheduledDate: date,
        category: 'soup',
      });
    }
  });

  return recipes;
};

// 既存のメニュー生成関数（後方互換性のため保持）
export const generateMenuPlan = (
  familyData: FamilyMember,
  startDate: Date,
  endDate: Date,
  userSettings?: UserSettings,
  inventory?: InventoryItem[],
  busyDates?: string[],
  maxCookingTime?: number,
  cuisineDistribution?: { japanese: number; western: number; chinese: number }
): Recipe[] => {
  // 新しいチャットボット仕様の関数を使用
  if (userSettings && inventory) {
    return generateMenuPlanFromChatbotSpec(
      familyData,
      startDate,
      endDate,
      userSettings,
      inventory,
      busyDates,
      maxCookingTime,
      cuisineDistribution
    );
  }

  // 従来のロジック（簡易版）
  return generateSimpleMenuPlan(familyData, startDate, endDate);
};

// 簡易メニュー生成（従来のロジック）
const generateSimpleMenuPlan = (familyData: FamilyMember, startDate: Date, endDate: Date): Recipe[] => {
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const mainDishes = [
    ...recipeDatabase.main.japanese,
    ...recipeDatabase.main.western,
    ...recipeDatabase.main.chinese,
  ];
  const sideDishes = [
    ...recipeDatabase.side.japanese,
    ...recipeDatabase.side.western,
    ...recipeDatabase.side.chinese,
  ];
  const soups = [
    ...recipeDatabase.soup.japanese,
    ...recipeDatabase.soup.western,
    ...recipeDatabase.soup.chinese,
  ];

  const selectedRecipes: Recipe[] = [];
  
  for (let i = 0; i < dayCount; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // 主菜を選択
    const mainIndex = Math.floor(Math.random() * mainDishes.length);
    const selectedMain = mainDishes[mainIndex];
    
    selectedRecipes.push({
      id: `recipe-${Date.now()}-${i}`,
      name: selectedMain.name,
      cookingTime: selectedMain.time,
      difficulty: selectedMain.difficulty,
      ingredients: selectedMain.ingredients.map((ing, idx) => ({
        id: `${selectedMain.name}-${ing.name}-${idx}`,
        name: ing.name,
        amount: Math.ceil(ing.qty * (familyData.count / 4)), // 4人前基準で調整
        unit: ing.unit,
        category: ing.category as any,
      })),
      category: 'main',
      day: getDayName(currentDate),
      scheduledDate: new Date(currentDate),
    });
    
    // 副菜を選択（80%の確率）
    if (Math.random() < 0.8) {
      const sideIndex = Math.floor(Math.random() * sideDishes.length);
      const selectedSide = sideDishes[sideIndex];
      
      selectedRecipes.push({
        id: `recipe-${Date.now()}-${i}-side`,
        name: selectedSide.name,
        cookingTime: selectedSide.time,
        difficulty: selectedSide.difficulty,
        ingredients: selectedSide.ingredients.map((ing, idx) => ({
          id: `${selectedSide.name}-${ing.name}-${idx}`,
          name: ing.name,
          amount: Math.ceil(ing.qty * (familyData.count / 4)),
          unit: ing.unit,
          category: ing.category as any,
        })),
        category: 'side',
        day: getDayName(currentDate),
        scheduledDate: new Date(currentDate),
      });
    }
    
    // 汁物を選択（60%の確率）
    if (Math.random() < 0.6) {
      const soupIndex = Math.floor(Math.random() * soups.length);
      const selectedSoup = soups[soupIndex];
      
      selectedRecipes.push({
        id: `recipe-${Date.now()}-${i}-soup`,
        name: selectedSoup.name,
        cookingTime: selectedSoup.time,
        difficulty: selectedSoup.difficulty,
        ingredients: selectedSoup.ingredients.map((ing, idx) => ({
          id: `${selectedSoup.name}-${ing.name}-${idx}`,
          name: ing.name,
          amount: Math.ceil(ing.qty * (familyData.count / 4)),
          unit: ing.unit,
          category: ing.category as any,
        })),
        category: 'soup',
        day: getDayName(currentDate),
        scheduledDate: new Date(currentDate),
      });
    }
  }

  return selectedRecipes;
};