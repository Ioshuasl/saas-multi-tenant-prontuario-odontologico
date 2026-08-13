import { env } from '../config/env.js';
import { BullmqJobQueue } from './bullmq_job_queue.js';
import type { JobQueue } from './job_queue.port.js';

let singleton: JobQueue | undefined;

/** Injeta fila (InMemory no smoke; BullMQ no worker/API). */
export function setJobQueue(queue: JobQueue | undefined): void {
  singleton = queue;
}

/** Fila compartilhada no processo. API só faz add; worker registra handlers. */
export function getJobQueue(): JobQueue {
  if (!singleton) {
    singleton = new BullmqJobQueue();
    if (env.NODE_ENV !== 'test') {
      void singleton.tryConnect();
    }
  }
  return singleton;
}
