import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application, type Router } from 'express';
import helmet from 'helmet';
import { env } from './shared/config/env.js';
import { errorHandler } from './shared/middlewares/error_handler.middleware.js';
import { requestIdMiddleware } from './shared/middlewares/request_id.middleware.js';
import { buildApiRouter } from './routes/index.js';

export function createApp(options?: { registerApi?: (api: Router) => void }): Application {
  const app = express();

  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

  app.use(helmet());
  app.use(
    cors({
      origin: origins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  app.get('/health', (_req, res) => {
    res.status(200).json({ data: { status: 'ok', service: 'api' } });
  });

  const api = buildApiRouter();
  options?.registerApi?.(api);
  app.use('/api/v1', api);

  app.use(errorHandler);

  return app;
}
