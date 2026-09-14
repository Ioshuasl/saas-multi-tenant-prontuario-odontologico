# Clivra — Design System (fonte normativa de marca)

> Gerado na Onda 1 da migração UI. **Paleta e tipografia oficiais têm prioridade** sobre sugestões genéricas da skill ui-ux-pro-max.

## Produto

- **Nome:** Clivra
- **Tagline:** Clínicas odontológicas mais eficientes
- **Stack UI:** Next.js · Tailwind · shadcn/ui (Base UI)
- **Assets:** `frontend/public/brand/` (`logo-icon.png`, refs de protótipo)

## Cores oficiais

| Token | Hex | Uso |
|-------|-----|-----|
| Bordô Principal | `#4A0F16` | Sidebar, primary (claro), âncora de marca |
| Bordô Secundário | `#7A2B36` | Active nav, primary (escuro), accents/CTA |
| Neutro | `#EAE6E1` | Fundo claro (workspace) |
| Texto | `#1A1A1A` | Tipografia no tema claro |

### Tema claro

- background = Neutro `#EAE6E1`
- card = `#FFFFFF`
- primary = `#4A0F16`
- secondary = `#7A2B36`
- sidebar = `#4A0F16` (texto claro)

### Tema escuro (decisão A)

- background = carvão `#141210`
- foreground / muted text = Neutro `#EAE6E1` / cinza quente
- primary / CTA = `#7A2B36`
- sidebar permanece `#4A0F16`

## Tipografia

- **Família:** Sora (`next/font/google` → `--font-sans`)
- Pesos: Regular corpo · Semibold/Bold títulos

## Layout (sem mudar fluxos)

- Sidebar esquerda bordô + conteúdo em fundo neutro
- Rotas, nav items e permissões **inalterados**
- Protótipos em `public/brand/ref-*.png` são referência visual apenas

## Ondas de migração

1. **Feita:** tokens + Sora + logo + rename Clivra
2. Shell polish (header, cards, active states finos)
3. Dashboard `/app`
4. Agenda / Pacientes / Auth polish
5. Demais packages

## A11y

- Contraste texto ≥ 4.5:1
- Focus ring visível (`--ring` bordô secundário)
- Ícones Lucide (sem emoji)
- `prefers-reduced-motion` respeitado nas ondas com motion
