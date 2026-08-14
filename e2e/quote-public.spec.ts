import { expect, test } from '@playwright/test';
import { sendMariaDraftAndPublicUrl } from './helpers/quote-public';

test.describe('Orçamento público', () => {
  test('token inválido mostra 404', async ({ page }) => {
    await page.goto('/orcamento/token-invalido');
    await expect(page.getByText('Link inválido, expirado ou já utilizado.')).toBeVisible();
  });

  test('Maria: aprova 2 de 3 itens e mostra parcelas (proposta comercial)', async ({ page }) => {
    const { publicUrl, itemLabels } = await sendMariaDraftAndPublicUrl();
    const path = new URL(publicUrl).pathname;
    await page.goto(path);
    await expect(page.getByText('Proposta comercial')).toBeVisible();
    await expect(page.getByText(/proposta nº/i)).toBeVisible();
    await expect(page.getByText(/contrato assinado|elimine o papel/i)).toHaveCount(0);

    expect(itemLabels.length).toBeGreaterThanOrEqual(3);
    const lastCheckbox = page.getByRole('checkbox', { name: /Radiografia periapical/ });
    await expect(lastCheckbox).toBeVisible();
    await lastCheckbox.click();

    await page.getByLabel('Parcelas').fill('3');
    await page.getByRole('button', { name: 'Aprovar' }).click();
    await expect(page.getByText(/Proposta registrada/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Parcela 1/)).toBeVisible();
    await expect(page.getByText(/Parcela 3/)).toBeVisible();
  });
});
