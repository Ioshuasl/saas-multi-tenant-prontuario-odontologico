# RF — Relatórios e Indicadores (E9)

**Módulo:** `reporting` · **Detalhe:** [modulos/09-relatorios.md](../../modulos/09-relatorios.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E9-01 | Painel inicial exibe agenda do dia, a receber/recebido do dia, faltas do mês e produção do mês | Must | US-9.1, J8 |
| RF-E9-02 | Cada indicador do painel permite drill-down para a lista de origem | Must | módulo reporting |
| RF-E9-03 | Relatório de faltas/cancelamentos por período e profissional | Must | US-9.2 |
| RF-E9-04 | Relatório de receita/faturamento por período (com agrupamento dia/mês/profissional quando aplicável) | Must | US-9.2 |
| RF-E9-05 | Relatório de inadimplência (aging) | Must | US-9.2, US-7.5 |
| RF-E9-06 | Relatório de procedimentos executados no período | Must | US-9.2 |
| RF-E9-07 | Relatório de produção por profissional | Must | US-9.2, US-7.6 |
| RF-E9-08 | Relatório de fluxo de caixa (regime caixa ou competência) | Must | US-7.4 |
| RF-E9-09 | Relatório de conversão de orçamentos (enviados / aprovados / rejeitados / expirados) | Should | módulo reporting |
| RF-E9-10 | Relatório de novos pacientes e origem | Should | módulo reporting |
| RF-E9-11 | Relatório de ocupação da agenda | Should | módulo reporting |
| RF-E9-12 | Relatório de consumo de mensagens WhatsApp | Should | E8 + E9 |
| RF-E9-13 | Exportação CSV/Excel dos relatórios listados (assíncrona para volumes grandes) | Must | US-9.3 |
| RF-E9-14 | Dentista vê apenas própria produção/agenda; não vê faturamento consolidado | Must | permissões |
| RF-E9-15 | Relatórios respeitam RLS/tenant; nunca misturam dados de clínicas | Must | RNF-SEC, A5 |
| RF-E9-16 | Consultas de relatório exigem período limitado (default 90 dias; máximo configurado) | Must | módulo reporting |

## Critérios de aceite transversais (E9)

- Módulo somente leitura — não altera domínio operacional.
- Exportação auditada (`REPORT_EXPORTED`).
- CSV UTF-8 com BOM e separador `;` (Excel pt-BR).
- Soma do faturamento confere com soma dos pagamentos do período.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E9-17 | Metas e dashboard analítico avançado | Could (fase 2) |
| RF-E9-18 | Benchmark anonimizado entre clínicas (opt-in) | Could (fase 2+) |
| RF-E9-19 | Data warehouse / BI externo | Won't (MVP) |
