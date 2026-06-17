import createLogger from '../logger/index.js';

const logger = createLogger('scheduler');

export class Scheduler {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly intervalMs: number,
    private readonly task: () => Promise<void>,
    private readonly onError: (error: unknown) => void = (error) => {
      logger.error('Scheduled task failed', { error });
    }
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }
    logger.info('Scheduler started', { intervalMs: this.intervalMs });
    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.intervalMs);
    void this.runOnce();
  }

  async runOnce(): Promise<void> {
    if (this.running) {
      logger.warn('Scheduled task skipped because previous run is still active');
      return;
    }
    this.running = true;
    try {
      await this.task();
    } catch (error) {
      this.onError(error);
    } finally {
      this.running = false;
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Scheduler stopped');
    }
  }
}
