# Cursor — Agentes (SaaS Odontológico)

Configura agents para `backend/` e `frontend/`.

**Fonte normativa do produto:** `docs/` (sobretudo `docs/16-estrutura-de-pastas.md`, `docs/05-arquitetura.md`, `docs/09-frontend.md`).

## Rules

| Arquivo | Escopo |
|---------|--------|
| `rules/project-core.mdc` | Sempre |
| `rules/product-decisions.mdc` | Sempre — dúvidas/decisões de produto em linguagem leiga |
| `rules/tester.mdc` | Suíte local (skill tester / `pnpm tester`) |
| `rules/sprint-orchestrator.mdc` | Sprint completa (blocos Must sequenciais + tester + commit/push) |
| `rules/backend.mdc` | `backend/**` |
| `rules/frontend.mdc` | `frontend/**` |
| `rules/backend-*.mdc` | Por camada + modules / workers / shared |
| `rules/frontend-*.mdc` | Por camada (types, enum, schema, data, service, hook, components, page, shared) |

## Skills

| Skill | Quando |
|-------|--------|
| `backend-orchestrator` | CRUD / casos de uso em `backend/` — checklist no **fim** |
| `frontend-orchestrator` | CRUD / telas em `frontend/` + 1 shard UI — checklist no **fim** |
| `shadcn` | CLI/registry shadcn: adicionar, buscar, corrigir ou estilizar primitivos em `shared/ui` |
| `ui-ux-pro-max` | Decisões visuais/UX amplas (paleta, tipografia, layout, a11y, motion) — telas novas ou review |
| `ui-ux-systems` | Cheat sheet UI do projeto (sem codar um tipo) |
| `ui-refactor` | Refator visual com 1 shard |
| `designer-ui` | Pencil: **1 frame** + `01-tokens-kit` (Design System Clivra) |
| `designer-ux` | Fluxo/tipo de tela (+ `02` ou `05` se preciso) |
| `pencil-tsx-recreate` | Recriar `.tsx` → `.pen` (tokens Clivra) |
| `git` | Branch e commit no **repo único** deste projeto |
| `tester` | Suíte local: Docker/stack, smokes, aceite curl, Playwright, localtunnel |
| `sprint-orchestrator` | Sprint Must completa: Tasks sequenciais BE/FE + tester + docs + commit/push |

## UI/UX (progressive disclosure)

| Arquivo | Uso |
|---------|-----|
| [`01-clivra-design-system.md`](../01-clivra-design-system.md) | Fonte oficial visual (raiz) |
| [`docs/ui/INDEX.md`](docs/ui/INDEX.md) | Matriz tarefa → shard |
| `docs/ui/0N-*.md` | Detalhe pontual (máx. 1–2 por turno) |

Identidade: **Clivra · Sora · Burgundy `#4A0F16` · viewport 1366×768**. Proibido Notion-like / Orius visual.

## Arquitetura

- **Sempre:** monólito modular + DDD + Clean Architecture + SOLID + código simples/direto (sem verbosidade)
- Backend: `Routes → Controller → Service → [Action?] → Repository` (+ `models/` / `types/` / `enum/`)
- `Action` **somente** quando há efeito além do repositório
- Frontend: `Page → Component → Hook (TanStack Query) → Service → Data → API`
- Tipagens em `types/`; enums em `enum/` — **sem pasta `interfaces/`**
- Ops CRUD: `list` / `get` / `create` / `update` / `delete`
- Classes curtas (`CreateService`); arquivo backend `snake_case`; frontend `PascalCase`

Padrões bloqueantes: `project-core.mdc` + rules da camada + `docs/16`.
