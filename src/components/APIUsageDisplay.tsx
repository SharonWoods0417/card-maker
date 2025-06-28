// ========================================
// 🔧 API使用统计展示组件
// ========================================
// 此组件用于监控和管理API调用使用情况
// 包含调试控制按钮，可以清空缓存和重置统计
// ⚠️ 调试控制按钮仅在调试模式下显示
// ========================================

import React, { useState, useEffect } from 'react';
import { apiUsageController, COST_CONTROL_CONFIG } from '../services/apiUsageControl';
import { getCurrentModel, checkOpenRouterConfig } from '../api/openai';

interface APIUsageDisplayProps {
  className?: string;
  showControls?: boolean; // 是否显示控制按钮
}

const APIUsageDisplay: React.FC<APIUsageDisplayProps> = ({ 
  className = '',
  showControls = false 
}) => {
  const [stats, setStats] = useState(apiUsageController.getUsageStats());
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [configStatus, setConfigStatus] = useState<{ valid: boolean; message: string }>({ valid: true, message: '' });

  // 定期更新统计数据
  useEffect(() => {
    // 初始化模型信息
    setCurrentModel(getCurrentModel());
    setConfigStatus(checkOpenRouterConfig());
    
    const interval = setInterval(() => {
      setStats(apiUsageController.getUsageStats());
      setCurrentModel(getCurrentModel());
      setConfigStatus(checkOpenRouterConfig());
    }, 5000); // 每5秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 计算使用率
  const openaiDailyUsage = (stats.dailyOpenAICalls / COST_CONTROL_CONFIG.DAILY_OPENAI_LIMIT) * 100;
  const openaiMonthlyUsage = (stats.monthlyOpenAICalls / COST_CONTROL_CONFIG.MONTHLY_OPENAI_LIMIT) * 100;
  const budgetUsage = (stats.estimatedCost / COST_CONTROL_CONFIG.MONTHLY_BUDGET_LIMIT) * 100;
  const pexelsDailyUsage = (stats.dailyPexelsCalls / COST_CONTROL_CONFIG.DAILY_PEXELS_LIMIT) * 100;

  // 获取状态颜色
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500 bg-red-50';
    if (percentage >= 70) return 'text-orange-500 bg-orange-50';
    if (percentage >= 50) return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  // 格式化货币
  const formatCurrency = (amount: number) => `$${amount.toFixed(3)}`;

  // ========================================
  // 🔧 调试控制按钮处理函数
  // ========================================
  // ⚠️ 这些函数仅在调试模式下使用
  
  // 清空缓存处理函数
  const handleClearCache = () => {
    apiUsageController.clearCache();
    setStats(apiUsageController.getUsageStats());
    console.log('🔧 缓存已清空');
  };

  // 重置统计处理函数
  const handleResetStats = () => {
    if (confirm('确定要重置所有统计数据吗？这将清除今日和本月的API调用记录。')) {
      apiUsageController.resetStats();
      setStats(apiUsageController.getUsageStats());
      console.log('🔧 统计数据已重置');
    }
  };
  // ========================================
  // 🔧 调试控制按钮处理函数结束
  // ========================================

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* 头部 - 简要状态 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium text-gray-700">API使用状况</div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(Math.max(openaiDailyUsage, budgetUsage))}`}>
            今日: {stats.dailyOpenAICalls}次 | 本月: {formatCurrency(stats.estimatedCost)}
          </div>
        </div>
        <div className="text-gray-400">
          {isExpanded ? '🔽' : '▶️'}
        </div>
      </div>

      {/* 详细统计 */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* OpenRouter 统计 */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800 flex items-center">
              🤖 OpenRouter API
              {currentModel && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  {currentModel}
                </span>
              )}
              {!configStatus.valid && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  配置异常
                </span>
              )}
              {stats.dailyOpenAIRemaining === 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  已达限制
                </span>
              )}
            </h4>
            
            {/* 今日使用 */}
            <div className="flex items-center justify-between text-sm">
              <span>今日调用</span>
              <span className="font-mono">
                {stats.dailyOpenAICalls} / {COST_CONTROL_CONFIG.DAILY_OPENAI_LIMIT}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  openaiDailyUsage >= 90 ? 'bg-red-500' : 
                  openaiDailyUsage >= 70 ? 'bg-orange-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(openaiDailyUsage, 100)}%` }}
              />
            </div>

            {/* 本月使用 */}
            <div className="flex items-center justify-between text-sm">
              <span>本月调用</span>
              <span className="font-mono">
                {stats.monthlyOpenAICalls} / {COST_CONTROL_CONFIG.MONTHLY_OPENAI_LIMIT}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  openaiMonthlyUsage >= 90 ? 'bg-red-500' : 
                  openaiMonthlyUsage >= 70 ? 'bg-orange-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(openaiMonthlyUsage, 100)}%` }}
              />
            </div>

            {/* 预算使用 */}
            <div className="flex items-center justify-between text-sm">
              <span>预算使用</span>
              <span className="font-mono">
                {formatCurrency(stats.estimatedCost)} / ${COST_CONTROL_CONFIG.MONTHLY_BUDGET_LIMIT}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetUsage >= 90 ? 'bg-red-500' : 
                  budgetUsage >= 70 ? 'bg-orange-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
              />
            </div>
          </div>

          {/* Pexels 统计 */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800 flex items-center">
              📸 Pexels API
              {stats.dailyPexelsRemaining === 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  已达限制
                </span>
              )}
            </h4>
            
            <div className="flex items-center justify-between text-sm">
              <span>今日调用</span>
              <span className="font-mono">
                {stats.dailyPexelsCalls} / {COST_CONTROL_CONFIG.DAILY_PEXELS_LIMIT}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  pexelsDailyUsage >= 90 ? 'bg-red-500' : 
                  pexelsDailyUsage >= 70 ? 'bg-orange-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(pexelsDailyUsage, 100)}%` }}
              />
            </div>
          </div>

          {/* ======================================== */}
          {/* 🔧 调试控制按钮区域 */}
          {/* ⚠️ 只在调试模式下显示，请勿删除条件判断 */}
          {/* ======================================== */}
          {showControls && (
            <div className="flex space-x-2 pt-2 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500 mr-2">
                🔧 调试控制:
              </div>
              
              {/* 清空缓存按钮 */}
              <button
                onClick={handleClearCache}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="清空API调用缓存，下次调用相同单词时会重新请求API"
              >
                清空缓存
              </button>
              
              {/* 重置统计按钮 */}
              <button
                onClick={handleResetStats}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="重置所有API调用统计数据，包括今日和本月的计数"
              >
                重置统计
              </button>
            </div>
          )}
          {/* ======================================== */}
          {/* 🔧 调试控制按钮区域结束 */}
          {/* ======================================== */}

          {/* 提示信息 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            💡 缓存24小时有效，重复调用相同单词不消耗配额
            {currentModel && (
              <span className="block mt-1 text-green-600">
                🤖 当前使用模型: {currentModel}
              </span>
            )}
            {!configStatus.valid && (
              <span className="block mt-1 text-red-600">
                ⚠️ {configStatus.message}
              </span>
            )}
            {showControls && (
              <span className="block mt-1 text-blue-600">
                🔧 当前为调试模式，可使用上方控制按钮管理缓存和统计
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIUsageDisplay; 