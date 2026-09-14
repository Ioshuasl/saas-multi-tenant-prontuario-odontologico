/**
 * `prisma generate` no Windows falha com EPERM se API/worker
 * mantém query_engine-windows.dll.node aberto. Nesses casos segue o typecheck.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('pnpm', ['exec', 'prisma', 'generate'], {
  cwd,
  encoding: 'utf8',
  shell: true,
});

const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
if (result.status === 0) process.exit(0);

if (/EPERM|EBUSY|operation not permitted/i.test(out)) {
  console.warn(
    'prisma generate skipped (engine DLL locked by running process); continuing typecheck',
  );
  process.exit(0);
}

process.stderr.write(out);
process.exit(result.status ?? 1);
