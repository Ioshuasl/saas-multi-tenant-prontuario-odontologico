# 09 — Frontend (Next.js + React + TypeScript)

## 1. Decisões

| Tema | Escolha | Racional |
| --- | --- | --- |
| Framework | Next.js (App Router) | Requisito do projeto; SSR para páginas públicas (SEO do link de agendamento) e RSC para telas pesadas de leitura |
| Linguagem | TypeScript `strict`, componentes `.tsx` | Requisito |
| Estilo | Tailwind CSS + design system próprio em `shared/ui` | Velocidade e consistência; evita CSS-in-JS em RSC |
| Componentes base | Radix UI primitives (acessibilidade) encapsulados no nosso DS | Acessibilidade correta sem reinventar |
| Estado servidor | TanStack Query | Cache, revalidação, mutação otimista (essencial na agenda) |
| Estado cliente | Zustand para UI local (filtros, painéis) | Leve; sem Redux |
| Formulários | React Hook Form + Zod (schemas de `contracts/`) | Mesma validação do backend |
| Tabelas | TanStack Table | Virtualização e coluna dinâmica |
| Datas | `date-fns` + `date-fns-tz` (timezone do tenant) | Agenda depende de fuso correto |
| Gráficos | Recharts | Suficiente para dashboards do MVP |
| Testes | Vitest + Testing Library; Playwright para e2e | — |
| Autenticação | Access token em memória + refresh em cookie httpOnly | Evita XSS-token em `localStorage` |
| Realtime | SSE (`/api/v1/stream`) na agenda e na inbox; fallback polling | Simples; WebSocket só se necessário |

**Regra:** o frontend não reimplementa regra de negócio. Ele valida para UX (feedback imediato) usando o mesmo schema Zod, mas a verdade e a autorização são sempre do servidor.

## 2. Estrutura de pastas

Mantém a convenção dos outros projetos do time (`packages/<área>` por domínio + `shared/` transversal), com uma diferença imposta pelo Next.js: **`app/` substitui `pages/` + `routes/`**, porque o roteamento do App Router é o próprio sistema de arquivos (não existe arquivo de configuração de rotas para manter). A regra "1 arquivo ≈ 1 rota" continua valendo: cada `page.tsx` é fino e só compõe o que vem de `packages/`. Racional completo em [16 — Estrutura de Pastas](./16-estrutura-de-pastas.md).

```
frontend/src/
├── app/                                 # ROTAS (equivalente ao pages/ + routes/)
│   ├── (public)/                        # sem autenticação
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── recuperar-senha/page.tsx
│   │   ├── agendar/[slug]/page.tsx      # autoagendamento (SSR, indexável)
│   │   ├── anamnese/[token]/page.tsx
│   │   ├── orcamento/[token]/page.tsx
│   │   └── confirmar/[token]/page.tsx
│   ├── (app)/                           # área autenticada
│   │   ├── layout.tsx                   # shell: sidebar, seletor de unidade, busca global
│   │   ├── page.tsx                     # dashboard
│   │   ├── agenda/
│   │   │   ├── page.tsx
│   │   │   └── _components/{DayGrid,AppointmentCard,SlotPicker,WaitlistPanel}.tsx
│   │   ├── pacientes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # visão geral + timeline
│   │   │       ├── prontuario/page.tsx
│   │   │       ├── odontograma/page.tsx
│   │   │       ├── orcamentos/page.tsx
│   │   │       ├── financeiro/page.tsx
│   │   │       └── anexos/page.tsx
│   │   ├── atendimento/[appointmentId]/page.tsx   # tela de atendimento (foco do dentista)
│   │   ├── orcamentos/
│   │   ├── financeiro/
│   │   │   ├── receber/page.tsx
│   │   │   ├── pagar/page.tsx
│   │   │   ├── caixa/page.tsx
│   │   │   └── fluxo-de-caixa/page.tsx
│   │   ├── whatsapp/page.tsx            # inbox
│   │   ├── relatorios/
│   │   └── configuracoes/
│   │       ├── clinica/page.tsx
│   │       ├── usuarios/page.tsx
│   │       ├── procedimentos/page.tsx
│   │       ├── horarios/page.tsx
│   │       ├── whatsapp/page.tsx
│   │       └── assinatura/page.tsx
│   ├── api/auth/[...]/route.ts          # rotas BFF mínimas (cookie de refresh)
│   ├── layout.tsx
│   └── error.tsx / not-found.tsx
├── packages/                            # DOMÍNIO: agrupado por área de uso, espelha os módulos do backend
│   ├── operacional/                     # dia a dia da recepção
│   │   ├── scheduling/{api,hooks,components,types}
│   │   └── patients/{api,hooks,components,types}
│   ├── clinico/                         # uso do dentista
│   │   ├── clinical-records/…            # anamnese, odontograma, evolução, anexos
│   │   └── treatments/…                  # orçamento, plano de tratamento
│   ├── financeiro/
│   │   └── billing/…                     # receber, pagar, caixa, fluxo de caixa
│   ├── admin/                           # dono da clínica
│   │   ├── clinic/…                      # unidades, horários, procedimentos, usuários
│   │   ├── subscription/…                # plano, faturas, créditos
│   │   └── reporting/…                   # dashboards e relatórios
│   ├── messaging/                       # inbox WhatsApp (recepção + dono)
│   └── public/                          # sem sessão: auth, autoagendamento, anamnese/orçamento por token
├── shared/                              # transversal: usado por 2+ packages
│   ├── ui/                             # design system (Radix encapsulado + Tailwind)
│   ├── layout/                         # shell, sidebar, seletor de unidade, busca global
│   ├── api/
│   │   ├── api-client.ts               # fetch tipado + refresh automático + erro
│   │   └── query-client.ts
│   ├── hooks/                          # useTenant, usePermissions, useDebounce…
│   ├── auth/{session.ts,permissions.ts}
│   ├── helpers/
│   │   ├── format/{money.ts,date.ts,cpf.ts,phone.ts}
│   │   └── dental/{fdi.ts,tooth-map.ts}
│   └── styles/
```

Regras de organização:

1. **Rota é fina.** `page.tsx` cuida de parâmetros, metadata e composição. Zero lógica de dados ou de negócio em arquivo de página.
2. **`packages/` é dono da lógica.** Cada domínio traz seu `api/` (chamadas + query keys), `hooks/`, `components/` e `types/`.
3. **Um package não importa de outro package.** Se dois precisam da mesma coisa, ela sobe para `shared/` (mesma disciplina do `_public.ts` no backend). Exceção única e explicitada: `patients` expõe um seletor de paciente reutilizado por `clinico` e `financeiro` — fica em `shared/ui` como componente burro que recebe dados por prop.
4. **`shared/` é para o que já tem 2+ consumidores reais**, não para o que "talvez seja reutilizado".

## 3. Cliente de API tipado

```ts
// shared/api/api-client.ts
import type { ApiError, ApiResponse } from '@repo/contracts';

class ApiClient {
  private accessToken: string | null = null;
  private refreshing: Promise<void> | null = null;

  async request<T>(path: string, init: RequestInit & { tenantId?: string } = {}): Promise<T> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...(init.tenantId ? { 'X-Tenant-Id': init.tenantId } : {}),
        ...init.headers,
      },
    });

    if (res.status === 401 && !path.startsWith('/auth/refresh')) {
      await (this.refreshing ??= this.refresh().finally(() => (this.refreshing = null)));
      return this.request<T>(path, init);
    }

    const payload = (await res.json()) as ApiResponse<T> | ApiError;
    if (!res.ok) throw new ApiRequestError(payload as ApiError, res.status);
    return (payload as ApiResponse<T>).data;
  }
}
```

Erros são convertidos em `ApiRequestError` com `code` estável; um `ErrorBoundary` + `toast` traduz `code` em mensagem pt-BR e ação sugerida (ex.: `PLAN_LIMIT_EXCEEDED` → botão "Ver planos").

## 4. Telas críticas — requisitos de UX

### 4.1 Agenda (a tela mais usada do produto)

- Grade de colunas por profissional (ou por cadeira, alternável), linhas de 10/15/30 min conforme configuração.
- Cores por status: Solicitado (cinza tracejado), Agendado (azul), Confirmado (verde), Atendendo (roxo), Atendido (verde escuro), Faltou (vermelho), Cancelado (riscado/oculto por filtro).
- Interações: clicar em slot livre → modal de agendamento; arrastar/soltar para reagendar; redimensionar para mudar duração; clique direito → ações rápidas (confirmar, faltou, iniciar atendimento, WhatsApp).
- **Mutação otimista** em drag & drop, com rollback e toast em caso de `409`.
- Atualização em tempo real via SSE (outra recepcionista agendando aparece sem F5).
- Atalhos de teclado: `n` novo, `←/→` dia, `t` hoje, `/` busca, `Esc` fecha.
- Desempenho: virtualização vertical; alvo de 60 fps com 200 agendamentos no dia.
- Painel lateral opcional: fila de espera com botão "oferecer este horário".

### 4.2 Atendimento (foco do dentista)

Layout de três áreas em uma única rota (sem navegação entre telas durante o atendimento):

```
┌───────────────────────────────────────────────────────────────┐
│ Paciente: Ana Souza · 34a · ⚠ Alergia a penicilina            │
├──────────────────┬────────────────────────────────────────────┤
│ Odontograma      │ Plano de tratamento (itens planejados)     │
│ (SVG interativo) │ [ ] Restauração 26 O   R$ 320  [Executar]  │
│                  │ [x] Profilaxia         R$ 150  Executado   │
│                  ├────────────────────────────────────────────┤
│                  │ Evolução (editor + templates de texto)     │
│                  │ [Salvar e assinar]                         │
├──────────────────┴────────────────────────────────────────────┤
│ Histórico: evoluções anteriores · anexos · orçamentos          │
└───────────────────────────────────────────────────────────────┘
```

- Alertas clínicos (alergias, condições) sempre visíveis no topo, em vermelho, não dispensáveis.
- Odontograma em SVG com notação FDI, dentição permanente/decídua, seleção por dente ou por face, legenda de condições, histórico por dente em popover.
- Editor de evolução com templates/atalhos por procedimento e contador de caracteres; autosave em rascunho local até assinar.
- Ao assinar: banner de imutabilidade ("esta evolução não pode ser editada; correções geram nova versão").

### 4.3 Inbox WhatsApp

- Três colunas: lista de conversas (não lidas primeiro) · thread · painel do paciente (agendamentos, débitos, ações rápidas).
- Indicador explícito da janela de 24h: "janela aberta até 18:32" ou "janela fechada — só templates".
- Envio de template com preview das variáveis preenchidas.
- Atribuição de conversa a atendente; marcação de "resolvido".
- Ações contextuais: criar agendamento, enviar orçamento, enviar link de anamnese, enviar recibo.

### 4.4 Autoagendamento público

- Página SSR leve (LCP < 2,5 s em 4G), mobile-first, com nome/logo da clínica.
- Passos: serviço → profissional (opcional) → data/hora → identificação → OTP → confirmação.
- Só exibe horários realmente disponíveis (recalculados no submit para evitar corrida).
- Consentimento LGPD explícito antes de enviar dados.

### 4.5 Financeiro

- Contas a receber com filtros salvos (vencendo hoje, em atraso, do paciente X).
- Baixa em modal, sem sair da lista; múltiplas formas de pagamento em um recebimento.
- Caixa do dia com conferência por forma de pagamento e destaque de divergência.
- Fluxo de caixa com alternância competência/caixa e exportação.

## 5. Padrões de implementação

### Hook de dados por feature

```ts
// packages/operacional/scheduling/hooks/use-day-agenda.ts
export function useDayAgenda(params: { unitId: string; date: string; professionalIds?: string[] }) {
  return useQuery({
    queryKey: ['agenda', params],
    queryFn: () => schedulingApi.listAppointments(params),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: schedulingApi.reschedule,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['agenda'] });
      const previous = qc.getQueriesData({ queryKey: ['agenda'] });
      qc.setQueriesData({ queryKey: ['agenda'] }, (old) => applyReschedule(old, input));
      return { previous };
    },
    onError: (_err, _input, ctx) => ctx?.previous?.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}
```

### Permissões na UI

```tsx
// shared/auth/permissions.ts + componente Can
<Can permission="clinical_records.write" fallback={null}>
  <Button onClick={openNoteEditor}>Registrar evolução</Button>
</Can>
```

Esconder na UI é **conveniência**, nunca segurança — o servidor sempre reavalia.

### Server Components vs Client Components

- RSC (padrão): páginas públicas, listagens estáticas, relatórios, layouts.
- Client Components: agenda, odontograma, inbox, formulários — tudo que é interativo.
- Nunca passar token do usuário para RSC via props; chamadas autenticadas server-side usam o cookie.

## 6. Design system (`shared/ui`)

Componentes previstos no MVP: `Button`, `Input`, `Select`, `Combobox` (busca de paciente), `DatePicker`, `TimePicker`, `Modal`, `Drawer`, `Tabs`, `Table`, `Badge`, `StatusPill`, `Avatar`, `Tooltip`, `Toast`, `EmptyState`, `Skeleton`, `MoneyInput`, `CpfInput`, `PhoneInput`, `Odontogram`, `AgendaGrid`, `Timeline`.

Tokens: cores (com paleta semântica de status da agenda), espaçamento 4px-base, tipografia, raio, sombra, z-index. Tema claro no MVP; escuro na fase 2 (tokens já preparados).

## 7. Acessibilidade e i18n

- Navegação completa por teclado na agenda e no prontuário; foco visível; `aria-live` em toasts.
- Odontograma acessível: cada dente é um `button` com `aria-label` ("dente 26, face oclusal, restaurado").
- Contraste mínimo AA; status nunca comunicado **só** por cor (ícone + texto).
- Textos em `pt-BR` centralizados em arquivo de mensagens desde o início (facilita futura tradução), formatação com `Intl.NumberFormat`/`Intl.DateTimeFormat`.
- Timezone do tenant aplicado na renderização; nunca `new Date()` sem fuso explícito em cálculo de agenda.

## 8. Performance

| Meta | Como |
| --- | --- |
| LCP < 2,5 s nas páginas públicas | RSC + imagens otimizadas + CSS crítico |
| TTI < 3 s na agenda | Code splitting por rota, virtualização, sem bibliotecas de gráfico na rota da agenda |
| Bundle inicial da área autenticada < 250 KB gzip | Import dinâmico de odontograma, gráficos e editor |
| Sem layout shift | Skeletons com dimensões fixas |
| Offline tolerante | PWA com cache de shell; escrita exige rede (fila local é risco em dado clínico — fora do MVP) |

## 9. Tratamento de erros e estados vazios

- Todo estado de lista tem: carregando (skeleton), vazio (com ação primária), erro (com "tentar novamente") e sem permissão.
- Erros de rede: toast persistente com retry; a agenda mostra tarja "dados podem estar desatualizados" quando o SSE cai.
- Nunca exibir mensagem técnica bruta ao usuário; `requestId` fica disponível em "detalhes" para suporte.
