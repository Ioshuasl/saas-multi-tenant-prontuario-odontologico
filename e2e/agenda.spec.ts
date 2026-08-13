import { expect, test } from './helpers/fixtures';
import { SEED_CHAIR, SEED_PATIENT } from './helpers/credentials';

test.describe('Agenda (E4a)', () => {

  test('visão dia/semana por profissional e cadeira', async ({ page }) => {
    await page.goto('/app/agenda');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole('button', { name: 'Dia' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semana' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Profissional' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cadeira' })).toBeVisible();
    await expect(page.getByLabel('Profissional')).toBeVisible();

    await page.getByRole('button', { name: 'Cadeira' }).click();
    await expect(page.getByLabel('Cadeira')).toBeVisible();
    await expect(page.getByLabel('Cadeira')).toContainText(SEED_CHAIR);

    await page.getByRole('button', { name: 'Dia' }).click();
    await expect(page.getByRole('gridcell').first()).toBeVisible();
  });

  test('cria agendamento em ≤3 interações e confirma status', async ({ page }) => {
    await page.goto('/app/agenda');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();

    for (let i = 0; i < 8; i += 1) {
      await page.getByRole('button', { name: 'Próximo' }).click();
    }

    await page.getByRole('gridcell').nth(1).click();
    await expect(page.getByText('Novo agendamento', { exact: true })).toBeVisible();

    await page.getByPlaceholder('Buscar paciente…').fill('Maria');
    await expect(page.locator('#appt-patient')).toContainText(SEED_PATIENT, { timeout: 15_000 });
    const patientValue = await page
      .locator('#appt-patient option')
      .filter({ hasText: SEED_PATIENT })
      .first()
      .getAttribute('value');
    await page.locator('#appt-patient').selectOption(patientValue ?? '');
    await page.getByRole('button', { name: 'Agendar' }).click();

    await expect(page.getByText('Novo agendamento', { exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: new RegExp(SEED_PATIENT) }).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('button', { name: new RegExp(SEED_PATIENT) }).first().click();
    await expect(page.getByLabel('Status')).toBeVisible();
    await page.getByLabel('Status').selectOption({ label: 'Confirmado' });
    await page.getByRole('button', { name: 'Atualizar status' }).click();
    await expect(page.getByText('Confirmado').first()).toBeVisible();
  });

  test('abre diálogo de bloqueio', async ({ page }) => {
    await page.goto('/app/agenda');
    await page.getByRole('button', { name: 'Bloquear' }).click();
    await expect(page.getByText('Bloquear horário', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Motivo')).toBeVisible();
  });
});
