import { WRITABLE_SUBSCRIPTION_STATUSES } from '../../enum/subscription/subscription_status.enum.js';

export class SubscriptionState {
  static isWritable(status: string, periodEnd: Date | null, now = new Date()): boolean {
    if (!(WRITABLE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)) {
      return false;
    }
    if (status === 'TRIAL' && periodEnd && periodEnd.getTime() <= now.getTime()) {
      return false;
    }
    return true;
  }

  static daysRemaining(periodEnd: Date | null, now = new Date()): number | null {
    if (!periodEnd) return null;
    const ms = periodEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(ms / 86_400_000));
  }
}
