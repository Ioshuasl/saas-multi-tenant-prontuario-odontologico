import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { ensureActiveRes01Plan } from './helpers/treatment-plan';
import { DENTIST } from './helpers/credentials';

test.describe('Execução no atendimento (E6)', () => {
  test('dentista executa RES-01 e o odontograma fica RESTORED', async ({ page }) => {
    await ensureActiveRes01Plan('João Pedro');
    await loginAs(page, DENTIST);
    await page.goto('/app/agenda');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 45_000 });
    const professional = page.getByLabel('Profissional');
    await expect(professional).toContainText('Dra. Ana Souza', { timeout: 20_000 });
    await professional.selectOption({ label: 'Dra. Ana Souza' });

    const card = page.getByRole('button', { name: /João Pedro.*(Confirmado|Em atendimento)/ });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.press('Enter');
    await expect(page.getByRole('dialog', { name: /João Pedro/ })).toBeVisible();
    const start = page.getByRole('button', { name: 'Iniciar atendimento' });
    const open = page.getByRole('button', { name: 'Abrir atendimento' });
    if (await start.count()) {
      await start.click();
    } else {
      await open.click();
    }

    await expect(page).toHaveURL(/\/app\/atendimento\//, { timeout: 30_000 });
    await expect(page.getByText('Plano de tratamento')).toBeVisible();

    const item = page.getByRole('checkbox', { name: /Restauração em resina.*26/ }).first();
    await expect(item).toBeVisible();
    await item.click();
    await page.getByRole('button', { name: 'Executar' }).click();
    await expect(page.getByRole('heading', { name: 'Executar item' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Salvar e assinar' }).click();

    await expect(page.getByRole('heading', { name: 'Executar item' })).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(page.getByRole('alert').filter({ hasText: 'Evolução assinada' })).toBeVisible();
    await expect(page.getByText(/esta evolução não pode ser editada/i).first()).toBeVisible();
    await expect(page.getByLabel(/Dente 26.*Restaurado/).first()).toBeVisible({ timeout: 20_000 });
  });
});
