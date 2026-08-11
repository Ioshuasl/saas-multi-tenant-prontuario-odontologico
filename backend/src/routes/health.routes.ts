import { Router } from 'express';
import type { ApiSuccess } from '@repo/contracts';

export const healthRoutes: Router = Router();

healthRoutes.get('/health', (_req, res) => {
  const body: ApiSuccess<{ status: 'ok'; service: string }> = {
    data: { status: 'ok', service: 'api' },
  };
  res.status(200).json(body);
});
