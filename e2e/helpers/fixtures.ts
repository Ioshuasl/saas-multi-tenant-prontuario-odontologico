import { devices, test as base, type BrowserContext } from '@playwright/test';
import { loginAs } from './auth';
import { OWNER } from './credentials';

const WEB_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3002';

/**
 * Contexto autenticado do owner (1 login por worker).
 * Access token é só em memória; refresh cookie rotaciona — storageState por teste invalida o token.
 */
export const test = base.extend<object, { ownerContext: BrowserContext }>({
  ownerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        baseURL: WEB_URL,
        locale: 'pt-BR',
        ...devices['Desktop Chrome'],
      });
      const page = await context.newPage();
      await loginAs(page, OWNER);
      await page.close();
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  page: async ({ ownerContext }, use) => {
    const page = await ownerContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
