import React, { useState } from 'react';
import { ChefHat, Settings, Users, Sparkles, Calendar, Clock, Heart, Zap, Bot } from 'lucide-react';
import { FamilyMember, UserSettings } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import DifyConfigModal from '../components/DifyConfigModal';
import { useDifyConfig } from '../hooks/useDifyConfig';
import { testDifyConnection } from '../utils/testDifyConnection';

interface HomePageProps {
  settings: UserSettings;
  onGenerateMenu: (
    familyData: FamilyMember, 
    startDate: Date, 
    endDate: Date, 
    options?: {
      busyDates?: string[];
      maxCookingTime?: number;
      cuisineDistribution?: { japanese: number; western: number; chinese: number };
    }
  ) => void;
  onNavigateToSettings: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ settings, onGenerateMenu, onNavigateToSettings }) => {
  const { config: difyConfig, hasConfig, saveConfig, isFromEnv } = useDifyConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [showDifyModal, setShowDifyModal] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 6);
    return nextWeek.toISOString().split('T')[0];
  });
  const [japaneseDays, setJapaneseDays] = useState(2);
  const [westernDays, setWesternDays] = useState(3);
  const [chineseDays, setChineseDays] = useState(2);
  const [busyDates, setBusyDates] = useState<string[]>([]);
  const [maxCookingTime, setMaxCookingTime] = useState(20);
  const [useDifyBot, setUseDifyBot] = useState(false);

  const handleGenerateMenu = async () => {
    console.log('[HomePage] メニュー生成ボタンクリック');
    
    if (settings.familyCount === 0) {
      // 基本設定が未設定の場合は設定画面に誘導
      console.log('[HomePage] 基本設定未設定、設定画面へ');
      onNavigateToSettings();
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      alert('終了日は開始日より後の日付を選択してください');
      return;
    }

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalCuisineDays = japaneseDays + westernDays + chineseDays;
    
    if (totalCuisineDays !== totalDays) {
      alert(`料理の種類の合計日数（${totalCuisineDays}日）が期間の日数（${totalDays}日）と一致しません`);
      return;
    }
    
    console.log('[HomePage] パラメータ準備', {
      useDifyBot,
      hasConfig,
      difyConfig: difyConfig ? '設定あり' : '設定なし'
    });
    
    // Dify使用時は接続テストを実行
    if (useDifyBot && hasConfig && difyConfig) {
      console.log('[HomePage] Dify接続テストを実行');
      const testResult = await testDifyConnection(difyConfig.apiEndpoint, difyConfig.apiKey);
      if (!testResult.success) {
        alert(`Dify API接続エラー: ${testResult.error}\n\n詳細: ${testResult.details || 'なし'}\n\nローカル生成を使用してください。`);
        setIsLoading(false);
        return;
      }
    }
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const familyData: FamilyMember = {
      count: settings.familyCount,
      preferences: settings.preferences || undefined,
    };
    
    // チャットボット仕様に従ったメニュー生成のパラメータを準備
    const cuisineDistribution = {
      japanese: japaneseDays,
      western: westernDays,
      chinese: chineseDays,
    };
    
    // onGenerateMenuは高階関数なので、()を追加して実行
    const generateMenuFunction = onGenerateMenu(familyData, start, end, {
      busyDates,
      maxCookingTime,
      cuisineDistribution,
      useDifyBot: useDifyBot && hasConfig,
      difyConfig: hasConfig ? difyConfig : undefined,
    });
    
    console.log('[HomePage] メニュー生成関数を実行');
    await generateMenuFunction();
    
    setIsLoading(false);
  };

  // 期間内の日付リストを生成
  const getDateRange = () => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      const weekday = weekdays[d.getDay()];
      dates.push({
        value: d.toISOString().split('T')[0],
        label: `${dateStr}(${weekday})`,
        fullDate: new Date(d)
      });
    }
    return dates;
  };

  const dateRange = getDateRange();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="美味しいメニューを生成中..." />
      </div>
    );
  }

  // ヘルスモード別の設定を取得
  const getModeConfig = (healthMode: string) => {
    switch (healthMode) {
      case 'diet':
        return {
          label: 'ダイエットモード',
          icon: Heart,
          cardColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'workout':
        return {
          label: '筋トレモード',
          icon: Zap,
          cardColor: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600'
        };
      default:
        return {
          label: '通常モード',
          icon: Users,
          cardColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        };
    }
  };

  const modeConfig = getModeConfig(settings.healthMode || 'normal');
  const ModeIcon = modeConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">料理管理システム</h1>
          <p className="text-gray-600">1週間分の夕飯メニューを提案します</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* 現在の設定表示 */}
          {settings.familyCount > 0 ? (
            <div className={`border rounded-xl p-4 ${modeConfig.cardColor}`}>
              <h3 className={`font-semibold mb-3 flex items-center ${modeConfig.textColor}`}>
                <ModeIcon size={18} className={`mr-2 ${modeConfig.iconColor}`} />
                現在の設定
              </h3>
              <div className="space-y-2 text-sm">
                <p className={modeConfig.textColor}>
                  <span className="font-medium">家族人数：</span>
                  <span className="text-2xl font-bold ml-2">{settings.familyCount}</span>人
                </p>
                <p className={`flex items-center ${modeConfig.textColor}`}>
                  <ModeIcon size={16} className={`mr-2 ${modeConfig.iconColor}`} />
                  <span className="font-medium">モード：</span>
                  <span className="ml-2">{modeConfig.label}</span>
                </p>
                {settings.preferences && (
                  <p className={modeConfig.textColor}>
                    <span className="font-medium">好み：</span>
                    <span className="ml-2">{settings.preferences.slice(0, 50)}{settings.preferences.length > 50 ? '...' : ''}</span>
                  </p>
                )}
              </div>
              <button
                onClick={onNavigateToSettings}
                className={`mt-3 text-sm font-medium flex items-center transition-colors duration-200 ${
                  settings.healthMode === 'diet' ? 'text-green-600 hover:text-green-700' :
                  settings.healthMode === 'workout' ? 'text-orange-600 hover:text-orange-700' :
                  'text-gray-600 hover:text-gray-700'
                }`}
              >
                <Settings size={16} className="mr-1" />
                設定を変更
              </button>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <Settings size={18} className="mr-2" />
                基本設定が必要です
              </h3>
              <p className="text-yellow-700 text-sm mb-3">
                メニューを生成する前に、家族人数と好みを設定してください。
              </p>
              <button
                onClick={onNavigateToSettings}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center text-sm"
              >
                <Settings size={16} className="mr-2" />
                基本設定へ
              </button>
            </div>
          )}

          {/* 期間設定 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <Calendar size={18} className="mr-2" />
              メニュー期間設定
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm"
                />
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}日分のメニューを生成します
            </p>

            {/* 料理の種類設定 */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-blue-600">和食</span>
                  <input
                    type="number"
                    min="0"
                    value={japaneseDays}
                    onChange={(e) => setJapaneseDays(parseInt(e.target.value) || 0)}
                    className="w-12 p-1 border border-blue-300 rounded text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-blue-600">日</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-blue-600">洋食</span>
                  <input
                    type="number"
                    min="0"
                    value={westernDays}
                    onChange={(e) => setWesternDays(parseInt(e.target.value) || 0)}
                    className="w-12 p-1 border border-blue-300 rounded text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-blue-600">日</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-blue-600">中華</span>
                  <input
                    type="number"
                    min="0"
                    value={chineseDays}
                    onChange={(e) => setChineseDays(parseInt(e.target.value) || 0)}
                    className="w-12 p-1 border border-blue-300 rounded text-xs text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-blue-600">日</span>
                </div>
                <span className={`text-xs font-semibold ${
                  (japaneseDays + westernDays + chineseDays) === Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                    ? 'text-blue-700'
                    : 'text-red-600'
                }`}>
                  {japaneseDays + westernDays + chineseDays} / {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}日
                </span>
              </div>
            </div>
          </div>

          {/* 調理時間制約設定 */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
              <Clock size={18} className="mr-2" />
              調理時間制約
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  忙しい日（調理時間を短くしたい日付）
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {dateRange.map((dateInfo) => {
                    const isSelected = busyDates.includes(dateInfo.value);
                    
                    return (
                      <button
                        key={dateInfo.value}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setBusyDates(busyDates.filter(d => d !== dateInfo.value));
                          } else {
                            setBusyDates([...busyDates, dateInfo.value]);
                          }
                        }}
                        className={`p-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'bg-white border border-purple-300 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        {dateInfo.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-purple-700">
                  最大調理時間:
                </label>
                <select
                  value={maxCookingTime}
                  onChange={(e) => setMaxCookingTime(parseInt(e.target.value))}
                  className="px-3 py-1 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-sm"
                >
                  <option value={10}>10分</option>
                  <option value={15}>15分</option>
                  <option value={20}>20分</option>
                  <option value={25}>25分</option>
                  <option value={30}>30分</option>
                </select>
                <span className="text-xs text-purple-600">
                  {busyDates.length > 0 ? `${busyDates.length}日選択中` : '選択なし'}
                </span>
              </div>
            </div>
            <p className="text-sm text-purple-600 mt-2">
              選択した日付には調理時間の短いメニューが提案されます
            </p>
          </div>

          {/* Difyチャットボット設定 */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-indigo-800 flex items-center">
                <Bot size={18} className="mr-2" />
                AIチャットボット連携
              </h3>
              {!isFromEnv && (
                <button
                  onClick={() => setShowDifyModal(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors duration-200"
                >
                  設定
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="useDifyBot"
                checked={useDifyBot}
                onChange={(e) => setUseDifyBot(e.target.checked)}
                disabled={!hasConfig}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="useDifyBot" className={`text-sm font-medium ${hasConfig ? 'text-indigo-700' : 'text-gray-400'}`}>
                Difyチャットボットを使用してメニュー生成
              </label>
            </div>
            
            <div className="text-sm">
              {hasConfig ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">
                    {isFromEnv ? 'Dify設定済み（環境変数）' : 'Dify設定済み'}
                  </span>
                  <span className="text-indigo-600">
                    {useDifyBot ? 'AIが高度なメニューを生成します' : 'ローカル生成を使用'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-500">Dify未設定</span>
                  {isFromEnv ? (
                    <span className="text-gray-500">（.envファイルでAPIキーを設定してください）</span>
                  ) : (
                    <button
                      onClick={() => setShowDifyModal(true)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium underline"
                    >
                      今すぐ設定
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <p className="text-xs text-indigo-600 mt-2">
              {hasConfig 
                ? 'DifyのAIチャットボットがより高度で個性的なメニューを提案します'
                : 'Difyチャットボットを設定すると、AIによる高度なメニュー生成が利用できます'
              }
            </p>
          </div>

          <button
            onClick={handleGenerateMenu}
            className={`w-full font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
              settings.familyCount > 0
                ? useDifyBot && hasConfig
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-xl transform hover:scale-105'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={settings.familyCount === 0}
          >
            <ChefHat size={20} />
            <span>
              {settings.familyCount > 0 
                ? useDifyBot && hasConfig 
                  ? 'AIメニューを生成（要ログイン）' 
                  : 'メニューを生成（要ログイン）'
                : '基本設定を完了してください'
              }
            </span>
            {useDifyBot && hasConfig && <Bot size={16} className="ml-2" />}
          </button>
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          <p>設定に基づいて、バランスの良いメニューを提案します</p>
          <p className="mt-1 text-orange-600">※ メニュー生成にはアカウント登録が必要です</p>
        </div>
      </div>

      {/* Dify設定モーダル */}
      <DifyConfigModal
        isOpen={showDifyModal}
        onClose={() => setShowDifyModal(false)}
        onSave={saveConfig}
        currentConfig={difyConfig}
      />
    </div>
  );
};

export default HomePage;