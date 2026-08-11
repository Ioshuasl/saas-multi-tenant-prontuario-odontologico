# ADR-0012 — Observabilidade: Sentry + logs na VPS agora; self-hosted depois

- **Status:** Aceito
- **Data:** 2026-08-11

## Contexto

Precisamos de logs estruturados, captura de erros e alertas básicos no MVP, rodando em VPS Hostinger. Opções: híbrida (SaaS de erros + logs locais), tudo self-hosted na VPS, ou só arquivo.

## Decisão

1. **Agora (MVP):**
   - **Logs:** Pino (JSON) com `requestId` / `tenantId` / `userId` → stdout/arquivo na VPS, com rotação; **sem** dado clínico no log.
   - **Erros:** **Sentry** (cloud), com scrubbing/redaction de PII e conteúdo clínico.
   - **Métricas:** mínimas no MVP (health, idade de fila, contadores simples); Prometheus/Grafana completo não é obrigatório nesta fase.
   - **Tracing (OpenTelemetry):** fase 2, como já previsto nos RNF.
2. **Futuro (intenção de produto):** migrar a pilha de observabilidade para **self-hosted na VPS** (ex.: GlitchTip ou Sentry self-host, Loki/Grafana, Prometheus), reduzindo dependência de SaaS.
3. Instrumentação atrás de ports/adapters (`ErrorReporter`, logger) para trocar Sentry por backend self-hosted **sem** reescrever casos de uso.

## Consequências

**Positivas:** erros úteis desde o dia 1; pouca carga na VPS; caminho claro para self-host.

**Negativas:** Sentry processa eventos de erro (operador/subprocessador LGPD — listar no DPA); migração futura exige tempo de ops.

## Alternativa rejeitada (por ora)

**Self-hosted completo já no MVP:** rejeitado temporariamente para não competir RAM/disco com Postgres na mesma VPS; permanece o destino desejado.

## Verificação

- `SENTRY_DSN` opcional em env; app sobe sem DSN em local.
- Scrubbing testado (senha, token, conteúdo de evolução não vazam).
- Documentar no DPA o Sentry enquanto estiver em uso.

## Referências

- [docs/11-infra-devops.md](../11-infra-devops.md) §8
- [docs/17-seguranca-baseline.md](../17-seguranca-baseline.md)
- [ADR-0008 — VPS Hostinger](./0008-hospedagem-vps-hostinger-s3.md)
