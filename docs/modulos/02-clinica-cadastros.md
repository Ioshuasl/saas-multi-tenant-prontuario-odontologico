# Módulo — Clínica e Cadastros (`clinic`)

## 1. Responsabilidade

Guardar a configuração estrutural da clínica: identidade jurídica, unidades, cadeiras, profissionais (perfil clínico), horários de funcionamento e catálogo de procedimentos. É o módulo que define **o que a clínica oferece e quando pode atender** — insumo direto para agenda, orçamento e prontuário.

## 2. Agregados e invariantes

| Agregado | Invariantes |
| --- | --- |
| `Tenant` | `slug` único globalmente (link público), timezone válido (IANA), CNPJ/CPF válido quando informado |
| `Unit` | Exatamente uma unidade padrão por tenant; nome único por tenant |
| `Chair` | Pertence a uma unidade; nome único por unidade |
| `Professional` | Um por membership; CRO obrigatório para papel `DENTIST` antes de assinar evolução; cor única por unidade (para leitura da agenda) |
| `BusinessHours` | `ends_at > starts_at`; intervalos do mesmo dia/profissional não se sobrepõem |
| `Procedure` | `code` único por tenant; `default_minutes` entre 5 e 480; `price_cents ≥ 0` |

## 3. Regras de negócio relevantes

1. **Horário em cascata:** a disponibilidade de um profissional é a interseção entre o horário da unidade e o horário do profissional; exceções por data (`business_hours_exception`) sobrepõem ambos. Se o profissional não tem horário próprio cadastrado, herda o da unidade.
2. **Timezone é do tenant**, não do servidor nem do navegador. Toda conversão acontece na borda; o banco guarda UTC.
3. **Procedimento é versionado por uso, não por registro:** alterar o preço do catálogo **não** altera orçamentos já emitidos (o preço é copiado para `quote_item.unit_price_cents` no momento da emissão). Nunca recalcular histórico.
4. **Desativar em vez de excluir:** procedimento, cadeira e profissional com histórico só podem ser inativados (`active = false`), preservando integridade de relatórios.
5. **CRO obrigatório para assinar:** `clinical-records` recusa evolução de profissional sem CRO cadastrado (`BUSINESS_RULE_VIOLATION`), pois o registro precisa conter o número de inscrição.
6. **Slug do tenant** é imutável após o primeiro agendamento público (links já divulgados quebrariam); mudança exige suporte e cria redirecionamento.

## 4. Catálogo padrão de procedimentos (seed)

Semente aplicada no signup, editável pela clínica. Objetivo: a clínica orçar no primeiro dia sem cadastrar nada.

| Código | Procedimento | Especialidade | Min | Dente? |
| --- | --- | --- | :-: | :-: |
| `CONS-01` | Consulta de avaliação/diagnóstico | Clínica geral | 30 | não |
| `PROF-01` | Profilaxia + polimento | Prevenção | 40 | não |
| `RAD-01` | Radiografia periapical | Radiologia | 15 | sim |
| `RES-01` | Restauração em resina — 1 face | Dentística | 40 | sim |
| `RES-02` | Restauração em resina — 2 ou mais faces | Dentística | 60 | sim |
| `EXO-01` | Exodontia simples | Cirurgia | 40 | sim |
| `EXO-02` | Exodontia de terceiro molar | Cirurgia | 60 | sim |
| `END-01` | Tratamento endodôntico — unirradicular | Endodontia | 90 | sim |
| `END-02` | Tratamento endodôntico — multirradicular | Endodontia | 120 | sim |
| `PERI-01` | Raspagem supragengival | Periodontia | 45 | não |
| `PROT-01` | Coroa provisória | Prótese | 60 | sim |
| `PROT-02` | Coroa definitiva | Prótese | 60 | sim |
| `IMP-01` | Instalação de implante | Implantodontia | 90 | sim |
| `CLAR-01` | Clareamento em consultório | Estética | 60 | não |
| `ORTO-01` | Manutenção ortodôntica | Ortodontia | 30 | não |
| `URG-01` | Urgência/atendimento de dor | Clínica geral | 30 | não |

Preços ficam em zero no seed (a clínica define os seus) — sugerir preço seria irresponsável e regionalmente inválido.

## 5. Casos de uso

| Use case | Observações |
| --- | --- |
| `UpdateClinicProfileUseCase` | Valida CNPJ/CPF e timezone; audita alteração |
| `CreateUnitUseCase` | Verifica limite do plano; cria horários padrão |
| `SetBusinessHoursUseCase` | Substituição atômica da grade semanal; valida sobreposição; alerta se há agendamentos futuros fora do novo horário (não cancela nada automaticamente) |
| `AddBusinessHoursExceptionUseCase` | Feriado/férias; lista agendamentos afetados para decisão manual |
| `CreateProcedureUseCase` / `UpdateProcedureUseCase` | Código único; alteração de preço não retroage |
| `ImportProcedureCatalogUseCase` | Idempotente por código; não sobrescreve procedimento existente |
| `CreateProfessionalUseCase` | Vincula a um membership; valida CRO; atribui cor livre |
| `DeactivateProcedureUseCase` | Bloqueia se há itens de tratamento `PLANNED` referenciando (sugere substituição) |

## 6. API pública do módulo (consumida por outros módulos)

```ts
// modules/clinic/public-api.ts
export interface ClinicModuleApi {
  getTenantSettings(tenantId: TenantId): Promise<{ timezone: string; slug: string; name: string }>;
  getProcedure(tenantId: TenantId, procedureId: EntityId): Promise<ProcedureSummary | null>;
  getProfessional(tenantId: TenantId, professionalId: EntityId): Promise<ProfessionalSummary | null>;
  getWorkingWindows(input: {
    tenantId: TenantId; unitId: EntityId; professionalId?: EntityId; date: string;
  }): Promise<Array<{ startsAt: Date; endsAt: Date }>>;   // usado por scheduling
}
```

`scheduling` calcula disponibilidade a partir de `getWorkingWindows` — a regra de horário mora aqui, não lá.

## 7. Endpoints

Ver [API v1 §2.2](../08-api-v1.md#22-clínica-e-configurações-clinic).

## 8. Testes obrigatórios

- Interseção de horários (unidade × profissional × exceção) em cenários de almoço, meio período e feriado.
- Mudança de horário de verão / offset (agenda em datas com mudança de UTC offset).
- Preço alterado no catálogo não muda orçamento já emitido.
- Procedimento com item de tratamento planejado não pode ser desativado.
- Duas unidades padrão simultâneas são impossíveis (índice único).
- Evolução recusada para dentista sem CRO.
- `slug` duplicado entre tenants é rejeitado.
