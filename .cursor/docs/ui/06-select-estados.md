# Select, lookups e estados

Norma: `docs/16` · rule `frontend-component-select`.

## 1. Select de domínio

Arquivo: `components/Patient/PatientSelect.tsx` (ou `ProfessionalSelect`, `ProcedureSelect`).

- Props em `types/<Entidade>/…SelectTypes.ts`
- Carrega via **List hook** (TanStack Query) — nunca Data/API no Select
- Integra com `FormField` / `field` do RHF

```tsx
<PatientSelect field={field} disabled={false} />
```

## 2. Select vs SelectObject

| Tipo | Quando | Valor |
|---|---|---|
| `Select` | lista simples | id / enum escalar |
| `SelectObject` / lookup rico | precisa do objeto (ex.: paciente com telefone) | objeto ou id + label rica |
| Modal + tabela | busca avançada (CPF, telefone) | callback de seleção |

## 3. Lookups do produto

| Caso | Padrão |
|---|---|
| Paciente no agendamento | Combobox busca nome/CPF/telefone (`docs/03` J2) |
| Procedimento no orçamento | Select com preço/duração |
| Profissional / cadeira | Select filtrado por unidade |
| Dente / face (FDI) | controle odontológico dedicado (`shared/helpers/dental`) |

## 4. Estados de UI (qualquer lista/select)

| Estado | UI |
|---|---|
| Loading | Skeleton / “Carregando…” |
| Empty | Orientação + CTA se fizer sentido |
| Error | Tentar novamente |
| Disabled | Opacidade + sem interação |
| Sem permissão | Não mostrar ação (servidor revalida) |

## 5. Empty states (copy)

- Pacientes: “Nenhum paciente encontrado. Cadastre o primeiro para agendar.”
- Agenda do dia: “Nenhuma consulta neste dia.”
- Fila de espera: “Fila vazia.”
