export const messagingQueryKeys = {
  account: ['messaging-account'] as const,
  usage: ['messaging-usage'] as const,
  logs: (result?: string) => ['messaging-logs', result ?? ''] as const,
};
