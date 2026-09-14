import { spawnSync } from 'node:child_process';

const DUMP_PATH = '/tmp/odonto_dev.dump';
const ESSAY_DB = 'odonto_restore_essay';

function run(args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync('docker', ['compose', 'exec', '-T', 'postgres', ...args], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function timed(label: string, args: string[]): number {
  const started = Date.now();
  const result = run(args);
  const ms = Date.now() - started;
  if (result.status !== 0) {
    throw new Error(`${label} falhou (${result.status}): ${result.stderr || result.stdout}`);
  }
  console.info(`${label}: ${ms} ms`);
  return ms;
}

function main(): void {
  const dumpMs = timed('pg_dump', [
    'pg_dump',
    '-U',
    'postgres',
    '-d',
    'odonto_dev',
    '-Fc',
    '-f',
    DUMP_PATH,
  ]);

  run(['dropdb', '-U', 'postgres', '--if-exists', ESSAY_DB]);
  const restoreMs =
    timed('createdb', ['createdb', '-U', 'postgres', ESSAY_DB]) +
    timed('pg_restore', [
      'pg_restore',
      '-U',
      'postgres',
      '--no-owner',
      '-d',
      ESSAY_DB,
      DUMP_PATH,
    ]);

  const check = run([
    'psql',
    '-U',
    'postgres',
    '-d',
    ESSAY_DB,
    '-c',
    'SELECT COUNT(*) AS tenants FROM tenant;',
  ]);
  if (check.status !== 0) {
    throw new Error(`verificação falhou: ${check.stderr || check.stdout}`);
  }
  console.info(check.stdout.trim());

  timed('dropdb', ['dropdb', '-U', 'postgres', ESSAY_DB]);
  run(['rm', '-f', DUMP_PATH]);

  const rtoMs = dumpMs + restoreMs;
  console.info(`RTO ensaiado (dump + restore): ${rtoMs} ms (${(rtoMs / 1000).toFixed(1)} s)`);
}

main();
