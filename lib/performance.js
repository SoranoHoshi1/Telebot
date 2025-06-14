export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  addMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metric = this.metrics.get(name);
    metric.push({
      value,
      timestamp: Date.now()
    });

    // Keep only last 100 metrics
    if (metric.length > 100) {
      metric.shift();
    }
  }

  getMetric(name) {
    return this.metrics.get(name) || [];
  }

  getAverageMetric(name) {
    const metric = this.getMetric(name);
    if (metric.length === 0) return 0;

    const sum = metric.reduce((acc, m) => acc + m.value, 0);
    return sum / metric.length;
  }

  getStats() {
    const apiResponseTime = this.getAverageMetric('api_call');
    const commandExecutionTime = this.getAverageMetric('command_execution');

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      avgResponseTime: Math.round(apiResponseTime * 100) / 100,
      avgCommandTime: Math.round(commandExecutionTime * 100) / 100,
      errorCount: this.errorCount,
      metricsCount: this.metrics.size
    };
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  getErrorCount() {
    return this.errorCount;
  }

  reset() {
    this.metrics.clear();
    this.errorCount = 0;
    this.startTime = Date.now();
  }
}