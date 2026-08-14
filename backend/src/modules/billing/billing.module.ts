import { Router } from 'express';
import { buildReceivableRoutes } from './routes/v1/receivable.routes.js';
import { buildInstallmentRoutes } from './routes/v1/installment.routes.js';
import { buildPaymentRoutes } from './routes/v1/payment.routes.js';
import { buildCreditRoutes } from './routes/v1/credit.routes.js';
import { buildCashSessionRoutes } from './routes/v1/cash_session.routes.js';
import { buildPayableRoutes } from './routes/v1/payable.routes.js';
import { buildFinancialCategoryRoutes } from './routes/v1/financial_category.routes.js';
import { buildReportRoutes } from './routes/v1/report.routes.js';

export function buildBillingRouter(): Router {
  const router = Router();
  router.use('/receivables', buildReceivableRoutes());
  router.use('/installments', buildInstallmentRoutes());
  router.use('/payments', buildPaymentRoutes());
  router.use('/patients', buildCreditRoutes());
  router.use('/cash-sessions', buildCashSessionRoutes());
  router.use('/payables', buildPayableRoutes());
  router.use('/financial-categories', buildFinancialCategoryRoutes());
  router.use('/reports', buildReportRoutes());
  return router;
}
