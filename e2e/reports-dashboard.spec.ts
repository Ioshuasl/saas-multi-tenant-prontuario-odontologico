import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { DENTIST, OWNER } from './helpers/credentials';

test.describe('Dashboard e relatórios (E9)', () => {
  test('dono vê KPIs no início, abre relatórios e exporta CSV', async ({ page }) => {
    await loginAs(page, OWNER);
    await page.goto('/app');

    await expect(page.getByRole('heading', { name: /Olá/ })).toBeVisible();
    await expect(page.getByText('Agenda de hoje')).toBeVisible();
    await expect(page.getByText('A receber hoje')).toBeVisible();
    await expect(page.getByText('Produção do mês')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver agenda' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Relatórios' })).toBeVisible();

    await page.goto('/app/relatorios');
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
    await expect(page.getByText('Indicadores da clínica e exportação CSV.')).toBeVisible();
    await expect(page.getByText('Recebimentos no período')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeVisible();

    await page.getByRole('button', { name: 'Exportar CSV' }).click();
    await expect(page.getByRole('link', { name: 'Baixar CSV' })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Copiar URL' })).toBeVisible();
  });

  test('dentista vê produção no dashboard e não vê receita consolidada', async ({ page }) => {
    await loginAs(page, DENTIST);
    await page.goto('/app');

    await expect(page.getByText('Agenda de hoje')).toBeVisible();
    await expect(page.getByText('Produção do mês')).toBeVisible();
    await expect(page.getByText('A receber hoje')).toHaveCount(0);
    await expect(page.getByText('Recebido hoje')).toHaveCount(0);

    await page.goto('/app/relatorios');
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
    await expect(page.getByText('Executado por profissional')).toBeVisible();
    await expect(page.getByText('Recebimentos no período')).toHaveCount(0);
    await expect(page.getByText('Entradas e saídas')).toHaveCount(0);
    await expect(page.getByText('Títulos em atraso')).toHaveCount(0);

    await page.goto('/app/relatorios/production');
    await expect(page.getByRole('heading', { name: 'Produção' })).toBeVisible();
    await expect(page.getByText('Exibindo apenas a sua produção.')).toBeVisible();
  });
});
