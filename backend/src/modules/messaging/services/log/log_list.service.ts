import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListMessageLogsRepository } from '../../repositories/message/message.repository.js';
import type { LogsQuerySchema } from '../../schemas/messaging.schema.js';
import type { MessageLogList } from '../../types/messaging.types.js';

export class ListService {
  constructor(private readonly list = new ListMessageLogsRepository()) {}

  async execute(ctx: RequestContext, query: LogsQuerySchema): Promise<MessageLogList> {
    return this.list.execute(ctx, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      result: query.result,
      cursor: query.cursor,
      limit: query.limit,
    });
  }
}
