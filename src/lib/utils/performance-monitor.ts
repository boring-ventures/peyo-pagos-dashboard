interface RequestLog {
  timestamp: number;
  source: "middleware" | "auth-provider" | "use-current-user" | "use-auth" | "api";
  userId?: string;
  success: boolean;
  responseTime?: number;
}

interface PerformanceMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  averageResponseTime: number;
  requestsPerHour: number;
  uptime: number;
  lastUpdate: number;
  requestsBySource: Record<RequestLog["source"], number>;
}

class PerformanceMonitor {
  private requestLogs: RequestLog[] = [];
  private startTime: number = Date.now();
  private maxLogSize = 1000; // Mantener solo los últimos 1000 logs

  logRequest(
    source: RequestLog["source"],
    userId?: string,
    success = true,
    responseTime?: number
  ) {
    const log: RequestLog = {
      timestamp: Date.now(),
      source,
      userId,
      success,
      responseTime,
    };

    this.requestLogs.push(log);

    // Mantener el tamaño del log manejable
    if (this.requestLogs.length > this.maxLogSize) {
      this.requestLogs = this.requestLogs.slice(-this.maxLogSize);
    }

    // Log en desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[PERF] ${source.toUpperCase()}: ${success ? "✅" : "❌"} ${
          responseTime ? `(${responseTime}ms)` : ""
        }`
      );
    }
  }

  getMetrics(): PerformanceMetrics {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentLogs = this.requestLogs.filter(
      (log) => now - log.timestamp < oneHour
    );

    const totalRequests = this.requestLogs.length;
    // Calculate successful requests for potential future use
    // const successfulRequests = this.requestLogs.filter((log) => log.success);
    const responseTimes = this.requestLogs
      .filter((log) => log.responseTime)
      .map((log) => log.responseTime!);

    const requestsBySource = this.requestLogs.reduce(
      (acc, log) => {
        acc[log.source] = (acc[log.source] || 0) + 1;
        return acc;
      },
      {} as Record<RequestLog["source"], number>
    );

    // Intentar obtener estadísticas de cache si está disponible
    let cacheHits = 0;
    let cacheMisses = 0;
    let hitRatio = 0;

    try {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getUserStoreSnapshot, isStoreAvailable } = require("@/store/userStore");
        if (isStoreAvailable()) {
          const stats = getUserStoreSnapshot().getCacheStats();
          cacheHits = stats.hits;
          cacheMisses = stats.misses;
          hitRatio = stats.hitRatio;
        }
      }
    } catch {
      // Cache stats not available
    }

    return {
      totalRequests,
      cacheHits,
      cacheMisses,
      hitRatio,
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
      requestsPerHour: recentLogs.length,
      uptime: now - this.startTime,
      lastUpdate: now,
      requestsBySource,
    };
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const uptimeHours = Math.round(metrics.uptime / (1000 * 60 * 60) * 100) / 100;

    return `
🚀 PERFORMANCE REPORT - Peyo CRM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 CACHE PERFORMANCE:
   • Hit Ratio: ${metrics.hitRatio}% (Target: >85%)
   • Cache Hits: ${metrics.cacheHits}
   • Cache Misses: ${metrics.cacheMisses}

⚡ REQUEST METRICS:
   • Requests/Hour: ${metrics.requestsPerHour} (Previous: 17,000+)
   • Avg Response: ${Math.round(metrics.averageResponseTime)}ms
   • Total Requests: ${metrics.totalRequests}
   • Uptime: ${uptimeHours}h

📈 REQUESTS BY SOURCE:
${Object.entries(metrics.requestsBySource)
  .map(([source, count]) => `   • ${source}: ${count}`)
  .join('\n')}

${this.validateOptimizations().isOptimized ? '✅ OPTIMIZATION: SUCCESS' : '⚠️ OPTIMIZATION: NEEDS ATTENTION'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
  }

  validateOptimizations(): { isOptimized: boolean; issues: string[] } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    
    if (metrics.hitRatio < 80) {
      issues.push(`Cache hit ratio too low: ${metrics.hitRatio}% (should be >80%)`);
    }
    
    if (metrics.requestsPerHour > 3000) {
      issues.push(`Too many requests per hour: ${metrics.requestsPerHour} (should be <3,000)`);
    }
    
    if (metrics.averageResponseTime > 500) {
      issues.push(`Average response time too high: ${metrics.averageResponseTime}ms (should be <500ms)`);
    }

    return {
      isOptimized: issues.length === 0,
      issues,
    };
  }

  reset() {
    this.requestLogs = [];
    this.startTime = Date.now();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook para usar en componentes
export function usePerformanceMonitor() {
  return {
    logRequest: performanceMonitor.logRequest.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    reset: performanceMonitor.reset.bind(performanceMonitor),
    validateOptimizations: performanceMonitor.validateOptimizations.bind(performanceMonitor),
  };
}

// Función para log automático en desarrollo
export function logPerformanceReport() {
  if (process.env.NODE_ENV === "development") {
    console.log(performanceMonitor.generateReport());
  }
}

// Auto-generar reporte cada 5 minutos en desarrollo
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  setInterval(() => {
    logPerformanceReport();
  }, 5 * 60 * 1000);
} 