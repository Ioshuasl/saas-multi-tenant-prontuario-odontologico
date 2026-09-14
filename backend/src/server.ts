import type { Server } from 'node:http';
import { createApp } from './app.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/config/logger.js';

const app = createApp();

const server: Server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'api_listening');
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(
      { port: env.PORT },
      `api_port_in_use — a porta ${env.PORT} já está ocupada. Encerre o outro processo (pnpm dev / tsx watch) e tente de novo.`,
    );
    process.exit(1);
  }
  logger.error({ err }, 'api_listen_failed');
  process.exit(1);
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'api_shutdown');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
