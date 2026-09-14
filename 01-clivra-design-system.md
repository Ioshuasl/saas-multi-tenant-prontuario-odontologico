# Clivra — Design System & UI Kit

> **Fonte oficial de verdade visual do frontend do Clivra.**
>
> Este documento substitui os padrões visuais antigos do projeto, incluindo referências a **Orius**, **Orius provisional**, **Notion-like**, paletas antigas, tipografias antigas e tokens visuais antigos.
>
> A migração para Clivra é **prioritariamente visual e de UI/UX**. Funcionalidades, regras de negócio e arquitetura existente devem ser preservadas.

---

## 1. Objetivo

O Clivra é um SaaS B2B para gestão odontológica, utilizado principalmente por:

- dentistas;
- clínicas odontológicas;
- recepcionistas;
- profissionais administrativos;
- gestores de clínicas.

A interface deve transmitir:

- confiança;
- precisão;
- profissionalismo;
- tecnologia;
- organização;
- sofisticação;
- tranquilidade;
- sensação clínica sem parecer hospitalar;
- produto premium sem excesso de elementos decorativos.

O Clivra deve parecer um **software profissional de odontologia moderno**, e não um dashboard genérico de SaaS.

### Princípios fundamentais

1. **Clareza antes de decoração.**
2. **Uma ação primária por contexto.**
3. **Hierarquia visual forte.**
4. **Densidade controlada.**
5. **Progressive disclosure.**
6. **Estados sempre explícitos.**
7. **Responsividade real.**
8. **Consistência entre módulos.**
9. **Reutilização de componentes.**
10. **A interface nunca deve comprometer uma funcionalidade existente.**

---

# 2. Regra de precedência

Quando houver conflito entre documentação antiga e este documento:

> **Este documento tem prioridade para decisões visuais do Clivra.**

Especialmente:

- cores;
- tipografia;
- espaçamento;
- bordas;
- sombras;
- radius;
- componentes visuais;
- sidebar;
- header;
- cards;
- tabelas;
- formulários;
- estados;
- responsividade;
- aparência geral.

As regras arquiteturais existentes do frontend continuam válidas, salvo quando explicitamente incompatíveis.

**Não substituir a arquitetura do projeto por causa da migração visual.**

---

# 3. Identidade visual

## 3.1 Personalidade

O Clivra deve transmitir:

> **Precisão clínica + tecnologia + simplicidade premium.**

Evitar:

- aparência infantil;
- excesso de gradientes;
- visual excessivamente colorido;
- aparência de template administrativo genérico;
- excesso de cards;
- sombras pesadas;
- bordas excessivamente arredondadas;
- textos gigantes;
- excesso de ícones;
- excesso de animações.

---

# 4. Tipografia

## 4.1 Fonte oficial

A fonte principal do Clivra é:

**Sora**

Usar Sora em toda a interface quando disponível no projeto.

### Prioridade

1. Sora local instalada no projeto;
2. Sora carregada conforme a infraestrutura atual do frontend;
3. fallback `sans-serif`.

Não introduzir uma nova estratégia de carregamento de fonte se isso causar complexidade ou quebrar o build.

## 4.2 Hierarquia

### Display

Uso:

- telas de onboarding;
- páginas institucionais internas;
- estados especiais.

```text
font-family: Sora
font-weight: 600
font-size: 32–40px
line-height: 1.15
```

### H1

```text
font-family: Sora
font-weight: 600
font-size: 28–32px
line-height: 1.2
```

### H2

```text
font-family: Sora
font-weight: 600
font-size: 22–26px
line-height: 1.25
```

### H3

```text
font-family: Sora
font-weight: 600
font-size: 18–20px
line-height: 1.3
```

### Body

```text
font-family: Sora
font-weight: 400
font-size: 14px
line-height: 1.5
```

### Small

```text
font-family: Sora
font-weight: 400
font-size: 12–13px
line-height: 1.4
```

### Labels

```text
font-family: Sora
font-weight: 500
font-size: 12–13px
```

### Números importantes

Para valores financeiros, métricas e indicadores:

```text
font-weight: 600
font-variant-numeric: tabular-nums
```

---

# 5. Paleta oficial Clivra

## 5.1 Cores principais

| Token | Hex | Uso |
|---|---|---|
| Clivra Burgundy | `#4A0F16` | identidade principal, sidebar, ações primárias |
| Burgundy Secondary | `#7A2B36` | hover, elementos secundários |
| Burgundy Light | `#A85B67` | destaque, elementos suaves |
| Background | `#F7F5F2` | fundo principal |
| Surface | `#FFFFFF` | cards, dialogs, áreas elevadas |
| Neutral | `#EAE6E1` | backgrounds neutros |
| Border | `#DDD8D3` | bordas e divisores |
| Text | `#1A1A1A` | texto principal |
| Text Secondary | `#6B6663` | texto secundário |

## 5.2 Cores semânticas

| Estado | Hex |
|---|---|
| Success | `#2F8F63` |
| Warning | `#C98A32` |
| Danger | `#B94A55` |
| Info | `#587A9B` |

As cores semânticas devem ser usadas com moderação.

Não transformar cada elemento da interface em uma cor diferente.

---

# 6. Tokens CSS oficiais

O projeto deve manter compatibilidade com tokens semânticos existentes de Tailwind/shadcn.

Quando possível, utilizar:

```text
bg-background
text-foreground
text-muted-foreground
bg-card
text-card-foreground
border-border
bg-primary
text-primary-foreground
bg-secondary
text-secondary-foreground
bg-muted
text-muted-foreground
bg-destructive
text-destructive-foreground
ring-ring
```

Mapeamento recomendado:

```css
:root {
  --background: #F7F5F2;
  --foreground: #1A1A1A;

  --card: #FFFFFF;
  --card-foreground: #1A1A1A;

  --popover: #FFFFFF;
  --popover-foreground: #1A1A1A;

  --primary: #4A0F16;
  --primary-foreground: #FFFFFF;

  --secondary: #7A2B36;
  --secondary-foreground: #FFFFFF;

  --muted: #EAE6E1;
  --muted-foreground: #6B6663;

  --accent: #A85B67;
  --accent-foreground: #FFFFFF;

  --border: #DDD8D3;
  --input: #DDD8D3;
  --ring: #7A2B36;

  --destructive: #B94A55;
  --destructive-foreground: #FFFFFF;

  --success: #2F8F63;
  --warning: #C98A32;
  --info: #587A9B;

  --sidebar-background: #4A0F16;
  --sidebar-foreground: #FFFFFF;
  --sidebar-primary: #FFFFFF;
  --sidebar-primary-foreground: #4A0F16;
  --sidebar-accent: #7A2B36;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: rgba(255,255,255,0.12);
}
```

> Os nomes exatos devem ser adaptados ao sistema de tokens já existente no projeto. Não duplicar sistemas de tokens sem necessidade.

---

# 7. Regra contra hardcoded colors

Evitar:

```tsx
className="bg-[#4A0F16]"
```

quando existir um token semântico equivalente.

Preferir:

```tsx
className="bg-primary"
```

ou:

```tsx
className="bg-sidebar"
```

Cores hardcoded podem ser usadas apenas quando:

- o elemento realmente exige uma cor específica;
- não existe token apropriado;
- a cor é parte de uma ilustração ou recurso visual específico.

---

# 8. Logo

O logo oficial do Clivra deve ser utilizado sempre que existir um asset oficial no projeto.

Antes de criar ou substituir um logo:

1. procurar os assets existentes;
2. reutilizar o logo oficial;
3. preservar proporção;
4. não aplicar filtros;
5. não alterar cores arbitrariamente;
6. não recriar o logo com texto improvisado.

Se o asset oficial não existir:

> Não inventar um novo logo silenciosamente.

Manter um placeholder visual apropriado ou registrar a necessidade de asset.

---

# 9. Border radius

O Clivra usa cantos moderadamente arredondados.

Valores de referência:

```text
xs: 4px
sm: 6px
md: 8px
lg: 10px
xl: 14px
2xl: 16px
```

### Uso

- Input: `8px`
- Button: `8px`
- Card: `12–14px`
- Dialog: `14–16px`
- Badge: `9999px`
- Avatar: `9999px`
- grandes containers: `14–16px`

Evitar transformar toda a interface em pills.

---

# 10. Sombras

Sombras devem ser discretas.

### Small

```text
0 1px 2px rgba(26, 26, 26, 0.04)
```

### Medium

```text
0 4px 12px rgba(26, 26, 26, 0.06)
```

### Large

```text
0 12px 32px rgba(26, 26, 26, 0.10)
```

Uso recomendado:

- dialogs;
- dropdowns;
- popovers;
- menus;
- elementos realmente elevados.

Cards comuns devem preferencialmente utilizar:

> background + border

em vez de sombra forte.

---

# 11. Espaçamento

Escala oficial:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Preferir múltiplos da escala.

Evitar valores arbitrários como:

```text
13px
17px
23px
27px
31px
```

exceto quando necessários por questões técnicas ou visuais.

---

# 12. Densidade

O Clivra é um produto operacional.

Dentistas e equipes administrativas precisam visualizar bastante informação.

Portanto:

> A interface deve ser compacta, porém respirável.

Evitar:

- cards gigantes;
- padding excessivo;
- linhas de tabela muito altas;
- títulos ocupando metade da tela;
- espaços vazios sem propósito.

---

# 13. App Shell

A estrutura geral deve seguir:

```text
┌──────────────────────────────────────────────┐
│ Sidebar │ Header                             │
│         ├────────────────────────────────────┤
│         │                                    │
│         │ Main Content                       │
│         │                                    │
│         │                                    │
└─────────┴────────────────────────────────────┘
```

### Desktop

- sidebar fixa;
- header superior;
- conteúdo flexível;
- overflow controlado;
- área principal sem scroll horizontal.

### Notebook

Prioridade de validação:

> **1366 × 768**

Também validar:

- 1280 × 720;
- 1440 × 900.

### Desktop grande

Validar:

- 1536 × 864;
- 1920 × 1080.

---

# 14. Sidebar

A sidebar é um dos elementos mais importantes da identidade.

## 14.1 Visual

Base:

```text
background: #4A0F16
color: #FFFFFF
```

Características:

- elegante;
- compacta;
- hierarquia clara;
- navegação organizada;
- ícones Lucide;
- labels legíveis.

## 14.2 Estrutura

```text
Logo

Workspace / Clínica

Principal
  Dashboard
  Agenda
  Pacientes
  Prontuários

Gestão
  Financeiro
  Procedimentos
  Profissionais

Configurações
  Clínica
  Usuários
  Preferências
```

A estrutura real deve respeitar as rotas existentes.

Não criar funcionalidades inexistentes apenas por causa do design.

## 14.3 Item ativo

O item ativo deve ser claramente identificável.

Pode utilizar:

- background Burgundy Secondary;
- indicador lateral;
- mudança de peso;
- combinação dos anteriores.

Evitar excesso de contraste ou efeitos chamativos.

## 14.4 Collapse

Se o projeto já possuir sidebar colapsável:

- preservar comportamento;
- preservar atalhos;
- preservar acessibilidade;
- adaptar somente o visual.

Não remover funcionalidades existentes.

---

# 15. Header

O Header deve conter somente informações úteis.

Possível estrutura:

```text
[breadcrumb / contexto]        [busca] [notificações] [usuário]
```

Características:

- altura moderada;
- background Surface;
- border inferior;
- sem sombra pesada.

O header não deve competir visualmente com o conteúdo.

---

# 16. Page Header

Padrão:

```text
Título
Descrição curta

                                  [Ação primária]
```

Exemplo:

```text
Pacientes
Gerencie pacientes, informações clínicas e histórico.

                                  + Novo paciente
```

### Regra

Cada contexto deve ter:

> **1 ação primária principal.**

Ações secundárias podem existir, mas não devem competir com a principal.

---

# 17. Breadcrumbs

Usar quando a hierarquia da página for relevante.

Exemplo:

```text
Pacientes / Maria Silva / Prontuário
```

Características:

- discretos;
- texto secundário;
- separador pequeno;
- não ocupar espaço excessivo.

---

# 18. Cards

Card padrão:

```text
background: white
border: 1px solid var(--border)
border-radius: 12–14px
```

Estrutura:

```text
Card Header
  título
  descrição / ações

Card Content

Card Footer
```

Não usar sombra pesada por padrão.

---

# 19. Stat Cards

Para dashboard:

```text
┌─────────────────────────┐
│ Pacientes ativos     ⋯  │
│                         │
│ 1.248                   │
│ +8,4% este mês          │
└─────────────────────────┘
```

Hierarquia:

1. label;
2. valor;
3. comparação/tendência;
4. informação complementar.

O valor deve ser facilmente escaneável.

---

# 20. Botões

## Primary

Uso:

- salvar;
- criar;
- confirmar;
- finalizar;
- ação principal.

Visual:

```text
background: #4A0F16
color: white
```

Hover:

```text
background: #7A2B36
```

## Secondary

Usado para ações importantes, mas não primárias.

## Outline

Usado quando a ação precisa de destaque moderado.

## Ghost

Usado para:

- ações contextuais;
- menus;
- ações discretas.

## Destructive

Usado somente para ações destrutivas.

Nunca usar vermelho apenas para chamar atenção.

---

# 21. Estados de botão

Todo botão interativo deve considerar:

```text
default
hover
active
focus
disabled
loading
```

Loading:

- manter tamanho do botão;
- utilizar spinner;
- evitar mudança brusca de layout.

---

# 22. Inputs

Input padrão:

```text
height: 40–44px
border-radius: 8px
border: 1px solid #DDD8D3
background: #FFFFFF
```

Focus:

- ring baseado no Burgundy;
- contraste suficiente.

Placeholder:

```text
#6B6663
```

Não utilizar placeholder como substituto de label.

---

# 23. Formulários

Formulários devem ter:

```text
Label
Input
Helper / Error
```

Exemplo:

```text
Nome completo
[ Maria Silva                         ]

CPF
[ 000.000.000-00                     ]
Documento usado para identificação.
```

## Desktop

Campos relacionados podem ocupar duas colunas.

Exemplo:

```text
Nome completo       CPF
[................]  [...............]

Telefone            E-mail
[................]  [...............]
```

## Mobile

Sempre adaptar para uma coluna quando necessário.

---

# 24. Select / Combobox

Usar para seleção de dados conhecidos.

Estados:

```text
default
loading
empty
error
disabled
no permission
```

Combobox é preferível quando:

- lista grande;
- busca necessária;
- pacientes;
- profissionais;
- procedimentos;
- clínicas.

---

# 25. Date Picker

Datas devem utilizar componente consistente em todo o sistema.

Não criar calendários visualmente diferentes por módulo.

---

# 26. Badges

Badges devem comunicar estado.

Exemplos:

```text
Ativo
Pendente
Cancelado
Concluído
Em andamento
```

Preferir fundo suave + texto semântico.

Exemplo conceitual:

```text
[ ● Ativo ]
```

Evitar badges gigantes.

---

# 27. Tabelas

Tabelas são essenciais no Clivra.

Características:

- alta legibilidade;
- densidade moderada;
- cabeçalho claro;
- linhas consistentes;
- ações contextualizadas;
- estados explícitos.

Estrutura:

```text
┌───────────────────────────────────────────────┐
│ Nome       CPF        Status       Ações      │
├───────────────────────────────────────────────┤
│ Maria      ...        Ativo        ...        │
│ João       ...        Ativo        ...        │
└───────────────────────────────────────────────┘
```

Evitar:

- excesso de bordas;
- cores em todas as colunas;
- sombras;
- tabelas extremamente espaçadas.

---

# 28. CRUD

Padrão:

```text
Page Header
    ↓
Card
    ↓
Toolbar
    ↓
DataTable
```

Toolbar:

```text
[Buscar...] [Filtros]                         [Ação]
```

O Index da página deve continuar apenas orquestrando componentes.

Não mover lógica de API para a UI.

---

# 29. Estados de CRUD

Toda listagem deve considerar:

### Loading

Utilizar skeleton.

### Empty

Mensagem útil.

Exemplo:

```text
Nenhum paciente encontrado

Cadastre o primeiro paciente para começar a utilizar esta área.

[ Novo paciente ]
```

### Error

Mostrar:

- mensagem;
- contexto;
- ação para tentar novamente.

### Data

Mostrar tabela normalmente.

### Filtering

Preservar contexto e filtros.

### Pagination

Manter paginação consistente entre módulos.

---

# 30. Empty States

Empty state deve responder:

1. O que aconteceu?
2. Por que está vazio?
3. O que o usuário pode fazer?

Evitar:

```text
Nenhum dado.
```

Preferir:

```text
Nenhum atendimento encontrado

Ainda não existem atendimentos registrados para este período.

[ Novo atendimento ]
```

---

# 31. Loading

Preferir skeleton para carregamentos estruturais.

Evitar spinner central gigante em toda a página.

Usar:

- skeleton em cards;
- skeleton em tabelas;
- spinner em ações;
- loading inline quando adequado.

---

# 32. Error State

Erro deve ser claro e acionável.

Exemplo:

```text
Não foi possível carregar os pacientes.

Verifique sua conexão e tente novamente.

[ Tentar novamente ]
```

Não expor detalhes técnicos para o usuário final.

---

# 33. Dialog

Dialogs devem ser utilizados para:

- confirmação;
- criação simples;
- edição curta;
- ações rápidas.

Evitar colocar formulários gigantes em Dialog.

Para fluxos complexos:

> preferir página dedicada ou Drawer quando apropriado.

---

# 34. Drawer

Usar para:

- detalhes rápidos;
- edição contextual;
- filtros;
- informações complementares.

O Drawer não deve esconder informações críticas sem oferecer navegação clara.

---

# 35. Toast

Toast deve comunicar:

- sucesso;
- erro;
- aviso;
- informação.

Exemplos:

```text
Paciente criado com sucesso.
```

```text
Não foi possível salvar o paciente.
```

Não utilizar toast para substituir mensagens permanentes importantes.

---

# 36. Avatar

Avatar:

- pacientes;
- usuários;
- profissionais.

Fallback:

- iniciais;
- ícone.

Nunca depender exclusivamente de fotografia.

---

# 37. Ícones

Biblioteca oficial:

> **Lucide Icons**

Regras:

- usar ícones consistentes;
- não misturar bibliotecas sem necessidade;
- tamanho padrão geralmente `16px` ou `18px`;
- ações importantes podem utilizar `20px`.

Ícone nunca deve substituir texto quando a ação não for óbvia.

---

# 38. Dashboard

O Dashboard deve ser operacional.

Priorizar:

- agenda;
- consultas do dia;
- pacientes;
- indicadores;
- pendências;
- financeiro;
- alertas relevantes.

Estrutura sugerida:

```text
Page Header

[Stat] [Stat] [Stat] [Stat]

┌──────────────────────────────┐
│ Agenda de hoje               │
│                              │
│ consultas                    │
└──────────────────────────────┘

┌──────────────────┐ ┌─────────┐
│ Próximos         │ │ Alertas │
│ atendimentos     │ │         │
└──────────────────┘ └─────────┘
```

Não transformar tudo em gráfico.

---

# 39. Responsividade do Dashboard

Em 1366×768:

- evitar scroll vertical desnecessário;
- manter métricas principais visíveis;
- preservar hierarquia;
- usar grid compacto.

Em 1280×720:

- reduzir espaçamento;
- permitir quebra controlada;
- não esconder funcionalidades importantes.

Em mobile:

```text
Stats
↓
Agenda
↓
Pendências
↓
Demais informações
```

---

# 40. Agenda

Agenda é uma área de alta densidade.

Deve priorizar:

- horário;
- profissional;
- paciente;
- status;
- duração;
- ações.

Não reduzir simplesmente a agenda desktop para mobile.

Mobile pode utilizar:

- timeline;
- lista por horário;
- agrupamento por profissional;
- navegação de dia.

Desktop pode utilizar:

```text
Horários × Profissionais
```

---

# 41. Pacientes

A listagem de pacientes deve priorizar:

- nome;
- documento;
- telefone;
- última consulta;
- status;
- ações.

Busca deve ser altamente acessível.

Filtros devem ser fáceis de limpar.

---

# 42. Perfil do paciente

Estrutura recomendada:

```text
Breadcrumb

Paciente
Informações principais

┌─────────────────────────────┬───────────────┐
│                             │               │
│ Conteúdo principal          │ Ações rápidas │
│                             │               │
└─────────────────────────────┴───────────────┘
```

---

# 43. Sidebar de detalhes

A sidebar interna de detalhes é diferente da sidebar global.

Configuração desktop:

```text
width: aproximadamente 360px
position: sticky
```

Uso:

- ações;
- resumo;
- status;
- informações importantes.

Em telas menores:

> transformar em bloco inferior, Drawer ou seção recolhível conforme o contexto.

Nunca deixar uma sidebar interna esmagar o conteúdo principal.

---

# 44. Prontuário

O prontuário deve possuir hierarquia clínica clara.

Priorizar:

1. identificação do paciente;
2. informações clínicas relevantes;
3. histórico;
4. atendimento atual;
5. procedimentos;
6. documentos;
7. observações.

Evitar excesso de componentes simultâneos.

---

# 45. Atendimento clínico

A interface de atendimento deve minimizar distrações.

Pode utilizar:

```text
Paciente
↓
Contexto clínico
↓
Anamnese
↓
Exame
↓
Odontograma
↓
Procedimentos
↓
Evolução
↓
Finalização
```

O fluxo deve preservar as funcionalidades existentes.

---

# 46. Odontograma

O odontograma é uma área especializada.

Regras:

- alto contraste;
- visual limpo;
- legenda clara;
- estados compreensíveis;
- interação consistente;
- não utilizar cores decorativas sem significado clínico.

Se existirem estados clínicos definidos pelo domínio, preservar seus significados.

---

# 47. Financeiro

Valores financeiros devem ter forte hierarquia.

Exemplo:

```text
Receita do mês

R$ 24.850,00

+12,4% em relação ao mês anterior
```

Usar cores semânticas apenas quando realmente indicarem:

- positivo;
- negativo;
- pendência;
- risco.

---

# 48. Container e Grid

Desktop:

```text
max-width: 1440px
margin: auto
padding: 24–32px
```

Para áreas operacionais muito densas, o conteúdo pode utilizar mais largura.

Não criar containers estreitos que desperdicem espaço em monitores grandes.

---

# 49. Breakpoints

Utilizar os breakpoints já disponíveis no Tailwind sempre que possível:

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

O design deve ser validado principalmente em:

```text
1280 × 720
1366 × 768
1440 × 900
1536 × 864
1920 × 1080
768 × 1024
390 × 844
```

---

# 50. Responsividade — regra principal

> **Não fazer apenas um desktop reduzido.**

Quando o espaço diminuir:

- reorganizar;
- agrupar;
- colapsar;
- transformar sidebar em Drawer;
- transformar tabelas em listas quando necessário;
- mover ações;
- reduzir densidade;
- adaptar navegação.

---

# 51. Notebook é prioridade

A maior parte dos usuários profissionais utilizará:

- notebooks;
- desktops;
- monitores corporativos.

Portanto:

> 1366×768 é o viewport principal de validação.

Uma página não pode depender de uma tela 1920×1080 para parecer boa.

---

# 52. Mobile

Mobile é suporte real, não apenas uma versão comprimida.

Regras:

- uma coluna;
- botões acessíveis;
- touch targets adequados;
- tabelas adaptadas;
- navegação compacta;
- Drawer para sidebars;
- evitar overflow horizontal.

---

# 53. Overflow

Nenhuma página deve gerar:

```text
horizontal scroll
```

sem que exista uma razão funcional.

Verificar especialmente:

- tabelas;
- agenda;
- prontuário;
- dialogs;
- filtros;
- breadcrumbs;
- formulários;
- sidebars.

---

# 54. Acessibilidade

Garantir:

- contraste suficiente;
- foco visível;
- navegação por teclado;
- labels associados;
- aria-label em ações somente com ícone;
- botões semanticamente corretos;
- mensagens de erro acessíveis;
- áreas clicáveis adequadas.

Não depender apenas de cor para comunicar estado.

---

# 55. Motion

Animações devem ser discretas.

Usar:

- fade curto;
- slide curto;
- transition de background;
- transition de opacity;
- microinterações.

Evitar:

- animações contínuas;
- bouncing;
- efeitos exagerados;
- transições lentas.

Referência:

```text
150–250ms
```

---

# 56. Dark mode

Se o projeto já possuir dark mode:

> preservar a funcionalidade.

O dark mode deve utilizar uma versão coerente da identidade Clivra.

Não simplesmente inverter cores.

Se o projeto ainda não possuir dark mode:

> não criar uma nova funcionalidade apenas durante a migração visual.

---

# 57. shadcn/ui

Quando componentes shadcn/ui já estiverem presentes:

> reutilizar e estilizar os componentes existentes.

Evitar criar um segundo sistema de componentes paralelo.

Componentes preferenciais:

- Button;
- Input;
- Label;
- Select;
- Combobox;
- Dialog;
- Drawer;
- DropdownMenu;
- Popover;
- Tabs;
- Badge;
- Table;
- Tooltip;
- Toast/Sonner;
- Skeleton;
- Separator.

---

# 58. Componentes compartilhados

Sempre procurar componentes existentes antes de criar um novo.

Componentes comuns:

```text
PageHeader
Breadcrumbs
DataTable
TableToolbar
EmptyState
ErrorState
LoadingState
StatusBadge
ConfirmDialog
FormDialog
DetailsSidebar
SearchInput
DatePicker
MoneyInput
CpfInput
PhoneInput
Avatar
```

Componentes específicos do domínio podem incluir:

```text
Odontogram
AgendaGrid
AppointmentCard
PatientHeader
ClinicalTimeline
ProcedureSelector
```

---

# 59. Regra de reutilização

Se o mesmo padrão aparecer em três ou mais lugares:

> considerar transformar em componente compartilhado.

Não copiar e colar estruturas visuais.

---

# 60. Separação entre Form e Details

Não misturar conceitos.

### Form

Objetivo:

> criar ou editar dados.

Características:

- inputs;
- labels;
- validações;
- salvar;
- cancelar.

### Details

Objetivo:

> visualizar informações.

Características:

- leitura;
- ações;
- status;
- navegação;
- histórico.

---

# 61. Arquitetura frontend

A migração visual NÃO deve quebrar a arquitetura existente.

Preservar:

```text
Page
  ↓
Component
  ↓
Hook
  ↓
Service
  ↓
Data
  ↓
API
```

Regra:

> Apenas Data acessa API.

Hooks continuam responsáveis pelo gerenciamento de estado/dados conforme a arquitetura atual.

---

# 62. TanStack Query

Se já utilizado pelo projeto:

- preservar;
- não mover queries para componentes;
- manter hooks;
- manter invalidações;
- manter cache;
- manter estados de loading/error.

Uma refatoração visual não deve alterar a estratégia de dados.

---

# 63. TypeScript

Não alterar tipos apenas para facilitar uma mudança visual.

Preservar:

- `types/`;
- `enum/`;
- contratos existentes.

Não criar:

```text
interfaces/
```

se a convenção atual do projeto utiliza `types/`.

---

# 64. Regras de migração Orius → Clivra

A migração deve eliminar visualmente os padrões antigos.

Substituir:

```text
Orius
Orius provisional
Notion-like
Orange
#FF781F
#37352F
Geist
Inter
```

quando essas referências forem parte da identidade visual antiga.

Substituir por:

```text
Clivra
Burgundy
#4A0F16
#7A2B36
#A85B67
Sora
```

Não fazer apenas um find/replace cego.

Analisar o contexto de cada ocorrência.

---

# 65. Ordem recomendada de migração

Executar a migração nesta ordem:

## Fase 1 — Auditoria

Identificar:

- tokens;
- cores;
- fontes;
- componentes;
- layouts;
- referências Orius;
- padrões duplicados;
- componentes compartilhados.

## Fase 2 — Tokens

Atualizar:

- cores;
- tipografia;
- radius;
- shadows;
- spacing;
- semantic tokens.

## Fase 3 — App Shell

Atualizar:

- sidebar;
- header;
- navegação;
- layout principal.

## Fase 4 — Shared UI

Atualizar:

- buttons;
- inputs;
- selects;
- dialogs;
- badges;
- tables;
- states.

## Fase 5 — Páginas

Migrar:

1. Dashboard;
2. Pacientes;
3. Agenda;
4. Prontuário;
5. Atendimento;
6. Financeiro;
7. demais módulos.

## Fase 6 — Responsividade

Validar todos os módulos nos viewports oficiais.

## Fase 7 — Refinamento

Corrigir:

- inconsistências;
- espaçamentos;
- overflow;
- contraste;
- estados;
- hierarquia.

---

# 66. O que NÃO alterar

Durante uma migração exclusivamente visual, não alterar sem necessidade explícita:

- endpoints;
- API;
- banco;
- schemas;
- payloads;
- regras de negócio;
- autenticação;
- autorização;
- permissões;
- hooks;
- services;
- Data;
- queries;
- mutations;
- rotas funcionais;
- nomes de campos;
- validações;
- comportamento funcional.

Se uma alteração funcional for necessária para resolver um problema de UI:

> registrar a necessidade antes de implementá-la.

---

# 67. O que pode ser alterado

Pode alterar:

- classes Tailwind;
- tokens;
- CSS;
- estrutura visual;
- wrappers visuais;
- layout;
- grid;
- spacing;
- typography;
- colors;
- borders;
- shadows;
- responsive behavior;
- composição de componentes;
- ordem visual dos elementos;
- componentes visuais compartilhados.

Desde que o comportamento funcional seja preservado.

---

# 68. Não reescrever tudo

Evitar:

> apagar uma página e reconstruí-la do zero.

Preferir:

> migrar incrementalmente.

O código existente pode conter regras de negócio e comportamentos que não são imediatamente visíveis.

---

# 69. Critério de qualidade visual

Uma tela só deve ser considerada concluída quando:

- utiliza a identidade Clivra;
- possui hierarquia clara;
- não parece Orius;
- não parece um template genérico;
- funciona em notebook;
- funciona em desktop;
- funciona em mobile;
- não possui overflow horizontal indevido;
- estados estão tratados;
- ações estão claras;
- componentes seguem o Design System.

---

# 70. Checklist visual

## Identidade

- [ ] Sora
- [ ] Burgundy Clivra
- [ ] warm neutral background
- [ ] white surfaces
- [ ] Lucide
- [ ] logo oficial

## Layout

- [ ] sidebar consistente
- [ ] header consistente
- [ ] Page Header consistente
- [ ] spacing consistente
- [ ] container adequado

## Componentes

- [ ] Button
- [ ] Input
- [ ] Select
- [ ] Dialog
- [ ] Drawer
- [ ] Badge
- [ ] Table
- [ ] Empty State
- [ ] Loading State
- [ ] Error State

## Responsividade

- [ ] 1280×720
- [ ] 1366×768
- [ ] 1440×900
- [ ] 1536×864
- [ ] 1920×1080
- [ ] 768×1024
- [ ] 390×844

## Qualidade

- [ ] sem horizontal overflow
- [ ] contraste adequado
- [ ] foco visível
- [ ] ações claras
- [ ] sem componentes duplicados
- [ ] sem cores Orius
- [ ] sem fonte antiga
- [ ] sem alteração funcional indevida

---

# 71. Checklist técnico pós-migração

Após alterações:

```text
TypeScript
↓
Lint
↓
Build
↓
Testes existentes
↓
Visual validation
↓
Responsive validation
```

Não considerar uma migração concluída apenas porque o build passa.

---

# 72. Regra para novas páginas

Toda nova página deve:

1. consultar este documento;
2. reutilizar componentes existentes;
3. utilizar tokens semânticos;
4. seguir a estrutura Page Header → Content;
5. possuir estados;
6. ser responsiva;
7. ser validada em 1366×768;
8. respeitar a arquitetura existente.

---

# 73. Regra para novos componentes

Antes de criar:

1. procurar componente existente;
2. verificar shadcn/ui;
3. verificar shared/ui;
4. verificar padrões similares;
5. somente então criar novo componente.

Todo novo componente deve:

- utilizar tokens;
- ser acessível;
- ser responsivo;
- evitar hardcoded colors;
- seguir Sora;
- usar Lucide;
- respeitar o radius do sistema.

---

# 74. Regra para redesign

Quando uma página existente precisar de redesign:

### Primeiro

Preservar:

- dados;
- lógica;
- comportamento;
- rotas;
- ações.

### Depois

Melhorar:

- hierarquia;
- layout;
- spacing;
- contraste;
- navegação;
- agrupamento;
- responsividade;
- feedback visual.

---

# 75. Anti-patterns

Não utilizar:

### Cores aleatórias

```text
azul para um botão
roxo para outro
verde decorativo
```

### Cards excessivos

Não transformar cada informação em um card.

### Gradientes excessivos

O Clivra não deve parecer uma landing page de IA.

### Sombras pesadas

Evitar visual flutuante exagerado.

### Pills em excesso

Badge pode ser pill; botão comum não precisa ser.

### Texto excessivo

Interfaces operacionais devem ser escaneáveis.

### Ícones decorativos sem função

Cada ícone deve possuir propósito.

### Desktop-only

Nenhuma página pode depender de largura grande.

---

# 76. Regra de consistência

Se duas telas resolvem o mesmo problema:

> devem parecer parte do mesmo produto.

Exemplos:

- todas as tabelas devem possuir estrutura semelhante;
- todos os Page Headers devem possuir hierarquia semelhante;
- todos os dialogs devem possuir comportamento semelhante;
- todos os badges devem seguir semântica semelhante;
- todos os formulários devem utilizar os mesmos componentes base.

---

# 77. Regra de simplicidade

O Clivra deve seguir:

> **menos elementos, mais clareza.**

Antes de adicionar:

- card;
- ícone;
- badge;
- separador;
- cor;
- botão;
- gráfico;

perguntar:

> Isso melhora a compreensão ou apenas adiciona decoração?

Se for apenas decoração:

> não adicionar.

---

# 78. Resultado esperado

A interface final deve passar a sensação de:

```text
Clivra
──────────────

Premium
Clínico
Moderno
Organizado
Confiável
Preciso
Calmo
Tecnológico
```

E não:

```text
Template SaaS
Dashboard genérico
Notion clone
Sistema legado
Interface excessivamente colorida
```

---

# 79. Instrução final para agentes de IA

Ao trabalhar no frontend do Clivra:

> **Leia este arquivo antes de modificar qualquer elemento visual.**

Aplique o Design System de forma consistente.

Não invente novas cores.

Não invente novas fontes.

Não crie novos padrões sem necessidade.

Não substitua componentes existentes sem analisar seu uso.

Não altere funcionalidades durante uma tarefa visual.

Não faça uma versão apenas desktop.

Não considere uma tela pronta sem validar 1366×768.

Quando houver dúvida visual:

1. consultar este documento;
2. consultar os componentes existentes;
3. consultar os padrões de UI do projeto;
4. escolher a solução mais simples e consistente.

---

# 80. Resumo oficial

## Marca

**Clivra**

## Fonte

**Sora**

## Primary

```text
#4A0F16
```

## Secondary

```text
#7A2B36
```

## Accent

```text
#A85B67
```

## Background

```text
#F7F5F2
```

## Surface

```text
#FFFFFF
```

## Border

```text
#DDD8D3
```

## Text

```text
#1A1A1A
```

## Secondary Text

```text
#6B6663
```

## Success

```text
#2F8F63
```

## Warning

```text
#C98A32
```

## Danger

```text
#B94A55
```

## Icons

**Lucide**

## Primary viewport

**1366 × 768**

## Design principle

> **Clinical precision with premium simplicity.**

---

**Fim do Design System Clivra.**
