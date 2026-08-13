import { expect, test } from '@playwright/test';
import {
  captureDebugOtp,
  getSeedClinicSlug,
  pickFirstPublicSlot,
  waitForMailpitOtp,
} from './helpers/public-booking';

test.describe('Public booking (E4b)', () => {
  test('slug inválido mostra 404', async ({ page }) => {
    await page.goto('/agendar/clinica-inexistente-zzzzzzzz');
    await expect(page.getByText('Clínica não encontrada.')).toBeVisible();
  });

  test('link de confirmação inválido', async ({ page }) => {
    await page.goto('/agendar/qualquer/confirmar/token-invalido');
    await expect(page.getByText('Link inválido ou expirado.')).toBeVisible();
  });

  test('aceite da fila com token inválido', async ({ page }) => {
    await page.goto('/fila/token-invalido');
    await page.getByRole('button', { name: 'Aceitar horário' }).click();
    await expect(page.getByText('Link inválido ou expirado.')).toBeVisible();
  });

  test('OTP inválido mostra erro', async ({ page }) => {
    const slug = await getSeedClinicSlug();
    const stamp = Date.now();
    await page.goto(`/agendar/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: /Consulta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    const dentist = page.getByRole('button', { name: 'Dra. Ana Souza' });
    if (await dentist.isVisible().catch(() => false)) {
      await dentist.click();
      await page.getByRole('button', { name: 'Continuar' }).click();
    }

    await pickFirstPublicSlot(page);

    await page.getByLabel('Nome completo').fill(`Paciente OTP ${stamp}`);
    await page.getByLabel('Telefone').fill(`6298${String(stamp).slice(-7)}`);
    await page.getByLabel('E-mail').fill(`e2e-otp-${stamp}@example.com`);
    await page.getByLabel('Aceito o tratamento dos meus dados pessoais').click();
    await page.getByLabel('Aceito os termos de uso').click();
    await page.getByRole('button', { name: 'Enviar código' }).click();

    await expect(page.getByText(/código de 6 dígitos/i)).toBeVisible({ timeout: 20_000 });
    await page.getByLabel('Código de verificação').fill('000000');
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/c[oó]digo inv[aá]lido|expirado|invalidado/i)).toBeVisible();
  });

  test('agenda ponta a ponta com OTP (fake / Mailpit)', async ({ page }) => {
    const slug = await getSeedClinicSlug();
    const stamp = Date.now();
    const email = `e2e-book-${stamp}@example.com`;
    const debugOtp = captureDebugOtp(page);

    await page.goto(`/agendar/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Escolha o serviço e o horário em poucos passos.')).toBeVisible();

    await page.getByRole('button', { name: /Consulta/ }).first().click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    const dentist = page.getByRole('button', { name: 'Dra. Ana Souza' });
    if (await dentist.isVisible().catch(() => false)) {
      await dentist.click();
      await page.getByRole('button', { name: 'Continuar' }).click();
    }

    await pickFirstPublicSlot(page);

    await page.getByLabel('Nome completo').fill(`Paciente Público ${stamp}`);
    await page.getByLabel('Telefone').fill(`6299${String(stamp).slice(-7)}`);
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Aceito o tratamento dos meus dados pessoais').click();
    await page.getByLabel('Aceito os termos de uso').click();
    await page.getByRole('button', { name: 'Enviar código' }).click();

    await expect(page.getByText(/código de 6 dígitos/i)).toBeVisible({ timeout: 20_000 });
    const otp = debugOtp.read() ?? (await waitForMailpitOtp(email));
    await page.getByLabel('Código de verificação').fill(otp);
    await page.getByRole('button', { name: 'Confirmar agendamento' }).click();

    await expect(
      page.getByText(/Aguarde a confirmação da clínica|Consulta agendada com sucesso/i),
    ).toBeVisible({ timeout: 20_000 });
  });
});
