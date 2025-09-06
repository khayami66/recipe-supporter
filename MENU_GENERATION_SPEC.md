# メニュー生成機能 詳細仕様書

## 📋 概要

家族構成、好み、期間設定に基づいて、栄養バランスの取れた1週間分の夕飯メニューを自動生成する機能の詳細仕様です。

## 🔄 入力・出力仕様

### 📥 入力データ構造

#### 1. 基本設定（UserSettings）
```typescript
interface UserSettings {
  familyCount: number;           // 家族人数（自動計算）
  preferences: string;           // 好みの自由記述
  familyMembers: FamilyMemberDetail[];  // 家族構成詳細
  healthMode: 'normal' | 'diet' | 'workout';  // ヘルスモード
  recipeFrequency: {            // 評価別出現頻度
    S: number;  // S級料理の出現間隔（日）
    A: number;  // A級料理の出現間隔（日）
    B: number;  // B級料理の出現間隔（日）
    C: number;  // C級料理の出現間隔（日）※実際は除外
  };
  lastUpdated: Date;            // 最終更新日時
}

interface FamilyMemberDetail {
  id: string;                   // 一意識別子
  birthDate: Date;              // 生年月日
  gender: 'male' | 'female';    // 性別
  appetiteLevel: number;        // 食欲レベル（1-5）
  name?: string;                // 名前（任意）
}
```

#### 2. 期間設定
```typescript
interface PeriodSettings {
  startDate: Date;              // 開始日
  endDate: Date;                // 終了日
  totalDays: number;            // 総日数（自動計算）
}
```

#### 3. 料理種類設定
```typescript
interface CuisineSettings {
  japaneseDays: number;         // 和食の日数
  westernDays: number;          // 洋食の日数
  chineseDays: number;          // 中華の日数
  totalCuisineDays: number;     // 合計日数（検証用）
}
```

#### 4. 調理時間制約
```typescript
interface CookingTimeConstraints {
  busyDates: string[];          // 忙しい日付の配列（YYYY-MM-DD形式）
  maxCookingTime: number;       // 最大調理時間（分）
}
```

#### 5. 在庫情報（参考用）
```typescript
interface InventoryItem {
  id: string;                   // 一意識別子
  name: string;                 // 食材名
  amount: number;               // 数量
  unit: string;                 // 単位
  category: IngredientCategory; // カテゴリ
  expirationDate: Date;         // 賞味期限
  addedDate: Date;              // 追加日
}

type IngredientCategory = '野菜' | '肉・魚' | '調味料' | 'その他';
```

#### 6. 過去の評価データ（参考用）
```typescript
interface RecipeRating {
  id: string;                   // 一意識別子
  userId: string;               // ユーザーID
  recipeName: string;           // レシピ名
  taste: number;                // おいしさ（1-5）
  cookingTime: number;          // 調理時間満足度（1-5）
  difficulty: number;           // 難易度満足度（1-5）
  wouldMakeAgain: number;       // またつくりたい（1-5）
  ratedDate: Date;              // 評価日
  createdAt: Date;              // 作成日時
}
```

### 📤 出力データ構造

#### 1. メニュープラン
```typescript
interface MenuPlan {
  recipes: Recipe[];            // レシピ配列
  generatedDate: Date;          // 生成日時
  startDate: Date;              // 開始日
  endDate: Date;                // 終了日
}

interface Recipe {
  id: string;                   // 一意識別子
  name: string;                 // レシピ名
  cookingTime: number;          // 調理時間（分）
  difficulty: number;           // 難易度（1-5）
  ingredients: Ingredient[];    // 必要食材
  day: string;                  // 曜日（例：月曜日）
  scheduledDate: Date;          // 予定日
  category: 'main' | 'side' | 'soup';  // カテゴリ
}

interface Ingredient {
  id: string;                   // 一意識別子
  name: string;                 // 食材名
  amount: number;               // 必要量
  unit: string;                 // 単位
  category: IngredientCategory; // カテゴリ
}
```

## 🧮 メニュー生成アルゴリズム

### 1. 前処理
```
1. 入力データの検証
   - 期間の妥当性チェック
   - 料理種類の日数合計チェック
   - 家族構成の整合性チェック

2. 基準分量の設定
   - 2人前を基準とする
   - 家族構成に基づく調整係数の計算
```

### 2. レシピ選択ロジック
```
1. 利用可能レシピの抽出
   - ヘルスモードに適合するレシピ
   - 過去評価がC級でないレシピ
   - 調理時間制約に適合するレシピ

2. 評価ベース頻度制御
   - S級: 設定日数に1回の頻度で優先選択
   - A級: 設定日数に1回の頻度で選択
   - B級: 設定日数に1回の頻度で選択
   - C級: 選択対象から除外

3. 料理種類の割り当て
   - 指定された和食・洋食・中華の日数に従って分配
   - ランダム性を保ちつつバランスを考慮
```

### 3. 分量調整ロジック
```typescript
// 分量調整の計算式
adjustedAmount = baseAmount * (familyCount / 2) * appetiteAdjustment

// 食欲調整係数の計算
appetiteAdjustment = averageAppetiteLevel / 3.0
// averageAppetiteLevel: 家族全員の食欲レベルの平均値
```

### 4. 献立構成ロジック
```
各日の献立構成:
- 主菜: 必須（100%）
- 副菜: 確率的追加（80%）
- 汁物: 確率的追加（60%）

調理時間制約の適用:
- 忙しい日: maxCookingTime以下のレシピのみ選択
- 通常日: 制約なし
```

## 📊 データベース連携

### 1. 参照テーブル
```sql
-- ユーザー設定
SELECT * FROM user_profiles WHERE id = :userId;

-- 過去の評価
SELECT * FROM user_recipe_ratings WHERE user_id = :userId;

-- 現在の在庫
SELECT * FROM user_inventory WHERE user_id = :userId;
```

### 2. 保存処理
```sql
-- 生成されたメニューの保存
INSERT INTO user_menu_plans (user_id, recipes, generated_date)
VALUES (:userId, :recipes, :generatedDate);
```

## 🎯 ヘルスモード別の特徴

### 通常モード
```
特徴:
- バランスの良い栄養配分
- 多様な料理ジャンル
- 標準的な調理時間

選択基準:
- 全カテゴリから均等に選択
- 特別な制約なし
```

### ダイエットモード
```
特徴:
- 低カロリー重視
- 野菜中心の構成
- 蒸し・茹で料理を優先

選択基準:
- 揚げ物・炒め物を制限
- 野菜の比率を増加
- 調理法を限定
```

### 筋トレモード
```
特徴:
- 高タンパク質重視
- 肉・魚料理を多用
- ボリューム重視

選択基準:
- タンパク質源を必須化
- 肉・魚の比率を増加
- 分量を1.2倍に調整
```

## 🔄 エラーハンドリング

### 入力検証エラー
```typescript
interface ValidationError {
  field: string;                // エラーフィールド
  message: string;              // エラーメッセージ
  code: string;                 // エラーコード
}

// エラー例
{
  field: "cuisineSettings",
  message: "料理の種類の合計日数（7日）が期間の日数（5日）と一致しません",
  code: "CUISINE_DAYS_MISMATCH"
}
```

### 生成失敗エラー
```typescript
interface GenerationError {
  type: 'INSUFFICIENT_RECIPES' | 'DATABASE_ERROR' | 'CONSTRAINT_CONFLICT';
  message: string;
  details?: any;
}
```

## 📈 パフォーマンス考慮事項

### 1. レシピデータベース
```
- インデックス: category, difficulty, cookingTime
- キャッシュ: 頻繁に使用されるレシピ
- 分割: ヘルスモード別のテーブル分割
```

### 2. 生成処理
```
- 非同期処理: UIブロッキングを防止
- プログレス表示: 生成進捗の可視化
- タイムアウト: 長時間処理の制限
```

## 🧪 テストケース

### 1. 正常系テスト
```
テストケース1: 標準的な家族構成
入力:
- 家族4人（大人2人、子供2人）
- 期間: 7日間
- 通常モード
- 和食3日、洋食2日、中華2日

期待結果:
- 7日分のメニュー生成
- 各日に主菜が含まれる
- 指定した料理種類の配分
```

### 2. 異常系テスト
```
テストケース1: 日数不整合
入力:
- 期間: 5日間
- 和食3日、洋食3日、中華3日（合計9日）

期待結果:
- ValidationError発生
- エラーメッセージ表示
```

### 3. 境界値テスト
```
テストケース1: 最小構成
入力:
- 家族1人
- 期間: 1日間
- 和食1日

期待結果:
- 1日分のメニュー生成
- 分量が1人前に調整
```

## 🔧 チャットボット連携仕様

### 1. 入力パラメータマッピング
```typescript
// チャットボットからの入力例
interface ChatbotInput {
  familySize: number;           // "4人家族です"
  period: string;               // "来週1週間分"
  preferences: string[];        // ["辛いもの好き", "魚料理中心"]
  restrictions: string[];       // ["アレルギー: 卵", "ダイエット中"]
  busyDays: string[];          // ["月曜日", "水曜日"]
}

// システム内部形式への変換
function convertChatbotInput(input: ChatbotInput): MenuGenerationInput {
  return {
    userSettings: {
      familyCount: input.familySize,
      preferences: input.preferences.join(", "),
      healthMode: detectHealthMode(input.restrictions),
      // ...
    },
    periodSettings: parsePeriod(input.period),
    constraints: {
      busyDates: convertBusyDays(input.busyDays),
      // ...
    }
  };
}
```

### 2. 出力フォーマット
```typescript
// チャットボット向け出力
interface ChatbotOutput {
  success: boolean;
  menuPlan?: {
    totalDays: number;
    dailyMenus: DailyMenu[];
    summary: MenuSummary;
  };
  error?: {
    type: string;
    message: string;
    suggestions: string[];
  };
}

interface DailyMenu {
  date: string;                 // "2025年1月20日（月）"
  dishes: {
    main: string;               // "鶏の照り焼き"
    side?: string;              // "キャベツサラダ"
    soup?: string;              // "味噌汁"
  };
  cookingTime: number;          // 合計調理時間
  difficulty: number;           // 平均難易度
}

interface MenuSummary {
  totalRecipes: number;         // 総レシピ数
  averageCookingTime: number;   // 平均調理時間
  cuisineDistribution: {        // 料理種類の分布
    japanese: number;
    western: number;
    chinese: number;
  };
  shoppingListPreview: string[]; // 主要な買い物リスト
}
```

### 3. 自然言語処理対応
```typescript
// 期間の解析例
function parsePeriod(periodText: string): PeriodSettings {
  const patterns = {
    "今週": () => getThisWeek(),
    "来週": () => getNextWeek(),
    "今日から7日間": () => getNext7Days(),
    "月曜日から金曜日": () => getWeekdays(),
  };
  
  // パターンマッチングによる期間特定
}

// 好みの解析例
function parsePreferences(preferences: string[]): {
  healthMode: HealthMode;
  cuisinePreference: string;
  restrictions: string[];
} {
  // 自然言語から構造化データへの変換
}
```

## 📝 API仕様（チャットボット連携用）

### エンドポイント
```
POST /api/generate-menu
Content-Type: application/json

Request Body:
{
  "familySize": 4,
  "period": "来週1週間",
  "preferences": ["辛いもの好き", "野菜多め"],
  "restrictions": ["卵アレルギー"],
  "busyDays": ["月曜日", "水曜日"]
}

Response:
{
  "success": true,
  "menuPlan": {
    "totalDays": 7,
    "dailyMenus": [...],
    "summary": {...}
  }
}
```

---

*最終更新: 2025年1月*
*対象システム: 料理管理システム v1.0*