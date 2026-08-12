# Tokens e kit visual

**Status:** **v1 — Notion-like neutro** (preto, branco, cinza). Referências: [Notion design tokens](https://designmd.cc/benchmarks/notion), [Open Design Notion DS](https://open-design.ai/plugins/design-system-notion/).

Não ler monólito; detalhe de telas nos outros shards.

## 1. Princípios (Notion-like)

| Princípio | Aplicação |
|---|---|
| **Monocromático** | UI chrome em preto/branco/cinza; cor só para status de domínio e `destructive` |
| **Texto quente-escuro** | `#37352F` (Notion ink) — lê como preto, menos fadiga que `#000` puro |
| **Superfícies em camadas** | `#FFFFFF` → `#FAFAFA` → `#F5F5F5` (hover/active) |
| **Bordas sutis** | 1px `#E5E5E5` ou `rgba(55,53,47,0.09)` — nunca pesado |
| **Primary = ink** | CTA principal preto/cinza-escuro + texto branco (não azul/teal) |
| **Espaço generoso** | Padding amplo; hierarquia por tipografia, não por cor |
| **A11y** | Contraste ≥ 4.5:1 (ui-ux-pro-max P1); status sempre ícone + texto |

## 2. Cores semânticas (light)

| Token | Valor | Uso |
|---|---|---|
| `background` | `#FFFFFF` | Fundo da página |
| `foreground` | `#37352F` | Texto principal (Notion ink) |
| `card` | `#FFFFFF` | Card elevado sobre fundo |
| `primary` | `#37352F` | CTA principal (ink) |
| `primary-hover` | `#2F2D28` | Hover do primary |
| `primary-foreground` | `#FFFFFF` | Texto em primary |
| `secondary` | `#F5F5F5` | Botão secundário / chip |
| `secondary-foreground` | `#37352F` | Texto em secondary |
| `muted` | `#FAFAFA` | Header tabela, sidebar, skeleton |
| `muted-foreground` | `#787774` | Descrições, labels secundários |
| `accent` | `#F5F5F5` | Hover de linha / item selecionado |
| `accent-foreground` | `#37352F` | Texto sobre accent |
| `border` / `input` | `#E5E5E5` | Bordas e inputs |
| `ring` | `#A3A3A3` | Focus ring (cinza médio) |
| `destructive` | `#E03E3E` | Exclusão / erro (único vermelho semântico) |

### Shell admin (sidebar Notion-like)

| Token | Valor | Uso |
|---|---|---|
| `sidebar` | `#FAFAFA` | Fundo sidebar (off-white neutro) |
| `sidebar-foreground` | `#787774` | Nav inativo |
| `sidebar-primary` | `#37352F` | Item ativo / ícone selecionado |
| `sidebar-primary-foreground` | `#FFFFFF` | — |
| `sidebar-accent` | `#F0F0F0` | Hover item |
| `sidebar-accent-foreground` | `#37352F` | Texto hover/ativo |
| `sidebar-border` | `#E5E5E5` | Divisor |

### Status da agenda (domínio — única exceção cromática)

| Status | Cor | Uso na UI |
|---|---|---|
| Solicitado | `#A3A3A3` | tracejado + label |
| Agendado | `#3B82F6` | azul |
| Confirmado | `#16A34A` | verde |
| Atendendo | `#9333EA` | roxo |
| Atendido | `#15803D` | verde escuro |
| Faltou | `#E03E3E` | vermelho |
| Cancelado | `#787774` | riscado |

Nunca comunicar status **só** por cor (ícone + texto).

### Mockups de referência

| Tela | Arquivo |
|---|---|
| Admin — Configurações da clínica | `assets/odonto-notion-admin-mockup.png` |
| Público — Login | `assets/odonto-notion-login-mockup.png` |

## 3. Tipografia

- Família: **Geist** (sans) — legível, neutra, alinhada a produtividade
- Page title: ~32 / 600, cor `foreground`
- Section title: ~20 / 600
- Body: 15px / 400, line-height 1.5–1.6
- Label: 13px / 500
- Meta / caption: 12px / 400, cor `muted-foreground`

## 4. Radius e sombra

| Token | px | Uso |
|---|---|---|
| `radius-sm` | 4 | Badge, tag |
| `radius-md` | 6 | Button, Input (Notion ~3–6px) |
| `radius-lg` | 8 | Card interno |
| `radius-xl` | 12 | Dialog |

Sombras: evitar; preferir borda `border`. Se necessário: `0 1px 3px rgba(0,0,0,0.04)`.

## 5. Kit base (shadcn em `frontend/src/shared/ui`)

| Componente | Spec |
|---|---|
| Button primary | `bg-primary text-primary-foreground`, h ~36–40, radius-md |
| Button outline | borda `border`, fundo branco, texto `foreground` |
| Button ghost | hover `accent` |
| Input | borda `border`, placeholder `muted-foreground`, focus `ring` |
| Card | fundo `card`, borda `border`, radius-lg, padding 24 |

Hierarquia: **1** CTA primary (ink) por viewport; secundárias outline/ghost; destrutivas `destructive`.

## 6. Onde vive o DS no código

- Tokens CSS: `frontend/src/app/globals.css`
- Componentes: `frontend/src/shared/ui/`
- Layout shell: `frontend/src/shared/layout/`
- Domínio: `packages/<area>/components/<Entidade>/`
