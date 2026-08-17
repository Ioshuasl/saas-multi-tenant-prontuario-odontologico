import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { RECEPTION, SEED_PATIENT } from './helpers/credentials';

test.describe('Messaging inbox (E8b)', () => {
  test('recepção lista, abre e responde a conversa da Maria', async ({ page }) => {
    await loginAs(page, RECEPTION);
    await page.goto('/app/inbox');

    await expect(page.getByRole('heading', { name: 'Inbox' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'WhatsApp' })).toBeVisible();

    const conversation = page.getByRole('button', { name: new RegExp(SEED_PATIENT) });
    await expect(conversation).toBeVisible();
    await conversation.click();

    await expect(page.getByText('Oi, quero remarcar')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir ficha' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agendar' })).toBeVisible();

    const reply = `Horário confirmado e2e ${Date.now()}`;
    await page.getByLabel('Mensagem').fill(reply);
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByText(reply)).toBeVisible();
  });

  test('rota WhatsApp de conta/QR permanece intacta', async ({ page }) => {
    await loginAs(page, RECEPTION);
    await page.goto('/app/whatsapp');
    await expect(page.getByRole('heading', { name: 'WhatsApp' })).toBeVisible();
    await expect(page.getByText(/Conecte o número da clínica/)).toBeVisible();
  });
});
