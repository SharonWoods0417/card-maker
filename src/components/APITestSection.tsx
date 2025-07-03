import React, { useState } from 'react';
import { getWordDataFromOpenAI, checkOpenRouterConfig, getCurrentModel } from '../api/openai';
import { findInLocalDictionary, loadCustomDictFromStorage } from '../utils/dictionary';
import { OpenAIWordData, APIError } from '../api/types';
import { Zap, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';

const APITestSection: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: OpenAIWordData;
    error?: APIError;
  } | null>(null);

  const [debugWord, setDebugWord] = useState('');
  const [debugResult, setDebugResult] = useState<string>('');

  const handleDebugWord = async () => {
    if (!debugWord.trim()) {
      setDebugResult('请输入要调试的单词');
      return;
    }

    const word = debugWord.trim().toLowerCase();
    setDebugResult('正在检查...');

    try {
      // 1. 检查本地词典
      const localEntry = await findInLocalDictionary(word);
      
      // 2. 检查localStorage中的自定义词典
      const customDict = loadCustomDictFromStorage();
      const customEntry = customDict[word];
      
      const debugInfo = {
        word: word,
        foundInLocal: !!localEntry,
        foundInCustom: !!customEntry,
        localData: localEntry,
        customData: customEntry,
        timestamp: new Date().toISOString()
      };
      
      setDebugResult(JSON.stringify(debugInfo, null, 2));
      console.log('🔍 词典调试信息:', debugInfo);
      
    } catch (error) {
      setDebugResult(`调试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleTestAPI = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // 1. 首先检查配置
      const config = checkOpenRouterConfig();
      if (!config.valid) {
        setTestResult({
          success: false,
          message: config.message
        });
        return;
      }

      // 2. 发送测试请求
      console.log('🧪 开始API测试，使用模型:', getCurrentModel());
      const result = await getWordDataFromOpenAI('test');
      
      if (result.success) {
        setTestResult({
          success: true,
          message: '✅ API连接成功！OpenRouter配置正确。',
          data: result.data
        });
      } else {
        setTestResult({
          success: false,
          message: result.error.message || '❌ API调用失败',
          error: result.error
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: { error: true, message: error instanceof Error ? error.message : '未知错误' }
      });
    } finally {
      setIsTesting(false);
    }
  };

  const config = checkOpenRouterConfig();
  const currentModel = getCurrentModel();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-4">
        <Zap className="h-6 w-6 text-yellow-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">API连接测试</h3>
      </div>

      {/* 配置状态 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">当前配置状态：</h4>
        <div className="space-y-2">
          <div className="flex items-center">
            {config.valid ? (
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mr-2" />
            )}
            <span className="text-sm text-gray-600">
              API Key: {config.valid ? '✓ 已配置' : '✗ 未配置'}
            </span>
          </div>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-blue-500 mr-2" />
            <span className="text-sm text-gray-600">
              使用模型: {currentModel}
            </span>
          </div>
        </div>
      </div>

      {/* 测试按钮 */}
      <button
        onClick={handleTestAPI}
        disabled={isTesting || !config.valid}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
          !config.valid
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : isTesting
            ? 'bg-yellow-500 text-white cursor-wait'
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
      >
        {isTesting ? '🧪 测试中...' : '🧪 测试API连接'}
      </button>

      {/* 测试结果 */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </p>
              
              {testResult.success && testResult.data && (
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>测试数据:</strong></p>
                  <div className="bg-white p-2 rounded border mt-1 font-mono text-xs">
                    <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                  </div>
                </div>
              )}

              {!testResult.success && testResult.error && (
                <div className="mt-2 text-sm text-red-700">
                  <p><strong>错误详情:</strong> {JSON.stringify(testResult.error, null, 2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 配置说明 */}
      {!config.valid && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">🔧 如何配置API Key：</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>在项目根目录创建 <code className="bg-blue-100 px-1 rounded">.env.local</code> 文件</li>
                <li>添加以下内容（将 YOUR_KEY 替换为实际的API Key）：
                  <div className="bg-white p-2 rounded border mt-1 font-mono text-xs">
                    VITE_OPENROUTER_API_KEY=YOUR_KEY
                  </div>
                </li>
                <li>保存文件并刷新页面</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 新增：单词调试功能 */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-blue-600" />
          <h4 className="text-md font-semibold text-blue-800">单词数据调试</h4>
        </div>
        
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={debugWord}
            onChange={(e) => setDebugWord(e.target.value)}
            placeholder="输入要调试的单词 (如: prepare)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleDebugWord()}
          />
          <button
            onClick={handleDebugWord}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            🔍 检查
          </button>
        </div>
        
        {debugResult && (
          <div className="bg-gray-100 p-3 rounded-lg text-xs">
            <strong>调试结果：</strong>
            <pre className="mt-2 text-gray-700 whitespace-pre-wrap">
              {debugResult}
            </pre>
          </div>
        )}
        
        {/* 🔄 AI调用测试 */}
        <div className="mt-4">
          <button
            onClick={async () => {
              if (!debugWord.trim()) {
                setDebugResult('请先输入单词');
                return;
              }
              setDebugResult('正在测试AI调用...');
              try {
                const result = await getWordDataFromOpenAI(debugWord.trim());
                setDebugResult(`AI调用结果：\n${JSON.stringify(result, null, 2)}`);
              } catch (error) {
                setDebugResult(`AI调用异常：\n${error instanceof Error ? error.message : '未知错误'}`);
              }
            }}
            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 mr-2"
          >
            🤖 测试AI调用
          </button>
          
          <button
            onClick={async () => {
              if (!debugWord.trim()) {
                setDebugResult('请先输入单词');
                return;
              }
              setDebugResult('正在强制重新获取数据...');
              try {
                // 先清除缓存中的数据
                const customDict = loadCustomDictFromStorage();
                const word = debugWord.trim().toLowerCase();
                delete customDict[word];
                localStorage.setItem('customDictionary', JSON.stringify(customDict));
                
                // 重新获取数据
                const { getWordEntry } = await import('../utils/dictionary');
                const result = await getWordEntry(debugWord.trim());
                setDebugResult(`重新获取结果：\n${JSON.stringify(result, null, 2)}`);
              } catch (error) {
                setDebugResult(`重新获取失败：\n${error instanceof Error ? error.message : '未知错误'}`);
              }
            }}
            className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
          >
            🔄 重新获取
          </button>
        </div>
      </div>
    </div>
  );
};

export default APITestSection; 