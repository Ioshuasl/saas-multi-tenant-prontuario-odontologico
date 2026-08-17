# 13 — Roadmap e Estimativas

## 1. Premissas das estimativas

- Time de referência: **2 desenvolvedores full-stack** (ou 1 dev + apoio de IA em ritmo equivalente), com o proprietário do produto disponível para decisões rápidas.
- Sprint de 2 semanas; velocidade assumida de ~30–40 pontos por sprint depois da Sprint 0.
- Estimativas em **pontos** (Fibonacci) conforme o [Escopo do MVP](./04-escopo-mvp.md) e em **sprints** — não em datas de calendário, que devem ser fixadas ao iniciar o desenvolvimento.
- Riscos externos (sessão WAHA/QR, contratação de provedores, revisão jurídica) correm em paralelo e são a principal fonte de atraso — estão marcados como dependências externas.

## 2. Fase 1 — MVP

| Sprint | Objetivo | Épicos | Pontos | Entregável verificável |
| --- | --- | --- | --- | --- |
| **S0** | Fundação técnica + segurança | E11 (parcial) | ~30 | Monorepo, Docker Compose, Prisma + primeira migração com RLS, CI verde (incl. gitleaks/audit), Express com `/health` + middlewares de segurança esqueleto, Next.js com layout e login mockado, testes de arquitetura; fundação de segurança: secrets/env Zod, esqueleto `audit_log`, port `KeyManagementPort` + desenho `tenant_crypto_key` (ver [doc 17](./17-seguranca-baseline.md) §12 e [ADR-0007](./adr/0007-criptografia-envelope-tenant.md)) |
| **S1** | Identidade e clínica | E1, E2 | ~40 | Signup cria tenant; login/refresh; convite de usuário; papéis; dados da clínica; horários; catálogo de procedimentos |
| **S2** | Pacientes e agenda interna | E3, E4a | ~45 | Cadastro/busca de pacientes; agenda dia/semana com status, drag & drop, bloqueios, prevenção de conflito no banco |
| **S3** | Canal com o paciente | E4b, E8a | ~45 | Link público de autoagendamento com OTP; fila de espera + reencaixe; conexão WhatsApp; confirmação D-1 e lembrete H-3; webhook de botão |
| **S4** | Prontuário | E5 | ~50 | Anamnese (com link para o paciente), alertas clínicos, odontograma, evolução append-only assinada, anexos |
| **S5** | Orçamento → tratamento | E6 | ~40 | Orçamento com PDF e envio, aprovação (inclusive parcial) gerando plano de tratamento e parcelas, execução de item no atendimento |
| **S6** | Financeiro | E7 | ~45 | AR/AP, baixa e estorno, caixa diário, fluxo de caixa, inadimplência, produção por profissional |
| **S7** | Inbox, relatórios e cobrança do SaaS | E8b, E9, E10 | ~45 | Caixa de entrada WhatsApp compartilhada; dashboard e relatórios com exportação; trial, planos e limites |
| **S8** | Endurecimento e piloto | E11 (restante) | ~35 | Auditoria consultável, exportação LGPD, testes de carga, correções do piloto, documentação de suporte |

**Total estimado do MVP: ~375 pontos ≈ 9 sprints ≈ 18 semanas de calendário** com o time de referência. Em ritmo de sessões de IA com escopo bem definido por módulo, o mesmo conteúdo tende a caber em **6–9 blocos de trabalho por módulo** — o gargalo real passa a ser decisão de produto e validação com clínica-piloto, não digitação de código.

### Marcos de validação dentro da fase 1

| Marco | Quando | Critério de saída |
| --- | --- | --- |
| **M1 — Agenda usável** | Fim da S2 | Recepcionista real agenda um dia inteiro sem treinamento formal |
| **M2 — Faltas atacadas** | Fim da S3 | Confirmação por WhatsApp funcionando ponta a ponta com número real |
| **M3 — Papel eliminado (uso interno)** | Fim da S4 | Dentista registra 10 atendimentos consecutivos só no sistema |
| **M4 — Ciclo financeiro fechado** | Fim da S6 | Orçamento aprovado gera parcelas e o recebimento aparece no fluxo de caixa (**demo local 2026-08-17**; uso real em piloto = M5/S8) |
| **M5 — Piloto pago** | Fim da S8 | 1–3 clínicas operando o mês inteiro; NPS coletado; lista de bloqueios zerada |

## 3. Fase 2 — MVP+ (pós-piloto, ~4–6 sprints)

Ordem por valor comercial percebido, com base no [benchmark](./02-benchmark-mercado.md):

| Prioridade | Item | Pontos | Por quê agora |
| --- | --- | --- | --- |
| 1 | **Importador de dados** (CSV + mapeamento por origem) | 30 | Maior bloqueio de venda: clínica não migra sem trazer o histórico |
| 2 | **Régua de cobrança automática** | 20 | Receita direta para o cliente; usa infraestrutura de mensagens já pronta |
| 3 | **Contratos, termos e assinatura eletrônica do paciente** | 30 | Fecha o ciclo do orçamento e é exigência recorrente |
| 4 | **Assinatura digital com certificado (A1/A3) + requisitos NGS2** | 40 | Só então podemos comunicar "elimine o papel" ([doc 10](./10-seguranca-lgpd-compliance.md)) |
| 5 | **Receituário, atestado e pedido de exame** | 20 | Uso diário do dentista |
| 6 | **Comissionamento automático** | 25 | Dor de clínicas com associados |
| 7 | **CRM de orçamentos não aprovados + funil** | 25 | Conversão de receita parada |
| 8 | **Multi-unidade na interface + consolidação** | 25 | Abre o segmento de redes (modelo de dados já pronto) |
| 9 | **Central de retorno / recall** | 15 | Receita recorrente para a clínica |
| 10 | **Pesquisa de satisfação (NPS)** | 10 | Barato, gera prova social |
| 11 | **Estoque e controle protético** | 25 | Pedido frequente de clínicas maiores |
| 12 | **Convênios com tabela de preço própria** | 30 | Necessário para parte do mercado |
| 13 | **MFA (TOTP) e endurecimento de segurança** | 15 | Pré-requisito para clientes maiores |
| 14 | **Metas e dashboard analítico** | 25 | Retenção do dono |

## 4. Fase 3 — Escala e diferenciação (roadmap aberto)

| Tema | Itens |
| --- | --- |
| Financeiro completo | NFS-e, Pix cobrança, boleto, link de pagamento, maquininha, conciliação automática |
| Mobilidade | App do dentista e do paciente (React Native), notificações push |
| IA | Transcrição de evolução por voz, sugestão de texto clínico, agente de triagem no WhatsApp, previsão de no-show |
| Especialidades | Ortodontia/alinhadores, HOF/faceograma, fichas por especialidade, periodontia |
| Imagem | Integração com câmera intraoral e RX, visualizador DICOM |
| Crescimento | Site da clínica, campanhas de marketing, programa de indicações |
| Enterprise | SSO, API pública com webhooks, instância dedicada, contrato com SLA |
| Interoperabilidade | TISS/convênios, integração contábil, RNDS (a avaliar) |

## 5. Dependências externas (rodar em paralelo desde a S1)

| Dependência | Prazo típico | Ação antecipada |
| --- | --- | --- |
| Instância WAHA (GOWS) na VPS + número de teste para QR | horas a 1 dia | Já em `waha.ioshuavps.com.br`; conferir engine GOWS antes do código ([migracao-waha.md](./desenvolvimento/migracao-waha.md)) |
| Textos de automação (não há aprovação Meta) | contínuo | Revisar copy pt-BR; botões GOWS na implementação |
| Revisão jurídica (Termos, Política, DPA) + cláusula de risco WhatsApp não oficial | 2–4 semanas | Contratar na S3 para estar pronto na S8; checkbox de ciência no app |
| Provedor de assinatura digital (fase 2) | negociação + integração | Levantar opções durante o MVP |
| Clínica-piloto | recrutamento | Definir na S2; envolver no design das telas de agenda e atendimento |
| CNPJ/meios de recebimento da própria assinatura | semanas | Necessário antes do M5 |

## 6. Riscos e planos de contingência

| # | Risco | Prob. | Impacto | Mitigação / contingência |
| --- | --- | --- | --- | --- |
| R1 | Sessão WAHA cai / número banido / QR não fecha e trava M2 | Alta | Alto | Número dedicado + checkbox; fallback e-mail e link de confirmação; recurso não bloqueia o resto do MVP; alerta na UI |
| R2 | Escopo do prontuário inflar (cada especialidade quer campo próprio) | Alta | Alto | Anamnese e fichas configuráveis por JSON schema; especialidades ficam para a fase 3; dizer "não" no MVP |
| R3 | Erro de fuso horário na agenda | Média | Alto | UTC no banco, timezone por tenant, testes com DST, revisão obrigatória em PR que toca data |
| R4 | Vazamento entre tenants | Baixa | Crítico | RLS + testes automatizados de isolamento no CI + 404 em vez de 403 |
| R5 | Perda/corrupção de dado clínico | Baixa | Crítico | Append-only + hash + PITR + restauração ensaiada |
| R6 | Custo de infra WhatsApp (RAM/sessão, suporte a QR) ou ban em massa | Média | Médio | GOWS (sem Chromium); uma sessão por tenant; kill switch; não vender campanha fria |
| R7 | Migração de dados do sistema atual inviabilizar vendas | Alta | Alto | Importador na prioridade 1 da fase 2; oferecer migração assistida no piloto |
| R8 | Concorrência de preço agressiva | Média | Médio | Não competir só em preço: diferenciais D1–D7 do [doc 01](./01-visao-produto.md) |
| R9 | Performance da agenda com clínica grande | Média | Médio | Índices `(tenant_id, …)`, virtualização, teste de volume desde a S2 |
| R10 | Afirmação indevida de conformidade (papel eliminado) | Média | Alto | Regra explícita no [doc 10](./10-seguranca-lgpd-compliance.md); revisão de todo material de marketing |
| R11 | Time pequeno com bus factor 1 | Alta | Médio | Documentação viva em `docs/`, ADRs, código com fronteiras claras, sem "área secreta" |
| R12 | Piloto não engajar (clínica volta para o papel) | Média | Alto | Acompanhamento semanal, sucesso medido por uso real, ajuste rápido de UX da agenda/atendimento |

## 7. Ordem de decisões técnicas pendentes (a fechar na Sprint 0)

**Fechadas**

1. ~~Provedor de hospedagem~~ → **VPS Hostinger** + anexos **AWS S3** ([ADR-0008](./adr/0008-hospedagem-vps-hostinger-s3.md)).
2. ~~Topologia / região~~ → Postgres + Redis **na mesma VPS**; S3 em **`sa-east-1`**.
3. ~~Object storage S3 vs R2~~ → **S3** (ADR-0008); cotas GB por plano ainda a definir no produto.
4. ~~E-mail transacional~~ → **Resend** ([ADR-0009](./adr/0009-email-resend.md)); Mailpit no local.
5. ~~Gateway de cobrança SaaS~~ → **manual no MVP**; candidatos futuros: **Stripe**, **Mercado Pago**, **Asaas** ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)).
6. ~~UUID v7~~ → gerado na **aplicação** ([ADR-0011](./adr/0011-uuid-v7-aplicacao.md)).
7. ~~Observabilidade~~ → **Sentry + logs na VPS** agora; self-hosted na VPS como intenção futura ([ADR-0012](./adr/0012-observabilidade-sentry-logs.md)).
8. ~~KMS / segredos~~ → **KEK + secrets locais na VPS** agora; intenção **Vault self-hosted** ([ADR-0013](./adr/0013-kms-local-vps.md)).
9. ~~Domínio / TLS / deploy~~ → **EasyPanel** na VPS; HTTPS pelo EasyPanel; **domínio app + domínio api** (flexíveis); Dockerfile (+ Nginx se preciso) ([ADR-0014](./adr/0014-deploy-easypanel-dominios.md)).
10. ~~Formato ciphertext / `tenant_crypto_key`~~ → blob Base64 `v1|nonce|ct|tag` + tabela em [docs/07 §14](./07-modelo-de-dados.md#14-envelope-encryption--tenant_crypto_key-e-formato-de-ciphertext); explicação leiga em [docs/17 §3.2](./17-seguranca-baseline.md).
11. ~~WhatsApp provedor~~ → **WAHA GOWS** default ([ADR-0016](./adr/0016-waha-default-messaging.md)); Cloud API opcional por env ([ADR-0005](./adr/0005-whatsapp-cloud-api.md) supersedido).

Cada decisão fechada gera um ADR em `docs/adr/` (ou atualiza o ADR existente).

## 8. Como medir se o MVP deu certo

Metas de saída do piloto (3 meses após M5):

| Métrica | Meta |
| --- | --- |
| Clínicas ativas pagantes | ≥ 5 |
| Retenção mensal de tenants | ≥ 95% |
| Redução de no-show nas clínicas-piloto | ≥ 20% relativo ao mês anterior à adoção |
| Atendimentos com evolução registrada no mesmo dia | ≥ 90% |
| Uso da agenda como fonte única (sem planilha paralela) | 100% das clínicas-piloto |
| p95 de latência da agenda | < 400 ms |
| Incidentes S1 | 0 |
| NPS do piloto | ≥ 50 |

Detalhamento em [Métricas e KPIs](./14-metricas-kpis.md).
