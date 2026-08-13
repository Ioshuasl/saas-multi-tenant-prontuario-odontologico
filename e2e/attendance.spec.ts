import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { getSeedAppointmentId } from './helpers/attendance';
import { DENTIST, RECEPTION } from './helpers/credentials';

test.describe('Atendimento (E5)', () => {
  test('dentista inicia atendimento, vê odontograma e assina evolução', async ({ page }) => {
    await loginAs(page, DENTIST);
    await page.goto('/app/agenda');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 45_000 });
    const professional = page.getByLabel('Profissional');
    await expect(professional).toContainText('Dra. Ana Souza', { timeout: 20_000 });
    await professional.selectOption({ label: 'Dra. Ana Souza' });

    const card = page.getByRole('button', { name: /João Pedro.*Confirmado/ });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.press('Enter');
    await expect(page.getByRole('dialog', { name: /João Pedro/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar atendimento' })).toBeVisible();
    await page.getByRole('button', { name: 'Iniciar atendimento' }).click();

    await expect(page).toHaveURL(/\/app\/atendimento\//, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /João Pedro/ })).toBeVisible();
    await expect(page.getByText('Odontograma', { exact: true })).toBeVisible();
    await expect(page.getByText('Disponível na Sprint 5.')).toBeVisible();

    await page.getByLabel('Texto da evolução').fill('Evolução e2e: profilaxia realizada sem intercorrências.');
    await page.getByRole('button', { name: 'Salvar e assinar' }).click();
    await expect(page.getByText('Evolução assinada')).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByText(/esta evolução não pode ser editada/i),
    ).toBeVisible();
    await expect(page.getByText('Evolução e2e: profilaxia realizada sem intercorrências.')).toBeVisible();
  });

  test('recepção não vê iniciar atendimento e a rota clínica bloqueia', async ({ page }) => {
    await loginAs(page, RECEPTION);
    await page.goto('/app/agenda');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 45_000 });

    const card = page.getByRole('button', { name: /Maria Silva — Agendado/ });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await card.press('Enter');
    await expect(page.getByLabel('Status')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar atendimento' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Abrir atendimento' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(page.getByLabel('Status')).toHaveCount(0);

    const appointmentId = await getSeedAppointmentId('IN_SERVICE');
    await page.goto(`/app/atendimento/${appointmentId}`);
    await expect(page.getByText(/não tem permissão para acessar o prontuário/i)).toBeVisible({
      timeout: 20_000,
    });
  });
});
