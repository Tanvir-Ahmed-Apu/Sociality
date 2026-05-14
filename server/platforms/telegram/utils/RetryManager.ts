export interface IRetryOperation {
  operationId: string;
  context: any;
  attempts: number;
  lastError: string;
  status: 'retrying' | 'failed';
  timestamp: Date;
  nextRetry?: Date;
}

class RetryManager {
  private retryQueues: Map<string, IRetryOperation>;
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;

  constructor() {
    this.retryQueues = new Map<string, IRetryOperation>();
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 30000; // 30 seconds
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>, 
    operationId: string, 
    context: any = {}
  ): Promise<T> {
    const retryKey = `${operationId}_${Date.now()}`;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Remove from retry queue on success
        this.retryQueues.delete(retryKey);
        
        console.log(`Operation ${operationId} succeeded on attempt ${attempt}`);
        return result;
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Operation ${operationId} failed on attempt ${attempt}:`, errorMessage);
        
        if (attempt === this.maxRetries) {
          // Final failure
          this.retryQueues.set(retryKey, {
            operationId,
            context,
            attempts: attempt,
            lastError: errorMessage,
            status: 'failed',
            timestamp: new Date()
          });
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
        
        // Update retry queue
        this.retryQueues.set(retryKey, {
          operationId,
          context,
          attempts: attempt,
          lastError: errorMessage,
          status: 'retrying',
          nextRetry: new Date(Date.now() + delay),
          timestamp: new Date()
        });
        
        console.log(`Retrying operation ${operationId} in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await this.delay(delay);
      }
    }
    throw new Error('Maximum retries reached');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    const queues = Array.from(this.retryQueues.values());
    return {
      totalOperations: queues.length,
      retrying: queues.filter(q => q.status === 'retrying').length,
      failed: queues.filter(q => q.status === 'failed').length,
      operations: queues
    };
  }

  clearFailedOperations(): number {
    const failedEntries = Array.from(this.retryQueues.entries())
      .filter(([_, operation]) => operation.status === 'failed');
    
    failedEntries.forEach(([key, _]) => this.retryQueues.delete(key));
    
    return failedEntries.length;
  }

  getFailedOperations(): IRetryOperation[] {
    return Array.from(this.retryQueues.values())
      .filter(operation => operation.status === 'failed');
  }

  getRetryingOperations(): IRetryOperation[] {
    return Array.from(this.retryQueues.values())
      .filter(operation => operation.status === 'retrying');
  }
}

export default RetryManager;
