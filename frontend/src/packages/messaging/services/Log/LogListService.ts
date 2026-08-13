import { LogListData } from '@/packages/messaging/data/Log/LogListData';
import type { MessageLogListQuery } from '@/packages/messaging/types/Log/LogTypes';

export async function LogListService(query: MessageLogListQuery = {}) {
  return LogListData(query);
}
