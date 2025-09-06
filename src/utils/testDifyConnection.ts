// Dify API接続テスト用ユーティリティ
export const testDifyConnection = async (apiEndpoint: string, apiKey: string) => {
  console.log('[Dify接続テスト] 開始');
  
  // 最小限のテストデータ
  const testRequest = {
    inputs: {},
    query: JSON.stringify({
      test: true,
      message: "Connection test"
    }),
    response_mode: 'blocking',
    conversation_id: '',
    user: 'test-user',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒のテストタイムアウト
    
    const response = await fetch(`${apiEndpoint}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(testRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('[Dify接続テスト] レスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dify接続テスト] エラーレスポンス:', errorText.substring(0, 200));
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText.substring(0, 200)
      };
    }
    
    const data = await response.json();
    console.log('[Dify接続テスト] 成功:', {
      hasAnswer: !!data.answer,
      conversationId: data.conversation_id
    });
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('[Dify接続テスト] エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};