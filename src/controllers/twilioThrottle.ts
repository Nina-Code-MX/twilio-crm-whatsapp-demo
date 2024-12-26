class twilioThrottle {
    private queue: (() => Promise<void>)[] = [];
    private isProcessing = false;
  
    constructor(private requestsPerSecond: number) {}
  
    private processQueue() {
      if (this.isProcessing) return;
  
      this.isProcessing = true;
      const interval = 1000 / this.requestsPerSecond; // Time between requests in milliseconds
  
      const processNext = () => {
        if (this.queue.length === 0) {
          this.isProcessing = false;
          return;
        }
  
        const request = this.queue.shift();
        if (request) {
          request().finally(() => {
            setTimeout(processNext, interval);
          });
        }
      };
  
      processNext();
    }
  
    public fetch(url: string, options?: RequestInit): Promise<Response> {
      return new Promise((resolve, reject) => {
        const task = () => fetch(url, options)
          .then(resolve)
          .catch(reject);
  
        this.queue.push(() => task());
        this.processQueue();
      });
    }
}

export default twilioThrottle;