import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import type { UsageMetric } from '../../enum/usage/usage_metric.enum.js';

export class SubscriptionRequiredError extends AppError {
  constructor(status: string) {
    super(
      'SUBSCRIPTION_REQUIRED',
      `Assinatura ${status.toLowerCase()}: somente leitura e exportação estão liberadas. Fale conosco para reativar.`,
      402,
      { subscriptionStatus: status },
    );
    this.name = 'SubscriptionRequiredError';
  }
}

export class PlanLimitExceededError extends AppError {
  constructor(metric: UsageMetric, limit: number, current: number) {
    const labels: Record<string, string> = {
      professionals: 'profissionais',
      admin_users: 'usuários administrativos',
      units: 'unidades',
      storage_bytes: 'armazenamento',
      messages_month: 'mensagens do mês',
      patients: 'pacientes',
    };
    const label = labels[metric] ?? metric;
    super(
      'PLAN_LIMIT_EXCEEDED',
      `Seu plano permite ${limit} ${label} (uso atual: ${current}). Veja os planos em Assinatura ou fale conosco para fazer upgrade.`,
      402,
      { metric, limit, current },
    );
    this.name = 'PlanLimitExceededError';
  }
}

export class SubscriptionNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Assinatura não encontrada.', 404);
    this.name = 'SubscriptionNotFoundError';
  }
}

export class CheckoutNotImplementedError extends AppError {
  constructor() {
    super(
      'NOT_IMPLEMENTED',
      'Checkout automático não está disponível. Fale conosco para ativar seu plano.',
      501,
    );
    this.name = 'CheckoutNotImplementedError';
  }
}
