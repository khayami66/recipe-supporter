import React, { useState, useEffect } from 'react';
import { X, Bot, Key, Globe, Save, Check } from 'lucide-react';

interface DifyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: { apiEndpoint: string; apiKey: string }) => void;
  currentConfig?: { apiEndpoint: string; apiKey: string } | null;
}

const DifyConfigModal: React.FC<DifyConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}) => {
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setApiEndpoint(currentConfig.apiEndpoint);
      setApiKey(currentConfig.apiKey);
    }
  }, [currentConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiEndpoint.trim() || !apiKey.trim()) {
      alert('APIエンドポイントとAPIキーの両方を入力してください');
      return;
    }

    onSave({
      apiEndpoint: apiEndpoint.trim(),
      apiKey: apiKey.trim(),
    });

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  const handleTestConnection = async () => {
    if (!apiEndpoint.trim() || !apiKey.trim()) {
      alert('APIエンドポイントとAPIキーを入力してください');
      return;
    }

    try {
      // 簡単なテストリクエストを送信
      const testRequestData = {
        week_start_date: "2025-01-20",
        days: 1,
        people: 2,
        diet_mode: false,
        budget_per_day_jpy: 1000,
        time_limit_per_day_min: 30,
        preferred_genres: ["和食"],
        avoid_genres: [],
        allergies: [],
        dislikes: [],
        must_use_ingredients: [],
        inventory: [],
        pantry: [
          { name: "醤油", unit: "ml" },
          { name: "塩", unit: "g" }
        ]
      };

      // Dify Chat APIの仕様に合わせたリクエスト形式
      const difyRequest = {
        inputs: {},
        query: JSON.stringify(testRequestData),
        response_mode: 'blocking',
        conversation_id: '',
        user: 'recipe-system-test',
      };

      const response = await fetch(`${apiEndpoint.trim()}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify(difyRequest),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.answer) {
          alert('✅ 接続テスト成功！Difyチャットボットと正常に通信できます。');
        } else {
          alert('⚠️ 接続は成功しましたが、応答形式が想定と異なります。');
        }
      } else {
        const errorText = await response.text();
        console.error('Test connection error:', errorText);
        alert(`❌ 接続テスト失敗: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      alert(`❌ 接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Bot size={28} className="text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800">Difyチャットボット設定</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={24} />
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">🤖 Difyチャットボット連携について</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• DifyでAIチャットボットを作成し、APIエンドポイントを取得</li>
              <li>• チャットボットがメニュー生成の知識を持つように学習</li>
              <li>• 設定後、より高度なメニュー提案が可能になります</li>
              <li>• 設定しない場合は、ローカル生成が使用されます</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Globe size={16} className="mr-2 text-blue-500" />
                APIエンドポイント
              </label>
              <input
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.dify.ai/v1/chat-messages"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                DifyのAPIエンドポイントURLを入力してください
              </p>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Key size={16} className="mr-2 text-green-500" />
                APIキー
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="app-xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                DifyアプリのAPIキーを入力してください
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ セキュリティについて</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• APIキーは安全に保管されます（ローカルストレージ）</li>
                <li>• 第三者と共有しないでください</li>
                <li>• 不要になった場合は設定をクリアしてください</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleTestConnection}
                className="flex-1 px-4 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Bot size={16} />
                <span>接続テスト</span>
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 ${
                  isSaved
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check size={16} />
                    <span>保存完了</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>保存</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">📝 Dify設定手順</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Difyでチャットボットアプリを作成</li>
              <li>システムプロンプトに料理生成の指示を設定</li>
              <li>APIキーを取得してここに入力</li>
              <li>接続テストで動作確認</li>
              <li>保存してメニュー生成を試す</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DifyConfigModal;