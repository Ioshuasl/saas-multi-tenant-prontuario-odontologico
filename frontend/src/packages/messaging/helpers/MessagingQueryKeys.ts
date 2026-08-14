export const messagingQueryKeys = {
  account: ['messaging-account'] as const,
  qr: ['messaging-account-qr'] as const,
  usage: ['messaging-usage'] as const,
  logs: (result?: string) => ['messaging-logs', result ?? ''] as const,
};
