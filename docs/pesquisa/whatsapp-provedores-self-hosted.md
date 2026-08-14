# Pesquisa — Gateways WhatsApp open source / self-hosted

**Data da pesquisa:** 2026-08-14  
**Escopo:** Evolution API, OpenWA e WAHA, no contexto deste SaaS odontológico multi-tenant.  
**Decisão vigente do produto:** [ADR-0016](../adr/0016-waha-default-messaging.md) (WAHA GOWS default). O [ADR-0005](../adr/0005-whatsapp-cloud-api.md) (Cloud API) está **supersedido**. Avaliação dos gateways: [ADR-0015](../adr/0015-avaliacao-gateways-whatsapp-nao-oficiais.md). Plano: [desenvolvimento/migracao-waha.md](../desenvolvimento/migracao-waha.md).

## 1. Por que esta pesquisa existe

O canal WhatsApp é central no MVP (confirmação D-1, lembrete H-3, orçamento, anamnese, inbox). A Cloud API oficial exige credencial Meta / WABA e cobra por mensagem de template. A hipótese comercial é: **SaaS barato → mais clínicas**. Gateways self-hosted prometem custo zero por mensagem.

Essa hipótese só fecha se ignorarmos:

1. risco de **banimento do número da clínica** (o ativo de contato com a base);
2. custo de **infra por sessão** (RAM, VPS, IPs);
3. quebra quando o protocolo do WhatsApp Web muda;
4. ausência de templates oficiais, selo, e botões estáveis como na Cloud API;
5. a partir de **1º de outubro de 2026**, a Meta passa a cobrar também mensagens de serviço / utility na janela de 24 h na Cloud API — o que muda o TCO da oficial, mas **não legaliza** o cliente não oficial.

## 2. O que todos esses provedores são (e o que não são)

São **HTTP gateways** que encapsulam um cliente **não oficial** do WhatsApp (emulação de WhatsApp Web / protocolo multi-device via bibliotecas comunitárias: Baileys, whatsapp-web.js, GOWS/whatsmeow, etc.).

Não são:

- parceiros da Meta (BSP);
- substituto da WhatsApp Business Platform;
- um “modo invisível” da Cloud API.

A documentação dos três projetos admite, de formas diferentes, que **não há garantia contra bloqueio**. A própria WAHA escreve que o WhatsApp não permite bots nem clientes não oficiais e que o método **não deve ser considerado totalmente seguro**. O README da OpenWA (rmyndharis) afirma que o risco de restrição **nunca é zero**.

Usar isso em produção **viola os Termos de Serviço** do WhatsApp. Não é “esconder da Meta”: o servidor do WhatsApp **é** o destino de cada sessão. IP residencial, proxy ou “comportamento humano” simulados **não transformam** um cliente reverse-engineered em cliente oficial.

## 3. Distinção de nomes (OpenWA)

Há **dois** produtos distintos com nome parecido:

| Projeto | Repo | O que é |
| --- | --- | --- |
| **OpenWA (gateway self-hosted)** — o comparado neste doc | [rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA) · [open-wa.org](https://www.open-wa.org/) | Gateway NestJS + dashboard, Docker, engines `whatsapp-web.js` e Baileys. Repo criado em **fev/2026**. |
| **@open-wa/wa-automate** | [open-wa/wa-automate-nodejs](https://github.com/open-wa/wa-automate-nodejs) | Toolkit Node.js mais antigo (v4 estável / v5 alpha). Biblioteca/runtime, não o mesmo produto. |

Este documento compara o **gateway** rmyndharis/OpenWA.

## 4. Ficha de cada provedor

Números de GitHub são snapshot de **2026-08-14** e mudam rápido.

### 4.1 Evolution API

| Campo | Valor |
| --- | --- |
| Repo | [evolution-foundation/evolution-api](https://github.com/evolution-foundation/evolution-api) (~9,2k stars) |
| Docs | [docs.evolutionfoundation.com.br](https://docs.evolutionfoundation.com.br) / [evolution-api.com](https://evolution-api.com) |
| Origem | Fork/evolução do CodeChat (Baileys). Ecossistema forte no Brasil. |
| Engines WhatsApp | **Baileys** (Web não oficial) **e** **Cloud API oficial** no mesmo produto |
| Stack | Node.js, Docker, PostgreSQL/Redis/Mongo conforme setup |
| Integrações nativas | Chatwoot, Typebot, Dify, OpenAI, n8n, RabbitMQ, Kafka, SQS, S3/MinIO |
| Licença | Apache 2.0 **com cláusulas extras** (logo/copyright no console; notificação de uso em projetos, inclusive fechados). Uso comercial sem cumprir isso pode exigir licença comercial. |
| Ativação | Desde **v2.4.0** (mai/2026): instância precisa **ativar** contra o servidor de licença da Evolution Foundation. Sem isso, endpoints de negócio retornam `503 LICENSE_REQUIRED`. |
| Pontos fortes | Maturidade no mercado BR; dual channel (Baileys **ou** Cloud API) — útil se um dia migrarmos; ecossistema de automações. |
| Pontos fracos | Mais pesado/complexo; histórico de instabilidade Baileys (reconnect, `stream:error` 515, perda de mensagem); dependência de servidor de licença de terceiros; atribuição obrigatória. Relatos de 2026 descrevem Evolution como “feature-rich, ops pesado”. |

### 4.2 OpenWA (rmyndharis)

| Campo | Valor |
| --- | --- |
| Repo | [rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA) (stars altas no snapshot; repo **muito novo**) |
| Docs | [docs.open-wa.org](https://docs.open-wa.org/) |
| Engines | `whatsapp-web.js` (Chromium/Puppeteer, default) e `baileys` |
| Stack | Node 22, NestJS 11, React dashboard, TypeORM, Docker (API+UI na porta 2785) |
| Integrações | Plugins (Chatwoot, Typebot), nós n8n, SDKs JS/Python/PHP |
| Licença | **MIT**, sem paywall de feature declarado |
| Pontos fortes | API + dashboard no mesmo container; PostgreSQL/Redis/S3 pluggable; HMAC em webhooks; proxy **por sessão** (recurso de produto); MIT simples. |
| Pontos fracos | Projeto jovem (2026); densidade de stars vs. idade pede cautela (avaliar issues reais, releases, quem mantém). Engine browser = **300–500 MB RAM por sessão** (o próprio README). Marketing do site mistura “segurança da conta = só comportamento” com features de proxy — isso **não** elimina fingerprint de protocolo. |

### 4.3 WAHA (WhatsApp HTTP API)

| Campo | Valor |
| --- | --- |
| Repo | [devlikeapro/waha](https://github.com/devlikeapro/waha) (~7,2k stars) |
| Docs | [waha.devlike.pro](https://waha.devlike.pro/) |
| Engines | **WEBJS** (browser), **NOWEB** (WS Node), **GOWS** (WS Go — geração atual, sem Chromium), WPP |
| Stack | Node “cola” + engines; Docker-first (`devlikeapro/waha`) |
| Licença / modelo | Open source. Até 2026.6 havia Core vs Plus. **Desde 2026.6.1** features Plus (sessões ilimitadas, mídia, Postgres/Mongo/S3, API key, métricas) estão no **Core gratuito**. Apoio opcional Community ~US$ 5/mês, sem feature extra. |
| Pontos fortes | DX limpa (Swagger, um `docker run`); **troca de engine por env**; GOWS barato em CPU/RAM; comunidade internacional ativa; changelog frequente em 2026. |
| Pontos fracos | Payloads/webhooks **diferem entre engines** (docs avisam: testar antes de trocar). Ainda é cliente não oficial. Ops (uptime, sessão, backup de credenciais) continua nosso. |

## 5. Comparativo (produto × ops × risco)

| Critério | Evolution API | OpenWA | WAHA |
| --- | --- | --- | --- |
| Cliente oficial no mesmo binário | Sim (Cloud API) | Não (só Web) | Não (só Web) |
| Engine sem browser | Baileys | Baileys | GOWS / NOWEB |
| Engine “parece WhatsApp Web” (Chromium) | Não (Baileys) | Sim (`whatsapp-web.js`) | Sim (WEBJS) |
| Multi-sessão (1 processo, N números) | Sim | Sim | Sim |
| Dashboard | Manager próprio | React completo | Dashboard + Swagger |
| Webhooks | Sim (+ filas) | HMAC | Sim |
| Docker | Sim | Sim | Melhor “5 minutos” |
| Postgres | Sim | Sim | Sim (Core atual) |
| Custo de licença de software | Ativação Foundation + cláusulas Apache extra | MIT | MIT/Apache do projeto; Core livre |
| Adequação a multi-tenant **nosso** | Instâncias isoladas por clínica | Idem | Idem; API keys por sessão (2026.1) |
| Comunidade BR | Mais forte | Emergente | Mais global |
| Manutenção do protocolo | Herda Baileys | Herda wweb.js **ou** Baileys | Herda engine escolhida |
| Risco de ban | Alto (Baileys fingerprint) | Alto; README diz wweb.js “menor” que Baileys — **não zero** | Alto; docs: “not totally safe” |
| Melhor uso hipotético neste SaaS | Ponte futura Cloud API + fallback | Se quiséssemos UI de sessão pronta | Se quiséssemos gateway magro + GOWS |

Nenhum dos três é “mais oficial”. A diferença é **empacotamento**, **engine** e **custo de ops**.

## 6. Custo: Cloud API vs self-hosted (o argumento do SaaS barato)

### 6.1 Cloud API (oficial) — ordem de grandeza Brasil (ago/2026)

Modelo vigente desde **1º jul/2025**: cobrança **por mensagem de template entregue**, por categoria e país do destinatário. Contas elegíveis no Brasil passam a faturar em **BRL** (rollout jul/2026). Fonte normativa: [Pricing — WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/pricing/).

Valores **aproximados** citados por calculadoras/BSPs em 2026 (conferir a tabela oficial antes de precificar o produto):

| Categoria | Ordem de grandeza | Uso no nosso MVP |
| --- | --- | --- |
| Utility | ~R$ 0,035 / msg (fora da janela 24 h; **grátis dentro da janela** até 30/set/2026) | Confirmação, lembrete, orçamento, recibo, anamnese |
| Authentication | ~R$ 0,035 / msg | OTP (se for por WA) |
| Marketing | ~R$ 0,32 / msg | Aniversário / recall (opt-in) |
| Service (texto livre na janela) | Grátis até **30/set/2026**; cobrado a partir de **1º/out/2026** | Inbox da recepção |

**Simulação conservadora — 1 clínica pequena (não é preço oficial):**

- 400 consultas/mês  
- 2 utility por consulta (D-1 + H-3) = 800 msgs  
- + 100 orçamentos/recibos/anamnese  

**900 utility × R$ 0,035 ≈ R$ 31,50/mês** de tarifa Meta (fora markup de BSP, se houver).  
Marketing (50 aniversários) ≈ R$ 16.

Ou seja: o volume **transacional do MVP** não é o que “torna o SaaS inviável”. O que pesa é **onboarding WABA**, não o R$ 0,03 da confirmação. Marketing em massa sim encarece — e o produto já restringe marketing a opt-in.

### 6.2 Self-hosted — o custo some da Meta e reaparece na infra

Por clínica conectada (sessão):

| Item | Ordem de grandeza |
| --- | --- |
| RAM Baileys / GOWS | dezenas de MB |
| RAM `whatsapp-web.js` / WEBJS | **300–500 MB** (OpenWA README) |
| VPS extra ou fatia da Hostinger | cresce **linear com N clínicas** |
| IP “residencial dedicado” | frequentemente **dezenas de USD/mês por IP** em provedores comerciais — **mais caro que a utility da clínica pequena** |
| Quebra de protocolo / re-pareamento QR | custo de suporte (o que mais dói em SaaS barato) |
| Número banido | custo de **perder o WhatsApp da clínica** — inaceitável no posicionamento atual |

**Conclusão de TCO:** para o mix utility do MVP, **Cloud API tende a ser mais barata e previsível** do que “gateway + IP residencial por tenant”. Self-hosted só “ganha” em campanha de marketing em massa — exatamente o uso que mais dispara detector de abuso e que o produto **não** deve fazer no MVP.

## 7. Plano de risco: não existe “100% seguro contra a Meta”

Pedido original: plano para a Meta **não descobrir** o uso de provedor não oficial, inclusive com **IPs residenciais fixos vitalícios**.

### 7.1 Resposta direta

**Não existe plano 100% seguro.** O WhatsApp **descobre** o cliente porque a sessão autentica **nos servidores da Meta**. O canal não é um “túnel escondido”: é o próprio WhatsApp. IP residencial, VPS “limpo” ou proxy só mudam **um** sinal (origem de rede). Continuam visíveis, entre outros:

- tipo de cliente / handshake do protocolo (Baileys, GOWS, etc. ≠ app oficial);
- padrão de dispositivo vinculado (WhatsApp Web / multi-device);
- volume, burst, horários, conteúdo idêntico em massa;
- reputação do número (novo, reciclado, reclamado);
- coexistência celular + vários “WhatsApp Web” simultâneos.

Nenhum fornecedor de IP “vitalício” controla o antabuso da Meta. “Vitalício” em proxy residencial é **promessa comercial**, não SLA contra ban. IPs residenciais ainda podem ser **compartilhados, CGNAT, listados ou revogados**.

Montar um playbook para **ocultar** cliente não oficial da Meta seria orientação a **evasão de termos da plataforma**. Este repositório **não documenta** receitas de fingerprint, spoof de dispositivo, aquecimento ofensivo, nem lista de provedores de IP para esse fim.

### 7.2 O único plano realmente alinhado a “não ser descoberto como não oficial”

Usar a **WhatsApp Business Cloud API** (ou BSP oficial). Aí não há o que esconder: o tráfego **é** o canal permitido.

Enquanto não houver credencial Meta:

1. **Não** conectar o número principal da clínica a gateway não oficial.  
2. Manter **e-mail** (já no desenho) e, se necessário, SMS depois, para confirmação.  
3. Manter o port `MessagingProvider` ([módulo messaging](../modulos/08-whatsapp-comunicacao.md)) para plugar Cloud API quando a WABA sair.  
4. Não vender “WhatsApp 24/7 oficial” no site se o backend for Web não oficial.

### 7.3 Se no futuro o negócio **aceitar** o risco (decisão de produto, não “invisibilidade”)

Isso seria **assumir** violação de ToS e chance de ban — nunca “garantia contra descoberta”. Controles de **higiene operacional** (não de evasão):

| Controle | Motivo |
| --- | --- |
| Número **dedicado** descartável, nunca o WhatsApp pessoal/principal da clínica | Ban não mata o canal histórico da clínica |
| Consentimento **explícito** do tenant (“este número pode ser bloqueado pela Meta”) | Risco jurídico e de suporte |
| Volume só **transacional** (lembrete de quem já agendou), zero disparo frio | Reduz abuso; não zera fingerprint |
| Rate limit no **nosso** `messaging` (já previsto: silêncio 21h–8h, teto por paciente) | Protege o produto; não “esconde” o cliente |
| Isolamento: uma sessão por tenant, credenciais fora do Postgres clínico | Falha de um número não vaza prontuário |
| Kill switch por tenant (já no RF) | Contenção quando o número cair |
| Adapter atrás de `MessagingProvider` | Trocar WAHA/Evolution/Cloud sem redesenhar domínio |
| Backup de sessão criptografado | Reconnect; **não** impede logout forçado da Meta |
| Monitorar disconnect/ban e **avisar na UI** | Não falhar em silêncio |

IPs: se alguém no mercado usa proxy por sessão, o motivo declarado é **sair de range de datacenter**. Isso **não** é plano de invisibilidade. Para este SaaS, o custo de 1 IP “residencial” por clínica provavelmente **estoura** a premissa de SaaS barato **antes** da tarifa utility da Meta.

### 7.4 Riscos extras (além da Meta)

- **LGPD:** mensagens e mídia no gateway self-hosted são dado pessoal; subprocessador nosso; backup de sessão é credencial.  
- **Suporte:** “caiu o QR” vira ticket infinito em plano barato.  
- **Concorrência:** vários dentais BR usam Web no PC da recepção; nosso diferencial declarado era **oficial 24/7**. Reverter isso **apaga** o ADR-0005 e o discurso comercial.  
- **Outubro/2026:** se a motivação for “oficial vai ficar cara na janela de serviço”, recalcular TCO **com números reais** da clínica mediana — não assumir que self-hosted ganha.

## 8. Encaixe na arquitetura deste repo

O domínio **não** deve conhecer Evolution, OpenWA ou WAHA. Continua:

```
messaging (domínio) → port MessagingProvider → adapter
```

Adapters possíveis (mutuamente exclusivos por ambiente ou por feature flag):

- `WhatsAppCloudProvider` (ADR-0005, alvo)  
- `EmailProvider` (fallback já especificado)  
- hipotético `UnofficialWhatsAppProvider` (HTTP do gateway) — **só** se um ADR futuro **substituir** o 0005  

Proibido: clínica falando com Baileys/GOWS de dentro de `models/` ou de pages Next.

Multi-tenant: **uma sessão WhatsApp = um tenant (ou uma unidade)**; API key do gateway não é compartilhada entre clínicas; mídia no S3 já previsto (ADR-0008).

## 9. Recomendação desta pesquisa (ago/2026)

**Atualização:** o produto aceitou WAHA+GOWS ([ADR-0016](../adr/0016-waha-default-messaging.md)). O texto abaixo permanece como raciocínio da pesquisa.

Caminho de conformidade que a pesquisa descreveu: Cloud API oficial ([ADR-0005](../adr/0005-whatsapp-cloud-api.md), depois supersedido).

**Se o produto optar por gateway não oficial**, a escolha é:

### Provedor: **WAHA**, engine **GOWS**

Motivo no contexto deste SaaS (muitas clínicas, VPS única, preço baixo, `MessagingProvider`):

1. **Densidade** — GOWS não sobe Chromium; RAM por sessão cabe melhor na Hostinger do que OpenWA/`whatsapp-web.js` (300–500 MB/número).  
2. **Ops** — um container Docker, Swagger, Postgres/S3 no Core desde 2026.6.1; encaixa EasyPanel ([ADR-0014](../adr/0014-deploy-easypanel-dominios.md)).  
3. **Multi-tenant** — API key por sessão (WAHA 2026.1): uma sessão = um tenant/unidade, sem chave global compartilhada.  
4. **Licença** — sem ativação em servidor de terceiro (Evolution v2.4.0 liga a Foundation) e sem cláusula de logo/aviso no produto.  
5. **Fuga de engine** — se GOWS quebrar no protocolo, dá para testar WEBJS no mesmo HTTP (com reteste de webhook). O adapter do monólito não precisa conhecer Baileys.  
6. **Manutenção 2026** — changelog frequente; Plus unificado no Core.

**Não escolher OpenWA** para este SaaS: repo novo (2026), engine default cara em RAM, densidade ruim para N clínicas.

**Não escolher Evolution como padrão** apesar da comunidade BR e do conector Cloud API: mais pesado, Baileys como caminho Web, **phone-home de licença**, Apache com atribuição. Evolution só faria sentido se a estratégia fosse “um único binário Baileys hoje / Cloud API amanhã sem trocar de gateway”. Neste repo a troca já está no port `MessagingProvider` — o segundo adapter oficial não precisa morar dentro da Evolution.

Risco de ban e ToS **não mudam** com a escolha do gateway. Número da clínica: dedicado, com aviso ao tenant.

## 10. Fontes

- [evolution-foundation/evolution-api](https://github.com/evolution-foundation/evolution-api) e LICENSE (Apache 2.0 + condições)  
- Breaking change v2.4.0 — ativação de licença (`LICENSE_REQUIRED`)  
- [rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA) · [open-wa.org](https://www.open-wa.org/) · [docs.open-wa.org](https://docs.open-wa.org/)  
- [devlikeapro/waha](https://github.com/devlikeapro/waha) · [WAHA Introduction](https://waha.devlike.pro/docs/overview/introduction/) · [WAHA Plus → Core 2026.6.1](https://waha.devlike.pro/docs/how-to/waha-plus/) · [Engines / GOWS](https://waha.devlike.pro/docs/how-to/engines/)  
- [Meta — WhatsApp Business Platform Pricing](https://developers.facebook.com/docs/whatsapp/pricing/)  
- [Upcoming pricing — service/utility from 2026-10-01](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages)  
- Discussão de TCO oficial vs não oficial (comunidade BR, não normativo): [whatsappfounders.com.br](https://www.whatsappfounders.com.br/api-whatsapp-oficial-vs-nao-oficial-preco/)  
- ADR interno: [0005](../adr/0005-whatsapp-cloud-api.md), módulo [08](../modulos/08-whatsapp-comunicacao.md)

## 11. Decisão (2026-08-14)

Produto aceitou ToS + risco de ban e **WAHA + GOWS** como default ([ADR-0016](../adr/0016-waha-default-messaging.md)). Código ainda não; ver [migracao-waha.md](../desenvolvimento/migracao-waha.md).
