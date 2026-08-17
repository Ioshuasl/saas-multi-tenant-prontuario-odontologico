import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import type { UsageMetric } from '../../enum/usage/usage_metric.enum.js';

const METRIC_LABEL: Record<UsageMetric, string> = {
  PROFESSIONALS: 'profissionais',
  USERS: 'usuários administrativos',
  UNITS: 'unidades',
  STORAGE_BYTES: 'armazenamento',
  MESSAGES_MONTH: 'mensagens no mês',
};

export class SubscriptionRequiredError extends AppError {
  constructor() {
    super(
      'SUBSCRIPTION_REQUIRED',
      'Assinatura inativa. A clínica está em somente leitura. Exportação de dados continua disponível. Fale conosco para reativar.',
      402,
    );
    this.name = 'SubscriptionRequiredError';
  }
}

export class PlanLimitExceededError extends AppError {
  constructor(metric: UsageMetric, limit: number, current: number) {
    const label = METRIC_LABEL[metric];
    super(
      'PLAN_LIMIT_EXCEEDED',
      `Seu plano permite ${formatLimit(metric, limit)} ${label} — veja os planos para fazer upgrade.`,
      402,
      { metric, limit, current, href: '/app/assinatura' },
    );
    this.name = 'PlanLimitExceededError';
  }
}

export class CheckoutNotImplementedError extends AppError {
  constructor() {
    super(
      'NOT_IMPLEMENTED',
      'Checkout não está disponível neste momento. Fale conosco para ativar o plano.',
      501,
    );
    this.name = 'CheckoutNotImplementedError';
  }
}

export class SubscriptionNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Assinatura não encontrada.', 404);
    this.name = 'SubscriptionNotFoundError';
  }
}

export class PlanNotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Plano não encontrado.', 404);
    this.name = 'PlanNotFoundError';
  }
}

function formatLimit(metric: UsageMetric, limit: number): string {
  if (metric === 'STORAGE_BYTES') {
    const gb = limit / (1024 * 1024 * 1024);
    return `${gb} GB de`;
  }
  return String(limit);
}
