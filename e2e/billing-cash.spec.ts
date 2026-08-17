import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { ensureCashSessionOpen, ensureOpenInstallmentForMaria } from './helpers/billing';
import { ASSISTANT, DENTIST, FINANCE, RECEPTION } from './helpers/credentials';
import { expect as ownerExpect, test as ownerTest } from './helpers/fixtures';

test.describe('Caixa do dia (recepção)', () => {
  test('abre, sangria e fecha com divergência exigindo motivo', async ({ page }) => {
    const seed = await ensureOpenInstallmentForMaria();
    await ensureCashSessionOpen(seed.unitId);

    await loginAs(page, RECEPTION);
    await page.goto('/app/financeiro/caixa');
    await expect(page.getByRole('heading', { name: 'Caixa do dia' })).toBeVisible();

    const openBtn = page.getByRole('button', { name: 'Abrir caixa' });
    if (await openBtn.isVisible().catch(() => false)) {
      await openBtn.click();
      await expect(page.getByRole('heading', { name: 'Abrir caixa' })).toBeVisible();
      await page.getByLabel('Fundo inicial (R$)').fill('50,00');
      await page.getByRole('button', { name: 'Abrir' }).click();
      await expect(page.getByRole('heading', { name: 'Abrir caixa' })).toHaveCount(0);
    }

    await expect(page.getByText(/Aberto/i).first()).toBeVisible();

    await page.getByRole('button', { name: 'Sangria / suprimento' }).click();
    await expect(page.getByRole('heading', { name: 'Sangria / suprimento' })).toBeVisible();
    await page.locator('#cash-move-kind').selectOption('WITHDRAWAL');
    await page.locator('#cash-move-method').selectOption('CASH');
    await page.getByLabel('Valor (R$)').fill('10,00');
    await page.getByLabel('Motivo').fill('sangria de teste e2e caixa');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByRole('heading', { name: 'Sangria / suprimento' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Fechar caixa' }).click();
    await expect(page.getByRole('heading', { name: 'Fechar caixa' })).toBeVisible();

    const firstCount = page.locator('#cash-count-0');
    await expect(firstCount).toBeVisible();
    await firstCount.fill('9999,00');
    await expect(page.getByText(/Divergência de/i)).toBeVisible();
    await page.getByRole('button', { name: 'Fechar caixa' }).click();
    await expect(page.getByText(/ao menos 10 caracteres/i)).toBeVisible();
    await page.getByLabel('Justificativa da diferença').fill('divergência registrada no e2e caixa');
    await page.getByRole('button', { name: 'Fechar caixa' }).click();

    await expect(page.getByRole('heading', { name: 'Fechar caixa' })).toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(page.getByText(/Nenhuma sessão aberta/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir caixa' })).toBeVisible();
  });
});

test.describe('Caixa (papéis)', () => {
  test('FINANCE vê Fluxo e Inadimplência; recepção não', async ({ page }) => {
    await loginAs(page, FINANCE);
    await expect(page.getByRole('link', { name: 'Fluxo' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inadimplência' })).toBeVisible();

    await loginAs(page, RECEPTION);
    await expect(page.getByRole('link', { name: 'Fluxo' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Inadimplência' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Caixa' })).toBeVisible();
  });

  test('DENTIST vê Produção e não vê Receber/Fluxo', async ({ page }) => {
    await loginAs(page, DENTIST);
    await expect(page.getByRole('link', { name: 'Produção' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Receber' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Fluxo' })).toHaveCount(0);
  });

  test('ASB sem nav financeiro', async ({ page }) => {
    await loginAs(page, ASSISTANT);
    await expect(page.getByRole('link', { name: 'Receber' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Caixa' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Produção' })).toHaveCount(0);
  });
});

ownerTest.describe('Contas a pagar (owner)', () => {
  ownerTest('cria e lista conta OPEN', async ({ page }) => {
    await page.goto('/app/financeiro/pagar');
    await ownerExpect(page.getByRole('heading', { name: 'Contas a pagar' })).toBeVisible();
    await page.getByRole('button', { name: 'Nova conta' }).click();
    await ownerExpect(page.getByRole('heading', { name: 'Nova conta a pagar' })).toBeVisible();

    const category = page.locator('#payable-category');
    await ownerExpect(category.locator('option').nth(1)).toBeAttached({ timeout: 20_000 });
    const firstValue = await category.locator('option').nth(1).getAttribute('value');
    await category.selectOption(firstValue ?? '');
    const description = `Aluguel e2e ${Date.now()}`;
    await page.getByLabel('Descrição').fill(description);
    await page.getByLabel('Valor (R$)').fill('1200,00');
    const due = new Date();
    due.setDate(due.getDate() + 10);
    await page.getByLabel('Vencimento').fill(due.toISOString().slice(0, 10));
    await page.getByRole('button', { name: 'Salvar' }).click();
    await ownerExpect(page.getByRole('cell', { name: description }).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
