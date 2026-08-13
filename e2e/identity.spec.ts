import { expect, test } from '@playwright/test';
import { expectLoginPage, loginAs, signupClinic } from './helpers/auth';
import { OWNER, RECEPTION, SEED_CLINIC } from './helpers/credentials';

test.describe('Identity (E1)', () => {
  test('login com credenciais inválidas mostra erro', async ({ page }) => {
    await page.goto('/login');
    await expectLoginPage(page);
    await page.getByLabel('E-mail').fill('nao-existe@example.com');
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('owner entra e vê o dashboard', async ({ page }) => {
    await loginAs(page, OWNER);
    await expect(page.getByRole('heading', { name: new RegExp(OWNER.name) })).toBeVisible();
    await expect(page.getByText(`Bem-vindo à ${SEED_CLINIC}.`)).toBeVisible();
  });

  test('recepção entra', async ({ page }) => {
    await loginAs(page, RECEPTION);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/app/);
  });

  test('signup cria clínica e entra no app', async ({ page }) => {
    const { clinicName } = await signupClinic(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(`Bem-vindo à ${clinicName}.`)).toBeVisible();
  });

  test('forgot password não enumera e-mail', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByText('Recuperar senha', { exact: true })).toBeVisible();
    await page.getByLabel('E-mail').fill('qualquer@example.com');
    await page.getByRole('button', { name: 'Enviar link' }).click();
    await expect(
      page.getByText(/Se o e-mail estiver cadastrado, você receberá instruções/i),
    ).toBeVisible();
  });

  test('rota autenticada redireciona para login', async ({ page }) => {
    await page.goto('/app/agenda');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
    await expectLoginPage(page);
  });
});
