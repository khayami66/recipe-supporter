import { useState, useEffect } from 'react';

interface DifyConfig {
  apiEndpoint: string;
  apiKey: string;
}

const STORAGE_KEY = 'dify-chatbot-config';

export const useDifyConfig = () => {
  const [config, setConfig] = useState<DifyConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // 設定を読み込み（環境変数優先、次にローカルストレージ）
  useEffect(() => {
    try {
      // 環境変数から設定を読み込み
      const envEndpoint = import.meta.env.VITE_DIFY_API_ENDPOINT;
      const envApiKey = import.meta.env.VITE_DIFY_API_KEY;
      
      if (envEndpoint && envApiKey) {
        // 環境変数が設定されている場合は優先
        console.log('[Dify設定] 環境変数から読み込み:', { 
          endpoint: envEndpoint, 
          hasKey: !!envApiKey 
        });
        setConfig({
          apiEndpoint: envEndpoint,
          apiKey: envApiKey,
        });
      } else {
        // 環境変数がない場合はローカルストレージから読み込み
        const savedConfig = localStorage.getItem(STORAGE_KEY);
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          console.log('[Dify設定] localStorageから読み込み');
          setConfig(parsedConfig);
        } else {
          console.log('[Dify設定] 未設定');
        }
      }
    } catch (error) {
      console.error('Error loading Dify config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 設定を保存
  const saveConfig = (newConfig: DifyConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.error('Error saving Dify config:', error);
      throw error;
    }
  };

  // 設定をクリア
  const clearConfig = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setConfig(null);
    } catch (error) {
      console.error('Error clearing Dify config:', error);
    }
  };

  return {
    config,
    loading,
    saveConfig,
    clearConfig,
    hasConfig: !!config?.apiEndpoint && !!config?.apiKey,
    isFromEnv: !!(import.meta.env.VITE_DIFY_API_ENDPOINT && import.meta.env.VITE_DIFY_API_KEY),
  };
};