import { UserSettings, InventoryItem, MenuPlan, Recipe } from '../types';

// Difyチャットボット用の入力データ構造
export interface DifyChatbotRequest {
  week_start_date: string;
  days: number;
  people: number;
  diet_mode: boolean;
  budget_per_day_jpy: number;
  time_limit_per_day_min: number;
  preferred_genres: string[];
  avoid_genres: string[];
  allergies: string[];
  dislikes: string[];
  must_use_ingredients: string[];
  inventory: {
    invId: string;
    name: string;
    qty: number;
    unit: string;
    category: string;
    expires_at: string;
    priority_hint: 'overstock' | 'near_expiry' | 'normal';
  }[];
  pantry: {
    name: string;
    unit: string;
  }[];
  busy_dates?: string[];
  max_cooking_time?: number;
  cuisine_distribution?: {
    japanese: number;
    western: number;
    chinese: number;
  };
}

// Difyチャットボット用の出力データ構造
export interface DifyChatbotResponse {
  week_start_date: string;
  menus: {
    date: string;
    main: {
      id: string;
      name: string;
      genre: string;
      time: number;
      difficulty: number;
      ingredients: {
        id: string;
        name: string;
        qty: number;
        unit: string;
        category: string;
        invId: string | null;
      }[];
    };
    side?: {
      id: string;
      name: string;
      genre: string;
      time: number;
      difficulty: number;
      ingredients: {
        id: string;
        name: string;
        qty: number;
        unit: string;
        category: string;
        invId: string | null;
      }[];
    } | null;
    soup?: {
      id: string;
      name: string;
      genre: string;
      time: number;
      difficulty: number;
      ingredients: {
        id: string;
        name: string;
        qty: number;
        unit: string;
        category: string;
        invId: string | null;
      }[];
    } | null;
  }[];
  notes: string[];
}

// システム内部データをDify形式に変換
export const convertToDifyRequest = (
  userSettings: UserSettings,
  inventory: InventoryItem[],
  startDate: Date,
  endDate: Date,
  options?: {
    busyDates?: string[];
    maxCookingTime?: number;
    cuisineDistribution?: { japanese: number; western: number; chinese: number };
  }
): DifyChatbotRequest => {
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // 好みから制約を抽出
  const preferences = userSettings.preferences.toLowerCase();
  const allergies: string[] = [];
  const dislikes: string[] = [];
  
  // アレルギー情報を抽出
  if (preferences.includes('卵アレルギー') || preferences.includes('卵NG')) allergies.push('卵');
  if (preferences.includes('乳製品アレルギー') || preferences.includes('乳製品NG')) allergies.push('乳製品');
  if (preferences.includes('小麦アレルギー') || preferences.includes('小麦NG')) allergies.push('小麦');
  if (preferences.includes('そばアレルギー') || preferences.includes('そばNG')) allergies.push('そば');
  if (preferences.includes('えびアレルギー') || preferences.includes('えびNG')) allergies.push('えび');
  
  // 嫌いな食材を抽出
  if (preferences.includes('魚嫌い') || preferences.includes('魚NG')) dislikes.push('魚');
  if (preferences.includes('野菜嫌い') || preferences.includes('野菜NG')) dislikes.push('野菜');
  if (preferences.includes('辛いもの嫌い') || preferences.includes('辛いものNG')) dislikes.push('辛い料理');

  return {
    week_start_date: startDate.toISOString().split('T')[0],
    days: dayCount,
    people: userSettings.familyCount,
    diet_mode: userSettings.healthMode === 'diet',
    budget_per_day_jpy: 1500, // デフォルト値
    time_limit_per_day_min: options?.maxCookingTime || 45,
    preferred_genres: ['和食', '洋食', '中華'],
    avoid_genres: [],
    allergies,
    dislikes,
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
        if (item.amount > 500) return 'overstock';
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
      { name: 'コンソメ', unit: 'g' },
      { name: 'だし汁', unit: 'ml' },
    ],
    busy_dates: options?.busyDates || [],
    max_cooking_time: options?.maxCookingTime || 30,
    cuisine_distribution: options?.cuisineDistribution || {
      japanese: Math.ceil(dayCount * 0.4),
      western: Math.ceil(dayCount * 0.3),
      chinese: Math.floor(dayCount * 0.3),
    },
  };
};

// Dify出力をシステム内部形式に変換
export const convertFromDifyResponse = (response: DifyChatbotResponse): Recipe[] => {
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

// 曜日名を取得
const getDayName = (date: Date): string => {
  const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  return days[date.getDay()];
};

// DifyチャットボットAPIを呼び出し
export const callDifyChatbot = async (
  request: DifyChatbotRequest,
  apiEndpoint: string,
  apiKey: string
): Promise<DifyChatbotResponse> => {
  console.log('[Dify API呼び出し] 開始', {
    endpoint: apiEndpoint,
    hasKey: !!apiKey,
    requestDays: request.days,
    people: request.people
  });
  
  try {
    // Dify Chat APIの仕様に合わせたリクエスト形式
    const difyRequest = {
      inputs: {},
      query: JSON.stringify(request), // JSONを文字列として送信
      response_mode: 'blocking', // 同期的にレスポンスを待つ
      conversation_id: '', // 新しい会話として開始
      user: 'recipe-system', // システムのユーザー識別子
    };

    const fullUrl = `${apiEndpoint}/chat-messages`;
    console.log('[Dify API] URL:', fullUrl);
    console.log('[Dify API] リクエストボディサイズ:', JSON.stringify(difyRequest).length, 'bytes');
    
    // タイムアウトを60秒に延長
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(difyRequest),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dify APIエラー]', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      });
      throw new Error(`API呼び出しエラー: ${response.status} ${response.statusText}`);
    }

    const difyResponseData = await response.json();
    console.log('[Dify API] レスポンス受信', {
      hasAnswer: !!difyResponseData.answer,
      answerLength: difyResponseData.answer?.length,
      conversationId: difyResponseData.conversation_id
    });
    
    // Difyからのレスポンスを処理
    let parsedResponse: DifyChatbotResponse;
    
    if (difyResponseData.answer) {
      // answerフィールドからJSONを抽出
      try {
        // JSONブロックを抽出（```json ... ``` の形式に対応）
        let jsonStr = difyResponseData.answer;
        const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        
        parsedResponse = JSON.parse(jsonStr);
        console.log('[Dify API] JSON解析成功', {
          menusCount: parsedResponse.menus?.length
        });
      } catch (parseError) {
        console.error('[Dify API] JSON解析エラー', {
          error: parseError,
          rawAnswer: difyResponseData.answer?.substring(0, 500)
        });
        throw new Error('Difyからのレスポンスの解析に失敗しました');
      }
    } else {
      throw new Error('Difyからの応答にanswerフィールドがありません');
    }
    
    // レスポンスの妥当性をチェック
    if (!parsedResponse.week_start_date || !Array.isArray(parsedResponse.menus)) {
      console.error('[Dify API] 無効なレスポンス構造', {
        hasStartDate: !!parsedResponse.week_start_date,
        hasMenus: !!parsedResponse.menus,
        isMenusArray: Array.isArray(parsedResponse.menus)
      });
      throw new Error('無効なレスポンス形式です');
    }

    console.log('[Dify API] 成功');
    return parsedResponse;
    } catch (fetchError) {
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[Dify API] タイムアウト (60秒)');
      throw new Error('API呼び出しがタイムアウトしました（60秒）。Dify APIの設定を確認してください。');
    }
    console.error('[Dify API] エラー詳細:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      endpoint: apiEndpoint,
    });
    throw error;
  }
};

// メニュー生成のメイン関数（Dify連携版）
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
  // Dify設定がない場合はローカル生成にフォールバック
  if (!difyConfig?.apiEndpoint || !difyConfig?.apiKey) {
    console.log('[generateMenuWithDify] Dify設定なし、ローカル生成使用');
    return generateMenuPlanLocal(userSettings, inventory, startDate, endDate, options);
  }

  try {
    // システムデータをDify形式に変換
    const difyRequest = convertToDifyRequest(userSettings, inventory, startDate, endDate, options);
    
    // DifyチャットボットAPI呼び出し
    const difyResponse = await callDifyChatbot(difyRequest, difyConfig.apiEndpoint, difyConfig.apiKey);
    
    // Dify出力をシステム形式に変換
    const recipes = convertFromDifyResponse(difyResponse);
    
    console.log('[generateMenuWithDify] 成功', {
      recipesCount: recipes.length,
      notes: difyResponse.notes
    });
    return recipes;
  } catch (error) {
    console.error('[generateMenuWithDify] エラー、ローカル生成にフォールバック', error);
    
    // エラー時はローカル生成にフォールバック
    return generateMenuPlanLocal(userSettings, inventory, startDate, endDate, options);
  }
};

// ローカルメニュー生成（フォールバック用）
const generateMenuPlanLocal = (
  userSettings: UserSettings,
  inventory: InventoryItem[],
  startDate: Date,
  endDate: Date,
  options?: {
    busyDates?: string[];
    maxCookingTime?: number;
    cuisineDistribution?: { japanese: number; western: number; chinese: number };
  }
): Recipe[] => {
  // 既存のローカル生成ロジックを使用
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
        amount: Math.ceil(ing.qty * (userSettings.familyCount / 4)),
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
          amount: Math.ceil(ing.qty * (userSettings.familyCount / 4)),
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
          amount: Math.ceil(ing.qty * (userSettings.familyCount / 4)),
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

// レシピデータベース（簡略版）
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
    ],
  },
};