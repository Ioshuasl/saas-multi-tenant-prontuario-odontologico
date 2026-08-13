import type { JobName, JobRetry, QueueName } from './queue_names.js';
import type { JobPayload } from './job_payload.js';

export class RedisUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('REDIS_UNAVAILABLE', cause !== undefined ? { cause } : undefined);
    this.name = 'RedisUnavailableError';
  }
}

export type EnqueueOptions = {
  jobId?: string;
  delayMs?: number;
  retry?: JobRetry;
};

export type JobHandler = (payload: JobPayload) => Promise<void>;

export type JobQueue = {
  add(
    queue: QueueName,
    jobName: JobName,
    payload: JobPayload,
    options?: EnqueueOptions,
  ): Promise<void>;
  remove(queue: QueueName, jobId: string): Promise<void>;
  register(queue: QueueName, jobName: JobName, handler: JobHandler): void;
  tryConnect(): Promise<boolean>;
  isConnected(): boolean;
  startWorkers(): Promise<void>;
  close(): Promise<void>;
};
