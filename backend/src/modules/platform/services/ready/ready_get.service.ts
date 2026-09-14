import { pingRedis } from '../../helpers/ready_redis.helper.js';
import { pingObjectStorage } from '../../helpers/ready_storage.helper.js';
import { PingDbRepository } from '../../repositories/ready/ready_ping_db.repository.js';
import type { ReadyCheck } from '../../types/ready/ready_get.types.js';

export class GetService {
  constructor(private readonly pingDb = new PingDbRepository()) {}

  async execute(): Promise<ReadyCheck> {
    const [db, redis, storage] = await Promise.all([
      this.pingDb.execute(),
      pingRedis(),
      pingObjectStorage(),
    ]);
    return { db, redis, storage };
  }
}
