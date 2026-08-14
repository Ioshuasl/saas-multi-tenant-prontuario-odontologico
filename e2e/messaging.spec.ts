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
      await page.getByRole('checkbox').check();
      await connectButton.click();
    }

    const testTo = page.getByLabel('Número que receberá o teste');
    if (await testTo.isVisible().catch(() => false)) {
      await testTo.fill('5562999999999');
    }

    const testButton = page.getByRole('button', { name: 'Enviar teste' });
    if (await testButton.isVisible().catch(() => false)) {
      await testButton.click();
    }

    await expect(page.getByText('Conectado')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel('Kill switch')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Uso' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Logs de envio' })).toBeVisible();
  });
});
