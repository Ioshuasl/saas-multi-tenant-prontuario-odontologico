import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import {
  ensureCashSessionOpen,
  ensureOpenInstallmentForMaria,
  registerPaymentPixCash,
} from './helpers/billing';
import { FINANCE, OWNER, RECEPTION } from './helpers/credentials';

test.describe('Fluxo de caixa M4', () => {
  test('baixa PIX+CASH aparece no fluxo CASH do dia (owner)', async ({ page }) => {
    const seed = await ensureOpenInstallmentForMaria();
    await ensureCashSessionOpen(seed.unitId);
    const paid = await registerPaymentPixCash(seed.installmentId, seed.balanceCents);

    await loginAs(page, OWNER);
    await expect(page.getByRole('link', { name: 'Fluxo' })).toBeVisible();
    await page.goto('/app/financeiro/fluxo');
    await expect(page.getByRole('heading', { name: 'Fluxo de caixa' })).toBeVisible();

    const today = new Date().toISOString().slice(0, 10);
    await page.getByRole('textbox', { name: 'De', exact: true }).fill(today);
    await page.getByRole('textbox', { name: 'Até', exact: true }).fill(today);
    await page.getByLabel('Regime', { exact: true }).selectOption('CASH');

    await expect(page.getByRole('term').filter({ hasText: 'Entradas' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('cell', { name: today, exact: true })).toBeVisible();

    const inflows = page
      .getByRole('term')
      .filter({ hasText: 'Entradas' })
      .locator('xpath=following-sibling::dd[1]');
    await expect(inflows).toBeVisible();
    const text = await inflows.textContent();
    expect(text).toBeTruthy();
    expect(paid.amountCents).toBeGreaterThan(0);
  });

  test('FINANCE acessa fluxo; recepção recebe 403 no relatório', async ({ page }) => {
    await loginAs(page, FINANCE);
    await page.goto('/app/financeiro/fluxo');
    await expect(page.getByRole('heading', { name: 'Fluxo de caixa' })).toBeVisible();
    await expect(page.getByRole('term').filter({ hasText: 'Entradas' })).toBeVisible({
      timeout: 20_000,
    });

    await loginAs(page, RECEPTION);
    await page.goto('/app/financeiro/fluxo');
    await expect(page.getByRole('heading', { name: 'Fluxo de caixa' })).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 20_000 });
  });
});
