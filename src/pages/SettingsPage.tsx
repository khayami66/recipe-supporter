import React, { useState, useEffect } from 'react';
import { Users, Sparkles, Save, Check, Plus, Trash2, User, Heart, Zap, Star } from 'lucide-react';
import { UserSettings, FamilyMemberDetail } from '../types';

interface SettingsPageProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdateSettings }) => {
  const [familyCount, setFamilyCount] = useState<number>(settings.familyCount || 2);
  const [preferences, setPreferences] = useState<string>(settings.preferences || '');
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberDetail[]>(() => {
    // 既存の設定から読み込む（データベースから読み込まれたデータ）
    if (settings.familyMembers && settings.familyMembers.length > 0) {
      return settings.familyMembers.map(member => ({
        ...member,
        birthDate: member.birthDate ? new Date(member.birthDate) : new Date('')
      }));
    }
    // デフォルトの家族構成を生成
    const count = settings.familyCount || 2;
    if (count > 0) {
      return Array.from({ length: count }, (_, i) => ({
        id: crypto.randomUUID(),
        birthDate: new Date(''),
        gender: 'male' as const,
        appetiteLevel: 3,
        name: `家族${i + 1}`,
      }));
    }
    return [];
  });
  const [healthMode, setHealthMode] = useState<'normal' | 'diet' | 'workout'>(settings.healthMode || 'normal');
  const [recipeFrequency, setRecipeFrequency] = useState(settings.recipeFrequency || {
    S: 2,
    A: 3,
    B: 7,
    C: 30,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setPreferences(settings.preferences || '');
    // familyMembersがpropsで渡されてきた場合のみ更新
    if (settings.familyMembers && settings.familyMembers.length > 0) {
      setFamilyMembers(settings.familyMembers.map(member => ({
        ...member,
        birthDate: member.birthDate ? new Date(member.birthDate) : new Date('')
      })));
    }
    setHealthMode(settings.healthMode || 'normal');
    setRecipeFrequency(settings.recipeFrequency || {
      S: 2,
      A: 3,
      B: 7,
      C: 30,
    });
    // 家族人数を家族構成の実際の人数に同期
    if (settings.familyMembers && settings.familyMembers.length > 0) {
      setFamilyCount(settings.familyMembers.length);
    }
  }, [settings]);

  // 家族構成が変更されたときに家族人数を同期
  useEffect(() => {
    setFamilyCount(familyMembers.length);
  }, [familyMembers]);

  const updateFamilyMember = (index: number, updates: Partial<FamilyMemberDetail>) => {
    const updatedMembers = [...familyMembers];
    updatedMembers[index] = { ...updatedMembers[index], ...updates };
    setFamilyMembers(updatedMembers);
  };

  const addFamilyMember = () => {
    const newMember: FamilyMemberDetail = {
      id: crypto.randomUUID(),
      birthDate: new Date(''),
      gender: 'male',
      appetiteLevel: 3,
      name: `家族${familyMembers.length + 1}`,
    };
    setFamilyMembers([...familyMembers, newMember]);
  };

  const removeFamilyMember = (index: number) => {
    const updatedMembers = familyMembers.filter((_, i) => i !== index);
    setFamilyMembers(updatedMembers);
  };

  const getAge = (birthDate: Date) => {
    if (!birthDate || isNaN(birthDate.getTime())) {
      return '';
    }
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getAppetiteLevelText = (level: number) => {
    const levels = ['とても少ない', '少ない', '普通', '多い', 'とても多い'];
    return levels[level - 1] || '普通';
  };

  const handleSave = () => {
    const updatedSettings: UserSettings = {
      familyCount,
      preferences,
      familyMembers: familyMembers.map(member => ({
        ...member,
        birthDate: member.birthDate instanceof Date && !isNaN(member.birthDate.getTime()) 
          ? member.birthDate 
          : new Date('')
      })),
      healthMode,
      recipeFrequency,
      lastUpdated: new Date(),
    };
    onUpdateSettings(updatedSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const hasChanges = 
    preferences !== settings.preferences ||
    JSON.stringify(familyMembers) !== JSON.stringify(settings.familyMembers || []) ||
    healthMode !== (settings.healthMode || 'normal') ||
    JSON.stringify(recipeFrequency) !== JSON.stringify(settings.recipeFrequency || {
      S: 2,
      A: 3,
      B: 7,
      C: 30,
    });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">基本設定</h1>
          <p className="text-sm text-gray-600 mt-1">
            家族構成と好みを設定してください
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-8">
          {/* 家族構成の詳細設定 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center text-lg font-semibold text-gray-800">
                <User size={24} className="mr-3 text-blue-500" />
                家族構成（{familyMembers.length}人）
              </label>
            </div>
            <div className="space-y-4">
              {familyMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">家族構成が設定されていません</p>
                  <button
                    onClick={addFamilyMember}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 mx-auto"
                  >
                    <Plus size={16} />
                    <span>家族を追加</span>
                  </button>
                </div>
              )}
              {familyMembers.map((member, index) => (
                <div key={member.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">
                      {member.name || `家族${index + 1}`}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => removeFamilyMember(index)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* 生年月日と年齢の表示 */}
                  {(member.birthDate && !isNaN(member.birthDate.getTime())) && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-800">
                          生年月日: {member.birthDate.toLocaleDateString('ja-JP')}
                        </span>
                        <span className="text-sm font-semibold text-blue-600">
                          {getAge(member.birthDate)}歳
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        名前（任意）
                      </label>
                      <input
                        type="text"
                        value={member.name || ''}
                        onChange={(e) => updateFamilyMember(index, { name: e.target.value })}
                        placeholder={`家族${index + 1}`}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        生年月日
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={member.birthDate && !isNaN(member.birthDate.getTime()) ? member.birthDate.getFullYear() : ''}
                          onChange={(e) => {
                            const year = parseInt(e.target.value);
                            const currentDate = member.birthDate && !isNaN(member.birthDate.getTime()) ? member.birthDate : new Date();
                            const newDate = new Date(year, currentDate.getMonth(), currentDate.getDate());
                            updateFamilyMember(index, { birthDate: newDate });
                          }}
                          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        >
                          <option value="">年</option>
                          {Array.from({ length: 100 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <option key={year} value={year}>
                                {year}年
                              </option>
                            );
                          })}
                        </select>
                        
                        <select
                          value={member.birthDate && !isNaN(member.birthDate.getTime()) ? member.birthDate.getMonth() + 1 : ''}
                          onChange={(e) => {
                            const month = parseInt(e.target.value) - 1;
                            const currentDate = member.birthDate && !isNaN(member.birthDate.getTime()) ? member.birthDate : new Date();
                            const newDate = new Date(currentDate.getFullYear(), month, currentDate.getDate());
                            updateFamilyMember(index, { birthDate: newDate });
                          }}
                          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        >
                          <option value="">月</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}月
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={member.birthDate && !isNaN(member.birthDate.getTime()) ? member.birthDate.getDate() : ''}
                          onChange={(e) => {
                            const day = parseInt(e.target.value);
                            const currentDate = member.birthDate && !isNaN(member.birthDate.getTime()) ? member.birthDate : new Date();
                            const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            updateFamilyMember(index, { birthDate: newDate });
                          }}
                          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        >
                          <option value="">日</option>
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}日
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        性別
                      </label>
                      <select
                        value={member.gender}
                        onChange={(e) => updateFamilyMember(index, { gender: e.target.value as 'male' | 'female' })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                      >
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        食べる量
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={member.appetiteLevel}
                          onChange={(e) => updateFamilyMember(index, { appetiteLevel: parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                          {getAppetiteLevelText(member.appetiteLevel)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* 追加ボタン */}
              {familyMembers.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={addFamilyMember}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    <Plus size={16} />
                    <span>家族を追加</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              家族構成の詳細情報により、より適切な分量でメニューが提案されます
            </p>
          </div>

          {/* ヘルスモードの設定 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <Heart size={24} className="mr-3 text-pink-500" />
              ヘルスモード
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setHealthMode('normal')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  healthMode === 'normal'
                    ? 'border-gray-500 bg-gray-100 text-gray-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Users size={24} className={healthMode === 'normal' ? 'text-gray-600' : 'text-gray-400'} />
                </div>
                <h4 className="font-semibold mb-1">通常モード</h4>
                <p className="text-sm">バランスの良い食事</p>
              </button>
              
              <button
                type="button"
                onClick={() => setHealthMode('diet')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  healthMode === 'diet'
                    ? 'border-green-500 bg-green-100 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Heart size={24} className={healthMode === 'diet' ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <h4 className="font-semibold mb-1">ダイエットモード</h4>
                <p className="text-sm">低カロリー・ヘルシー</p>
              </button>
              
              <button
                type="button"
                onClick={() => setHealthMode('workout')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  healthMode === 'workout'
                    ? 'border-orange-500 bg-orange-100 text-orange-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Zap size={24} className={healthMode === 'workout' ? 'text-orange-600' : 'text-gray-400'} />
                </div>
                <h4 className="font-semibold mb-1">筋トレモード</h4>
                <p className="text-sm">高タンパク・筋肉増強</p>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              選択したモードに応じて、適切な栄養バランスのメニューが提案されます
            </p>
          </div>

          {/* 料理評価頻度の設定 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <Star size={24} className="mr-3 text-yellow-500" />
              料理評価別出現頻度
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700 mb-3">
                過去の評価に基づいて、各評価レベルの料理を何日に1回のペースで献立に含めるかを設定できます。
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    S
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    S級料理
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={recipeFrequency.S}
                      onChange={(e) => setRecipeFrequency({
                        ...recipeFrequency,
                        S: parseInt(e.target.value) || 1
                      })}
                      className="w-16 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-center"
                    />
                    <span className="text-sm text-gray-600">日に1回</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    A
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    A級料理
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={recipeFrequency.A}
                      onChange={(e) => setRecipeFrequency({
                        ...recipeFrequency,
                        A: parseInt(e.target.value) || 1
                      })}
                      className="w-16 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-center"
                    />
                    <span className="text-sm text-gray-600">日に1回</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    B
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    B級料理
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={recipeFrequency.B}
                      onChange={(e) => setRecipeFrequency({
                        ...recipeFrequency,
                        B: parseInt(e.target.value) || 1
                      })}
                      className="w-16 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 text-center"
                    />
                    <span className="text-sm text-gray-600">日に1回</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    C
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    C級料理
                  </label>
                  <div className="text-sm text-gray-600 mt-2">
                    献立に含まれません
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 設定のコツ</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>S級</strong>: 家族に大好評だった料理（頻繁に出したい）</li>
                <li>• <strong>A級</strong>: 満足度の高い料理（定期的に出したい）</li>
                <li>• <strong>B級</strong>: 普通の料理（たまに出してもよい）</li>
                <li>• <strong>C級</strong>: 改善が必要な料理（今後の献立に含まれません）</li>
              </ul>
            </div>
          </div>

          {/* 好みの設定 */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-800 mb-4">
              <Sparkles size={24} className="mr-3 text-green-500" />
              好みの設定
            </label>
            <textarea
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="例：辛い料理が好き、野菜多め、魚料理中心、アレルギー情報など..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 resize-none text-gray-700"
              rows={6}
            />
            <p className="text-sm text-gray-500 mt-3">
              ここで設定した好みに基づいてメニューが提案されます
            </p>
          </div>

          {/* 保存ボタン */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center space-x-3 ${
                isSaved
                  ? 'bg-green-500 text-white'
                  : hasChanges
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSaved ? (
                <>
                  <Check size={24} />
                  <span>保存しました</span>
                </>
              ) : (
                <>
                  <Save size={24} />
                  <span>{hasChanges ? '設定を保存' : '変更がありません'}</span>
                </>
              )}
            </button>
          </div>

          {/* 最終更新日時 */}
          {settings.lastUpdated && (
            <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
              最終更新：{settings.lastUpdated.toLocaleString('ja-JP')}
            </div>
          )}
        </div>

        {/* 設定のヒント */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 設定のコツ</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 家族の人数は正確に設定すると、適切な分量でメニューが提案されます</li>
            <li>• 好みには具体的な情報を入力すると、より適したメニューが生成されます</li>
            <li>• アレルギー情報も忘れずに記載してください</li>
            <li>• 設定はいつでも変更できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;