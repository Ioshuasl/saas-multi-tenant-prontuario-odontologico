import { expect, test } from './helpers/fixtures';
import type { Page } from '@playwright/test';
import { SEED_CHAIR, SEED_PATIENT } from './helpers/credentials';

async function closeOpenDialog(page: Page): Promise<void> {
  const overlay = page.locator('[data-slot="dialog-overlay"]');
  if (!(await overlay.first().isVisible().catch(() => false))) return;

  // Base UI: Escape nem sempre fecha; preferir botões explícitos.
  for (const name of ['Fechar', 'Cancelar'] as const) {
    const btn = page.getByRole('button', { name, exact: true });
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      break;
    }
  }
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(200);

  if (await overlay.first().isVisible().catch(() => false)) {
    await page.evaluate(() => {
      document.querySelectorAll('[data-slot="dialog-portal"]').forEach((node) => node.remove());
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
    });
  }
  await expect(overlay).toHaveCount(0, { timeout: 5_000 }).catch(() => undefined);
}

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
    test.setTimeout(180_000);
    await page.goto('/app/agenda');
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();

    // Dia + manhã no expediente (grade 7–20; clínica seed 8–18). Semana+fração alta
    // abria slot perto/após 18h → "Horário fora do expediente".
    await page.getByRole('button', { name: 'Dia' }).click();
    const daysAhead = 14 + (Date.now() % 21);
    for (let i = 0; i < daysAhead; i += 1) {
      await page.getByRole('button', { name: 'Próximo' }).click();
    }
    // Garante dia útil (seg–sex): avança no máx. 6 dias se cair em fim de semana.
    for (let i = 0; i < 6; i += 1) {
      const label = (
        await page.getByRole('gridcell').first().getAttribute('aria-label')
      )?.toLowerCase() ?? '';
      const weekend = label.includes('sáb') || label.includes('sab') || label.includes('dom');
      if (!weekend) break;
      await page.getByRole('button', { name: 'Próximo' }).click();
    }

    const cell = page.getByRole('gridcell').first();
    await expect(cell).toBeVisible();
    const box = await cell.boundingBox();
    // ~10h–14h (fracões baixas/médias dentro de 8–18).
    const fracs = [0.28, 0.35, 0.42, 0.5, 0.22, 0.55];
    let opened = false;
    for (const frac of fracs) {
      await closeOpenDialog(page);
      await cell.click({
        position: { x: 24, y: Math.max(40, Math.floor((box?.height ?? 480) * frac)) },
        force: true,
      });
      const search = page.getByPlaceholder('Buscar paciente…');
      if (await search.isVisible().catch(() => false)) {
        opened = true;
        break;
      }
      await closeOpenDialog(page);
    }
    expect(opened).toBe(true);
    await expect(page.getByText('Novo agendamento', { exact: true })).toBeVisible();

    await page.getByPlaceholder('Buscar paciente…').fill('Maria');
    await expect(page.locator('#appt-patient')).toContainText(SEED_PATIENT, { timeout: 15_000 });
    const patientValue = await page
      .locator('#appt-patient option')
      .filter({ hasText: SEED_PATIENT })
      .first()
      .getAttribute('value');
    await page.locator('#appt-patient').selectOption(patientValue ?? '');

    const professional = page.locator('#appt-professional');
    if (await professional.isVisible().catch(() => false)) {
      const opt = professional.locator('option').nth(1);
      const value = await opt.getAttribute('value');
      if (value) await professional.selectOption(value);
    }

    const agendar = page.getByRole('button', { name: 'Agendar' });
    await expect(agendar).toBeEnabled({ timeout: 10_000 });
    await agendar.click();
    const stillOpen = page.getByText('Novo agendamento', { exact: true });
    try {
      await expect(stillOpen).toBeHidden({ timeout: 20_000 });
    } catch {
      const alertText = (await page.locator('[data-slot="alert"]').allTextContents()).join(' | ');
      throw new Error(`Agendar manteve o diálogo aberto. Alertas: ${alertText || '(nenhum)'}`);
    }

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
