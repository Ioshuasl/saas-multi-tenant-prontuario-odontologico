# ADR-0003 — Versionamento da API por prefixo de URL

- **Status:** Aceito
- **Data:** 2026-08-11

## Contexto

A API é consumida pelo nosso frontend web e, no futuro, por aplicativos móveis, integrações de clientes e parceiros. Cliente móvel não atualiza no mesmo instante do backend, e integração de terceiro não atualiza nunca sem aviso. Precisamos de uma estratégia de versionamento explícita antes do primeiro cliente, não depois.

Alternativas: prefixo de URL (`/api/v1`), cabeçalho customizado (`X-API-Version`), negociação por `Accept` (`application/vnd.app.v1+json`) ou parâmetro de query.

## Decisão

**Versionamento por prefixo de URL: `/api/v1/...`**, com as seguintes regras:

1. `v1` cobre toda a API pública desde o primeiro dia (nada de rota sem versão).
2. Mudanças **aditivas** não mudam a versão: novo endpoint, novo campo opcional na resposta, novo parâmetro opcional, novo valor de enum **em campo que o cliente já trata como aberto**.
3. Mudanças **incompatíveis** exigem `v2`: remover/renomear campo, mudar tipo, mudar semântica, tornar obrigatório o que era opcional, mudar código de erro estável.
4. Ao lançar `v2`, `v1` é mantida por no mínimo **6 meses**, com `Deprecation` e `Sunset` nos cabeçalhos e aviso em `meta.warnings`.
5. A versão vive na **camada de interface**: controllers e DTOs por versão; use cases e domínio são compartilhados. Se `v2` precisa de comportamento diferente, é o adapter da `v2` que traduz — nunca um `if (version === 2)` dentro do domínio.
6. Rotas experimentais/internas ficam em `/api/v1/internal/*`, sem garantia de estabilidade, e não entram no OpenAPI público.
7. Webhooks de saída (fase 2) têm versionamento próprio no payload (`"version": "1"`).
8. O contrato é gerado do código (Zod → OpenAPI) e verificado no CI: diff incompatível sem bump de versão **falha o build**.

```
apps/api/src/
├── http/
│   ├── v1/
│   │   ├── router.ts
│   │   └── <modulo>/{controller,dto}.ts
│   └── v2/            # criado só quando necessário
└── modules/…          # domínio e use cases sem noção de versão
```

## Consequências

**Positivas**

- Explícito e visível: dá para ler no log, no navegador e no cURL qual versão foi usada.
- Trivial de rotear (proxy, CDN, load balancer) e de documentar.
- Convenção dominante no mercado — nenhum integrador precisa aprender nada novo.
- Permite rodar `v1` e `v2` no mesmo processo sem duplicar regra de negócio.

**Negativas / custos aceitos**

- Puristas de REST argumentam que a URI deveria identificar apenas o recurso, não a representação. Aceitamos o desvio: clareza operacional vale mais que pureza.
- Duplicação de controllers/DTOs quando `v2` existir. Mitigado por herança/composição de mappers e pelo fato de o domínio não duplicar.
- Risco de proliferação de versões. Mitigado pela regra: **no máximo duas versões ativas**; nova versão exige justificativa escrita e plano de descontinuação da anterior.

## Alternativas rejeitadas

**Cabeçalho customizado (`X-API-Version`):** invisível em log de acesso e em teste manual; fácil de esquecer no cliente; cache intermediário pode ignorar.

**`Accept` com media type versionado:** tecnicamente o mais correto, porém verboso, mais difícil de depurar e de explicar a integradores pequenos (o perfil dos nossos futuros parceiros).

**Query param (`?version=1`):** polui a URL, interage mal com cache e é fácil de omitir por acidente (qual é o default?).

**Não versionar (evoluir sempre de forma compatível):** funciona só enquanto o único cliente é o nosso frontend; quebra no primeiro app móvel em produção com versão antiga instalada.

## Verificação

- CI compara o OpenAPI gerado com o baseline versionado no repositório; mudança incompatível sem bump falha.
- Teste de contrato por endpoint (Supertest) garante formato de envelope, códigos de erro e paginação.
- Nenhuma rota registrada fora de um router versionado (teste que inspeciona a árvore de rotas do Express).

## Referências

- [docs/08-api-v1.md](../08-api-v1.md)
- RFC 8594 (`Sunset` header); RFC 9745 (`Deprecation` header)
