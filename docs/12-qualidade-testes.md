# 12 — Qualidade e Testes

## 1. Estratégia

A arquitetura em camadas define onde cada teste vive. Testar regra de negócio via HTTP é lento e frágil; testar integração com mock de banco é ilusão. Cada camada tem seu tipo de teste:

```
        ╱╲          e2e (Playwright)            ~15 fluxos críticos
       ╱  ╲         contrato/API (Supertest)    ~1 por endpoint
      ╱────╲        integração (Testcontainers) repositórios, RLS, jobs, transações
     ╱      ╲       unidade (Vitest)            domain + application (a maior parte)
    ╱────────╲
```

| Camada | O que testar | Ferramenta | Dependências reais |
| --- | --- | --- | --- |
| `domain` | Invariantes, máquinas de estado, cálculos | Vitest | nenhuma (puro) |
| `application` | Orquestração de use case, erros, eventos emitidos | Vitest + fakes in-memory | nenhuma |
| `infrastructure` (repos) | Mapeamento, queries, constraints, RLS | Vitest + Testcontainers (Postgres) | Postgres real |
| `interface` (HTTP) | Contrato, validação, status, permissão | Supertest | app + Postgres real |
| Jobs | Idempotência, retry, contexto de tenant | Vitest + Redis real | Redis + Postgres |
| Fluxos | Jornadas de ponta a ponta | Playwright | stack completa |

## 2. Exemplos canônicos

### 2.1 Domínio (rápido, sem I/O)

```ts
describe('Appointment', () => {
  it('não permite confirmar consulta cancelada', () => {
    const appointment = anAppointment({ status: 'SCHEDULED' });
    appointment.cancel('paciente desistiu');
    expect(() => appointment.confirm()).toThrow(InvalidStatusTransitionError);
  });

  it('emite AppointmentScheduled ao agendar', () => {
    const appointment = Appointment.schedule(id(), validProps());
    expect(appointment.pullEvents()).toEqual([expect.objectContaining({ name: 'scheduling.appointment_scheduled' })]);
  });
});

describe('TimeSlot', () => {
  it.each([
    ['08:00', '08:00', false],  // duração zero
    ['08:00', '07:00', false],  // fim antes do início
    ['08:00', '08:03', false],  // menor que o mínimo
    ['08:00', '08:30', true],
  ])('valida %s→%s = %s', (start, end, valid) => { /* ... */ });
});
```

### 2.2 Use case com fakes

```ts
it('rejeita agendamento em slot ocupado sem persistir nada', async () => {
  const repo = new InMemoryAppointmentRepository([anAppointment({ startsAt: '2026-08-20T14:00:00Z' })]);
  const useCase = new ScheduleAppointmentUseCase(repo, new AvailabilityCalculator(repo, fixedHours), fakeUow, fakeIds);

  await expect(useCase.execute(overlappingInput())).rejects.toThrow(SlotUnavailableError);
  expect(repo.all()).toHaveLength(1);
  expect(fakeUow.publishedEvents).toHaveLength(0);
});
```

Fakes in-memory (não mocks de biblioteca) para repositórios: o teste vira legível e resistente a refatoração.

### 2.3 Isolamento multi-tenant (banco real, obrigatório)

```ts
describe('RLS de pacientes', () => {
  it('não retorna paciente de outro tenant', async () => {
    const a = await createTenantWithPatient('Clínica A');
    const b = await createTenantWithPatient('Clínica B');

    const found = await withTenant(b.tenantId, (tx) => tx.patient.findUnique({ where: { id: a.patientId } }));
    expect(found).toBeNull();
  });

  it('bloqueia INSERT com tenant_id divergente do contexto', async () => {
    await expect(
      withTenant(tenantB, (tx) => tx.patient.create({ data: { ...validPatient(), tenantId: tenantA } })),
    ).rejects.toThrow(/row-level security/i);
  });

  it('falha sem contexto de tenant em vez de retornar tudo', async () => {
    const rows = await prismaWithoutContext.patient.findMany();
    expect(rows).toHaveLength(0);
  });

  it('todas as tabelas com tenant_id têm RLS habilitada', async () => {
    expect(await tablesMissingRls()).toEqual([]);
  });
});
```

### 2.4 Constraint de double-booking

```ts
it('impede dois agendamentos simultâneos para o mesmo profissional', async () => {
  const input = { professionalId, startsAt: at('14:00'), endsAt: at('14:40') };
  const results = await Promise.allSettled([scheduleUseCase.execute(input), scheduleUseCase.execute(input)]);

  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
});
```

### 2.5 Invariante financeira

```ts
it('parcelamento sempre soma o total aprovado', async () => {
  fc.assert(fc.property(fc.integer({ min: 100, max: 10_000_000 }), fc.integer({ min: 1, max: 36 }), (total, n) => {
    const installments = splitInstallments(total, n);
    expect(installments).toHaveLength(n);
    expect(installments.reduce((a, b) => a + b, 0)).toBe(total);
  }));
});
```

Teste baseado em propriedade (fast-check) para tudo que envolve dinheiro e arredondamento.

### 2.6 Webhook idempotente

```ts
it('processa o mesmo wamid apenas uma vez', async () => {
  const payload = buttonReplyWebhook({ wamid: 'wamid.ABC', appointmentId });
  await Promise.all([handler.handle(payload), handler.handle(payload)]);

  expect(await countMessages({ providerMessageId: 'wamid.ABC' })).toBe(1);
  expect(await appointmentStatus(appointmentId)).toBe('CONFIRMED');
});
```

### 2.7 E2E (Playwright) — fluxos obrigatórios

1. Signup → wizard → agenda visível.
2. Criar paciente → agendar → confirmar → iniciar atendimento.
3. Registrar evolução com odontograma → verificar imutabilidade (botão de editar oferece "corrigir com motivo").
4. Criar orçamento → aprovar em 6 parcelas → conferir parcelas no financeiro.
5. Receber parcela no caixa → gerar recibo → fechar caixa.
6. Autoagendamento pelo link público (com OTP mockado).
7. Recepção tentando abrir prontuário → acesso negado.
8. Exportação de dados do tenant.
9. Assinatura expirada → app em somente leitura, exportação ainda disponível.
10. Inbox WhatsApp: receber mensagem simulada → responder → histórico no paciente.

## 3. Dados de teste

- **Builders/fábricas** por agregado (`aPatient()`, `anAppointment()`, `aQuote()`) com defaults válidos e sobrescrita pontual — nunca fixtures JSON gigantes.
- Cada teste de integração roda em transação revertida no final, ou em banco por worker (Testcontainers) para paralelismo.
- Seeds de desenvolvimento com dados sintéticos realistas em pt-BR (nomes, CPFs válidos gerados, telefones fictícios). **Proibido** dado real de paciente fora de produção.

## 4. Metas de cobertura

| Escopo | Mínimo | Racional |
| --- | --- | --- |
| `domain/` | 90% | É onde está a regra; teste barato |
| `application/` | 85% | Orquestração e erros |
| `infrastructure/` | 60% | Coberto indiretamente por integração |
| Frontend (hooks/utils) | 70% | Componentes visuais cobertos por e2e |
| Global | 80% | Guarda geral |

Cobertura é piso, não meta de vaidade: PR que sobe cobertura sem testar comportamento é rejeitado em revisão.

## 5. Qualidade estática

| Ferramenta | Configuração |
| --- | --- |
| TypeScript | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`; `any` proibido por lint |
| ESLint | `@typescript-eslint` (com regras que exigem tipagem), `import/order`, `eslint-plugin-boundaries`, `no-floating-promises`, `no-console` (usar logger) |
| Prettier | Formatação única, sem debate |
| dependency-cruiser | Regras de Clean Architecture e de fronteira entre módulos |
| Commitlint + Husky | Conventional Commits; hooks rodam lint/typecheck no `pre-commit` |
| gitleaks | Bloqueia segredo no commit |

Regras de lint que valem citar explicitamente:

```js
// packages/config/eslint/boundaries.js
'boundaries/element-types': ['error', { default: 'disallow', rules: [
  { from: 'domain',         allow: ['domain'] },
  { from: 'application',    allow: ['domain', 'application'] },
  { from: 'infrastructure', allow: ['domain', 'application', 'infrastructure'] },
]}],
'import/no-restricted-paths': ['error', { zones: [
  { target: './src/modules/*/domain',      from: './node_modules/@prisma', message: 'domain não conhece ORM' },
  { target: './src/modules/*/domain',      from: './node_modules/express', message: 'domain não conhece HTTP' },
  { target: './src/modules/!(platform)/**', from: './src/modules/*/domain', except: ['./public-api.ts'] },
]}],
```

## 6. Testes não funcionais

| Tipo | Como | Critério |
| --- | --- | --- |
| Carga | k6 nos endpoints de agenda, busca de paciente e dashboard | p95 < 400 ms com 50 req/s e 500 tenants seedados |
| Volume | Seed de 50k pacientes e 500k agendamentos em um tenant | Busca < 300 ms; agenda do dia < 1 s |
| Concorrência | 20 requisições simultâneas no mesmo slot | Exatamente 1 sucesso |
| Segurança | OWASP ASVS nível 1 como checklist; ZAP baseline no CI | Zero achado alto |
| Acessibilidade | axe-core no Playwright nas telas principais | Zero violação crítica |
| Resiliência | Derrubar Redis/provedor WhatsApp em staging | App continua agendando; mensagens acumulam na fila |
| Migração | Rodar migrações contra dump de staging | Sem downtime e sem perda |

## 7. Definition of Done (por história)

- [ ] Critérios de aceite atendidos e demonstráveis
- [ ] Testes: unidade (domínio/use case) + integração quando toca banco + e2e se é fluxo crítico
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm arch:check`, `pnpm test` verdes localmente e no CI
- [ ] Migração incluída e reversível/compatível para frente
- [ ] RLS verificada para tabelas novas
- [ ] Permissões definidas e testadas por papel
- [ ] Auditoria emitida para ação sensível
- [ ] Contrato de API documentado (OpenAPI atualizado automaticamente)
- [ ] Log/métrica relevante adicionada
- [ ] Texto de UI em pt-BR revisado (sem jargão técnico para o usuário)
- [ ] Documentação em `docs/` atualizada se houve decisão nova (ou ADR criado)
- [ ] Revisado por outra pessoa em PR

## 8. Processo de revisão de código

Foco da revisão, em ordem: **corretude do domínio** → **isolamento de tenant** → **segurança/permissão** → **testes** → **legibilidade** → estilo (que já é automatizado, então nunca deve consumir revisão humana).

Perguntas obrigatórias em toda revisão:

1. Essa regra está no domínio ou vazou para controller/repositório?
2. Toda query respeita o contexto de tenant?
3. O que acontece se esse job rodar duas vezes?
4. Um usuário do papel errado consegue chamar isso?
5. Dado clínico pode ser perdido ou sobrescrito por esse caminho?
6. Isso quebra contrato de API existente?
