# Requisitos — SaaS Odontológico Multi-Tenant

Catálogo de **requisitos funcionais (RF)** e **não funcionais (RNF)** do MVP, derivado do escopo e dos documentos de planejamento.

## Escopo desta pasta

| Inclui | Não inclui |
| --- | --- |
| O que o sistema deve fazer (RF) e com que qualidade (RNF) no MVP | Detalhe de domínio/API (ver `docs/modulos/`, `08-api-v1.md`) |
| Prioridade, rastreabilidade e critérios de aceite | Decisões de stack (ver ADRs e `05-arquitetura.md`) |
| Itens explicitamente fora do MVP (marcados Fase 2/3) | Backlog de implementação sprint a sprint |

**Fonte normativa:** [04 — Escopo do MVP](../04-escopo-mvp.md), [03 — Personas e Jornadas](../03-personas-jornadas.md), módulos em `docs/modulos/`, [10 — Segurança/LGPD](../10-seguranca-lgpd-compliance.md), [11 — Infra](../11-infra-devops.md), [12 — Qualidade](../12-qualidade-testes.md).

## Convenções

| Campo | Significado |
| --- | --- |
| **ID** | `RF-<ÉPICO>-<NN>` ou `RNF-<CATEGORIA>-<NN>` — estável; não reutilizar IDs removidos |
| **Prioridade** | `Must` = obrigatório no MVP · `Should` = desejável no MVP se couber · `Could` = fase 2+ · `Won't` = fora de escopo |
| **Rastreabilidade** | User story (`US-x.y`), jornada (`Jx`), módulo ou ADR |
| **Status** | `Planejado` (padrão) · `Em implementação` · `Atendido` · `Adiado` |

Prioridade segue MoSCoW alinhada ao [escopo do MVP](../04-escopo-mvp.md). Itens Fase 2/3 aparecem com prioridade `Could`/`Won't` apenas para rastreio, sem compromisso de entrega no MVP.

## Índice — Requisitos funcionais

| Arquivo | Épico | Módulo |
| --- | --- | --- |
| [01 — Identidade e acesso](./funcionais/01-identidade-acesso.md) | E1 | `identity` |
| [02 — Clínica e cadastros](./funcionais/02-clinica-cadastros.md) | E2 | `clinic` |
| [03 — Pacientes](./funcionais/03-pacientes.md) | E3 | `patients` |
| [04 — Agenda](./funcionais/04-agenda.md) | E4 | `scheduling` |
| [05 — Prontuário clínico](./funcionais/05-prontuario.md) | E5 | `clinical-records` |
| [06 — Orçamentos e tratamentos](./funcionais/06-orcamentos-tratamentos.md) | E6 | `treatments` |
| [07 — Financeiro](./funcionais/07-financeiro.md) | E7 | `billing` |
| [08 — WhatsApp e comunicação](./funcionais/08-whatsapp-comunicacao.md) | E8 | `messaging` |
| [09 — Relatórios](./funcionais/09-relatorios.md) | E9 | `reporting` |
| [10 — Billing SaaS](./funcionais/10-billing-saas.md) | E10 | `subscription` |
| [11 — Plataforma e LGPD](./funcionais/11-plataforma-lgpd.md) | E11 | `platform` |

## Índice — Requisitos não funcionais

| Arquivo | Categorias |
| --- | --- |
| [Requisitos não funcionais](./nao-funcionais/requisitos-nao-funcionais.md) | Desempenho, disponibilidade, escala, segurança, privacidade, usabilidade, acessibilidade, i18n, compatibilidade, observabilidade, backup/DR, manutenibilidade |
| [Checklist OWASP / API Security](./nao-funcionais/RNF-seguranca-owasp.md) | OWASP Top 10, API Top 10, envelope crypto, anomalias |

Baseline operacional: [17 — Segurança Enterprise](../17-seguranca-baseline.md) · [ADR-0007](../adr/0007-criptografia-envelope-tenant.md) · [10 — LGPD](../10-seguranca-lgpd-compliance.md).

## Como usar

1. Antes de implementar um épico, leia o RF correspondente + o módulo em `docs/modulos/`.
2. Critérios de aceite aqui são o contrato de produto; detalhes de endpoint ficam em [08 — API v1](../08-api-v1.md).
3. RNFs aplicam-se a **todos** os RF, salvo indicação contrária.
4. Mudança de escopo: atualizar o RF/RNF **e** o [04 — Escopo](../04-escopo-mvp.md) (ou criar ADR se for decisão técnica).

## Critério de “MVP pronto” (produto)

Uma clínica-piloto opera **um mês inteiro** exclusivamente no sistema (sem planilha paralela) e o dono fecha o mês pelo fluxo de caixa — ver [04 §1](../04-escopo-mvp.md).
