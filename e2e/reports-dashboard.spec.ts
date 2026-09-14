import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { DENTIST, OWNER } from './helpers/credentials';
import { ensureSubscriptionActive } from './helpers/subscription';

test.describe('Dashboard + relatórios (E9)', () => {
  test.beforeEach(async () => {
    await ensureSubscriptionActive();
  });

  test('owner vê KPIs no início e hub de relatórios com export', async ({ page }) => {
    await loginAs(page, OWNER);

    await page.goto('/app');
    await expect(page.getByTestId('dashboard-kpi-grid')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Agendamentos', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Receita do dia', { exact: true })).toBeVisible();
    await expect(page.getByText('Próximos atendimentos')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Relatórios' })).toBeVisible();
    await page.goto('/app/relatorios');
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
    await expect(page.getByTestId('report-export-panel')).toBeVisible();

    await page.getByRole('button', { name: 'Exportar' }).click();
    await expect(page.getByText(/Status:/i)).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/Na fila|Gerando…|Pronto|Baixar CSV|Aguardando/i).first(),
    ).toBeVisible({ timeout: 60_000 });
  });

  test('drill-down de faltas abre página de relatório', async ({ page }) => {
    await loginAs(page, OWNER);
    await page.goto('/app');
    await expect(page.getByTestId('dashboard-kpi-grid')).toBeVisible({ timeout: 30_000 });
    const drill = page.getByTestId('dashboard-drill-no-shows');
    await expect(drill).toBeVisible();
    // URL real: /app/relatorios/faltas?from=…&to=… (sem trailing slash).
    await Promise.all([
      page.waitForURL(/\/app\/relatorios\/faltas(\?|$)/, { timeout: 30_000 }),
      drill.click(),
    ]);
    await expect(page.getByRole('heading', { name: 'Faltas', exact: true })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('dentista vê dashboard sem receita do dia; acessa produção', async ({ page }) => {
    await loginAs(page, DENTIST);
    await page.goto('/app');
    await expect(page.getByTestId('dashboard-kpi-grid')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Agendamentos', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Receita do dia', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Produção do mês', { exact: true }).first()).toBeVisible();

    await page.goto('/app/relatorios');
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
    await expect(page.locator('a[href="/app/relatorios/producao"]')).toBeVisible();
    await expect(page.locator('a[href="/app/relatorios/receita"]')).toHaveCount(0);
  });
});
