// API 使用控制和成本管理服务
interface APIUsageStats {
  dailyOpenAICalls: number;
  dailyPexelsCalls: number;
  monthlyOpenAICalls: number;
  monthlyPexelsCalls: number;
  lastResetDate: string;
  lastMonthlyReset: string;
  estimatedCost: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // 毫秒
}

// 成本控制配置
export const COST_CONTROL_CONFIG = {
  // OpenRouter AI 限制
  DAILY_OPENAI_LIMIT: 200,        // 每日最大调用次数
  MONTHLY_OPENAI_LIMIT: 3000,     // 每月最大调用次数
  MONTHLY_BUDGET_LIMIT: 20,       // 月度预算限制（美元）
  OPENAI_COST_PER_CALL: 0.002,    // OpenRouter预估每次调用成本（通常比直接调用便宜）
  
  // Pexels 限制（免费但也要控制）
  DAILY_PEXELS_LIMIT: 500,        // 每日最大调用次数
  MONTHLY_PEXELS_LIMIT: 10000,    // 每月最大调用次数
  
  // 缓存配置
  CACHE_EXPIRE_TIME: 24 * 60 * 60 * 1000, // 24小时缓存
  MAX_CACHE_SIZE: 1000,           // 最大缓存条目数
};

class APIUsageController {
  private usageStats: APIUsageStats;
  private openaiCache = new Map<string, CacheItem<unknown>>();
  private pexelsCache = new Map<string, CacheItem<string>>();
  
  constructor() {
    this.usageStats = this.loadUsageStats();
    this.checkAndResetDaily();
    this.checkAndResetMonthly();
  }

  // 加载使用统计
  private loadUsageStats(): APIUsageStats {
    const stored = localStorage.getItem('api_usage_stats');
    if (stored) {
      return JSON.parse(stored);
    }
    
    return {
      dailyOpenAICalls: 0,
      dailyPexelsCalls: 0,
      monthlyOpenAICalls: 0,
      monthlyPexelsCalls: 0,
      lastResetDate: new Date().toDateString(),
      lastMonthlyReset: new Date().toISOString().slice(0, 7), // YYYY-MM
      estimatedCost: 0
    };
  }

  // 保存使用统计
  private saveUsageStats(): void {
    localStorage.setItem('api_usage_stats', JSON.stringify(this.usageStats));
  }

  // 检查并重置每日统计
  private checkAndResetDaily(): void {
    const today = new Date().toDateString();
    if (this.usageStats.lastResetDate !== today) {
      this.usageStats.dailyOpenAICalls = 0;
      this.usageStats.dailyPexelsCalls = 0;
      this.usageStats.lastResetDate = today;
      this.saveUsageStats();
      console.log('🔄 每日API使用统计已重置');
    }
  }

  // 检查并重置每月统计
  private checkAndResetMonthly(): void {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (this.usageStats.lastMonthlyReset !== currentMonth) {
      this.usageStats.monthlyOpenAICalls = 0;
      this.usageStats.monthlyPexelsCalls = 0;
      this.usageStats.estimatedCost = 0;
      this.usageStats.lastMonthlyReset = currentMonth;
      this.saveUsageStats();
      console.log('🔄 每月API使用统计已重置');
    }
  }

  // 检查OpenRouter调用是否超限
  canCallOpenAI(): { allowed: boolean; reason?: string } {
    this.checkAndResetDaily();
    this.checkAndResetMonthly();

    if (this.usageStats.dailyOpenAICalls >= COST_CONTROL_CONFIG.DAILY_OPENAI_LIMIT) {
      return { allowed: false, reason: `已达到每日OpenRouter调用限制 (${COST_CONTROL_CONFIG.DAILY_OPENAI_LIMIT})` };
    }

    if (this.usageStats.monthlyOpenAICalls >= COST_CONTROL_CONFIG.MONTHLY_OPENAI_LIMIT) {
      return { allowed: false, reason: `已达到每月OpenRouter调用限制 (${COST_CONTROL_CONFIG.MONTHLY_OPENAI_LIMIT})` };
    }

    if (this.usageStats.estimatedCost >= COST_CONTROL_CONFIG.MONTHLY_BUDGET_LIMIT) {
      return { allowed: false, reason: `已达到月度预算限制 ($${COST_CONTROL_CONFIG.MONTHLY_BUDGET_LIMIT})` };
    }

    return { allowed: true };
  }

  // 检查Pexels调用是否超限
  canCallPexels(): { allowed: boolean; reason?: string } {
    this.checkAndResetDaily();
    this.checkAndResetMonthly();

    if (this.usageStats.dailyPexelsCalls >= COST_CONTROL_CONFIG.DAILY_PEXELS_LIMIT) {
      return { allowed: false, reason: `已达到每日Pexels调用限制 (${COST_CONTROL_CONFIG.DAILY_PEXELS_LIMIT})` };
    }

    if (this.usageStats.monthlyPexelsCalls >= COST_CONTROL_CONFIG.MONTHLY_PEXELS_LIMIT) {
      return { allowed: false, reason: `已达到每月Pexels调用限制 (${COST_CONTROL_CONFIG.MONTHLY_PEXELS_LIMIT})` };
    }

    return { allowed: true };
  }

  // 记录OpenRouter调用
  recordOpenAICall(): void {
    this.usageStats.dailyOpenAICalls++;
    this.usageStats.monthlyOpenAICalls++;
    this.usageStats.estimatedCost += COST_CONTROL_CONFIG.OPENAI_COST_PER_CALL;
    this.saveUsageStats();
  }

  // 记录Pexels调用
  recordPexelsCall(): void {
    this.usageStats.dailyPexelsCalls++;
    this.usageStats.monthlyPexelsCalls++;
    this.saveUsageStats();
  }

  // 缓存管理 - 清理过期缓存
  private cleanExpiredCache<T>(cache: Map<string, CacheItem<T>>): void {
    const now = Date.now();
    for (const [key, item] of cache.entries()) {
      if (now - item.timestamp > item.expiresIn) {
        cache.delete(key);
      }
    }
  }

  // 限制缓存大小
  private limitCacheSize<T>(cache: Map<string, CacheItem<T>>): void {
    if (cache.size > COST_CONTROL_CONFIG.MAX_CACHE_SIZE) {
      // 删除最旧的条目
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, cache.size - COST_CONTROL_CONFIG.MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => cache.delete(key));
    }
  }

  // OpenRouter缓存操作
  getCachedOpenAI<T>(key: string): T | null {
    this.cleanExpiredCache(this.openaiCache);
    const item = this.openaiCache.get(key);
    if (item && Date.now() - item.timestamp < item.expiresIn) {
      return item.data as T;
    }
    return null;
  }

  setCachedOpenAI<T>(key: string, data: T): void {
    this.openaiCache.set(key, {
      data: data as unknown,
      timestamp: Date.now(),
      expiresIn: COST_CONTROL_CONFIG.CACHE_EXPIRE_TIME
    });
    this.limitCacheSize(this.openaiCache);
  }

  // Pexels缓存操作
  getCachedPexels(key: string): string | null {
    this.cleanExpiredCache(this.pexelsCache);
    const item = this.pexelsCache.get(key);
    if (item && Date.now() - item.timestamp < item.expiresIn) {
      return item.data;
    }
    return null;
  }

  setCachedPexels(key: string, data: string): void {
    this.pexelsCache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: COST_CONTROL_CONFIG.CACHE_EXPIRE_TIME
    });
    this.limitCacheSize(this.pexelsCache);
  }

  // 获取使用统计
  getUsageStats(): APIUsageStats & {
    dailyOpenAIRemaining: number;
    monthlyOpenAIRemaining: number;
    budgetRemaining: number;
    dailyPexelsRemaining: number;
    monthlyPexelsRemaining: number;
  } {
    return {
      ...this.usageStats,
      dailyOpenAIRemaining: Math.max(0, COST_CONTROL_CONFIG.DAILY_OPENAI_LIMIT - this.usageStats.dailyOpenAICalls),
      monthlyOpenAIRemaining: Math.max(0, COST_CONTROL_CONFIG.MONTHLY_OPENAI_LIMIT - this.usageStats.monthlyOpenAICalls),
      budgetRemaining: Math.max(0, COST_CONTROL_CONFIG.MONTHLY_BUDGET_LIMIT - this.usageStats.estimatedCost),
      dailyPexelsRemaining: Math.max(0, COST_CONTROL_CONFIG.DAILY_PEXELS_LIMIT - this.usageStats.dailyPexelsCalls),
      monthlyPexelsRemaining: Math.max(0, COST_CONTROL_CONFIG.MONTHLY_PEXELS_LIMIT - this.usageStats.monthlyPexelsCalls),
    };
  }

  // 重置统计（调试用）
  resetStats(): void {
    this.usageStats = {
      dailyOpenAICalls: 0,
      dailyPexelsCalls: 0,
      monthlyOpenAICalls: 0,
      monthlyPexelsCalls: 0,
      lastResetDate: new Date().toDateString(),
      lastMonthlyReset: new Date().toISOString().slice(0, 7),
      estimatedCost: 0
    };
    this.saveUsageStats();
    console.log('🔄 API使用统计已手动重置');
  }

  // 清空缓存
  clearCache(): void {
    this.openaiCache.clear();
    this.pexelsCache.clear();
    console.log('🗑️ API缓存已清空');
  }
}

// 导出单例实例
export const apiUsageController = new APIUsageController(); 