import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { GetVolumeRepository } from '../../repositories/message/message_volume.repository.js';
import type { MessagingUsage } from '../../types/messaging.types.js';

export class GetService {
  constructor(private readonly volume = new GetVolumeRepository()) {}

  async execute(ctx: RequestContext): Promise<MessagingUsage> {
    return this.volume.execute(ctx);
  }
}
