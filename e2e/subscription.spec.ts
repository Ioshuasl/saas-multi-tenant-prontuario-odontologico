import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { ASSISTANT, DENTIST, OWNER } from './helpers/credentials';

test.describe('Assinatura (E10)', () => {
  test('dono vê plano Essencial, trial e CTA sem checkout', async ({ page }) => {
    await loginAs(page, OWNER);
    await expect(page.getByRole('link', { name: 'Assinatura' })).toBeVisible();

    await page.goto('/app/assinatura');
    await expect(page.getByRole('heading', { name: 'Assinatura' })).toBeVisible();
    await expect(page.getByText('Plano Essencial')).toBeVisible();
    await expect(page.getByText('Período de avaliação')).toBeVisible();
    await expect(page.getByText(/dia\(s\) restantes de avaliação/)).toBeVisible();
    await expect(page.getByText('Fale conosco para ativar ou reativar o plano.')).toBeVisible();
    await expect(page.getByRole('button', { name: /checkout|pagar|cartão/i })).toHaveCount(0);
  });

  test('dentista e ASB não veem Assinatura na navegação', async ({ page }) => {
    await loginAs(page, DENTIST);
    await expect(page.getByRole('link', { name: 'Assinatura' })).toHaveCount(0);

    await loginAs(page, ASSISTANT);
    await expect(page.getByRole('link', { name: 'Assinatura' })).toHaveCount(0);
  });
});
