/**
 * Seed mínimo — expandir na S1 (planos, procedimentos, anamnese padrão).
 * Requer DATABASE_URL e migrações aplicadas.
 */
async function main() {
  console.info('seed: nothing to seed yet (Sprint 0 scaffold)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
