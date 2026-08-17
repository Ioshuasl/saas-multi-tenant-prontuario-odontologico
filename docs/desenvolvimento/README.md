# Desenvolvimento — diário e progresso

Pasta **somente** para acompanhamento do desenvolvimento (scaffold, sprints, decisões pontuais de implementação). Não substitui a especificação em `docs/` (01–17, ADRs, requisitos, módulos).

## Como usar

| Arquivo / pasta | Uso |
| --- | --- |
| [PROGRESSO.md](./PROGRESSO.md) | Log cronológico do que foi feito (append-only) |
| [sprints/](./sprints/) | Notas por sprint (checklist, bloqueios, entregáveis) |
| [migracao-waha.md](./migracao-waha.md) | Plano Cloud API → WAHA (docs; código depois) |
| Este README | Índice e convenções |

## Convenções

1. Atualizar `PROGRESSO.md` ao fechar um bloco de trabalho (scaffold, feature, correção relevante).
2. Não duplicar RF/ADR aqui — linkar para `docs/…`.
3. Bloqueios e perguntas abertas ficam no log da sprint até resolvidos.
4. **Toda sprint** deve detalhar **Backend** e **Frontend** em seções separadas (o que entra, o que não entra, e em qual bloco). Se um lado não tiver entrega, escrever explicitamente “nenhuma tela / nenhum endpoint nesta sprint”.

## Status atual

- **Fase:** Sprint 7 — Inbox / relatórios / billing SaaS (E8b + E9 + E10) — **planejada** (checklist)
- **Anterior:** Sprint 6 — Financeiro (E7) — **fechada** (código + aceite local; M4 demo local)
- **Sprint 5:** Orçamento → tratamento (E6) — **fechada**
- **Sprint 4:** Prontuário (E5) — **código Must fechado** (M3 uso real pendente)
- **Código base:** Sprint 0 concluída (monorepo, CI, RLS, KeyManagementPort)
- **Especificação:** [`../README.md`](../README.md)
- **Checklist S7 (planejada):** [`sprints/S7-inbox-relatorios-billing-saas.md`](./sprints/S7-inbox-relatorios-billing-saas.md)
- **Checklist S6 (fechada):** [`sprints/S6-financeiro.md`](./sprints/S6-financeiro.md)
- **Checklist S5 (fechada):** [`sprints/S5-orcamentos-tratamentos.md`](./sprints/S5-orcamentos-tratamentos.md)
- **Checklist S4 (código Must):** [`sprints/S4-prontuario.md`](./sprints/S4-prontuario.md)
- **Checklist S3 (código Must):** [`sprints/S3-canal-paciente.md`](./sprints/S3-canal-paciente.md)
- **Checklist S2 (fechada):** [`sprints/S2-pacientes-agenda.md`](./sprints/S2-pacientes-agenda.md)
- **Checklist S1 (fechada):** [`sprints/S1-identidade-clinica.md`](./sprints/S1-identidade-clinica.md)
- **Checklist S0 (fechada):** [`sprints/S0-fundacao.md`](./sprints/S0-fundacao.md)
