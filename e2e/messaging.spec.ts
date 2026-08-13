import { expect, test } from './helpers/fixtures';

test.describe('Messaging WhatsApp (E8a ops)', () => {
  test('onboarding aponta para a rota WhatsApp', async ({ page }) => {
    await page.goto('/app/onboarding');
    await expect(page.getByRole('heading', { name: 'Onboarding' })).toBeVisible();
    const whatsappRow = page.locator('li').filter({ hasText: 'WhatsApp' });
    await expect(whatsappRow.getByRole('link', { name: 'Configurar' })).toHaveAttribute(
      'href',
      '/app/whatsapp',
    );
  });

  test('wizard conecta conta fake e mostra uso/logs', async ({ page }) => {
    await page.goto('/app/whatsapp');
    await expect(page.getByRole('heading', { name: 'WhatsApp' })).toBeVisible();

    const connectButton = page.getByRole('button', { name: 'Conectar' });
    if (await connectButton.isVisible().catch(() => false)) {
      await page.getByLabel('WABA ID').fill('fake-waba-e2e');
      await page.getByLabel('Phone Number ID').fill('fake-phone-e2e');
      await page.getByLabel('Telefone de exibição').fill('+556299990000');
      await page.getByLabel('Access token').fill('fake-access-token-e2e');
      await connectButton.click();
    }

    const testButton = page.getByRole('button', { name: 'Enviar teste' });
    if (await testButton.isVisible().catch(() => false)) {
      await testButton.click();
    }

    await expect(page.getByText('Conectado')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('Kill switch')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Uso e créditos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Logs de envio' })).toBeVisible();
  });
});
