# ADR-0016 — WAHA (GOWS) como provedor WhatsApp default

- **Status:** Aceito
- **Data:** 2026-08-14
- **Supersede:** [ADR-0005](./0005-whatsapp-cloud-api.md)
- **Pesquisa:** [docs/pesquisa/whatsapp-provedores-self-hosted.md](../pesquisa/whatsapp-provedores-self-hosted.md)
- **Plano de migração (docs, sem código nesta leva):** [docs/desenvolvimento/migracao-waha.md](../desenvolvimento/migracao-waha.md)

## Contexto

O ADR-0005 escolheu a WhatsApp Business Cloud API oficial (WABA, templates aprovados, tarifa por mensagem). Sem credencial Meta, o onboarding trava o marco M2. O produto precisa de SaaS barato e já há um WAHA na VPS (`waha.ioshuavps.com.br`).

Comparativo Evolution / OpenWA / WAHA: [ADR-0015](./0015-avaliacao-gateways-whatsapp-nao-oficiais.md). Escolha de gateway: **WAHA + GOWS**.

## Decisão

1. **Default de produção (quando o adapter for ligado):** WAHA self-hosted, engine **GOWS**, um processo para todos os tenants.
2. Manter o port `MessagingProvider`. Cloud API só se um dia `MESSAGING_PROVIDER=cloud` (ou equivalente) for ligado — não é o caminho feliz.
3. Onboarding **no nosso SaaS**: checkbox obrigatório de ciência (ToS da Meta, risco de ban, número **dedicado**) → criar sessão no WAHA → QR / pairing code no app. A clínica **não** acessa o dashboard do WAHA.
4. Frontend **nunca** chama o WAHA. Chave `WAHA_API_KEY` só no backend.
5. Sem débito de crédito Meta. Kill switch + anti-spam (silêncio 21h–8h, teto por paciente). Usage = volume e falhas.
6. Confirmação D-1: botões Confirmar / Cancelar via WAHA; se o engine não entregar botão, fallback texto (na implementação, perguntar se GOWS na VPS aguenta botão).
7. **Não** há plano de ocultação da Meta (IP residencial, fingerprint). Risco de ban é aceito e declarado ao tenant.

## Consequências

**Positivas**

- Sem WABA / aprovação de template / tarifa por mensagem no caminho default.
- Continua **server-side 24/7**, sem extensão no PC da recepção (diferencial vs. concorrentes Web-no-browser).
- Densidade de sessões melhor com GOWS do que com Chromium.
- Troca futura de provedor continua no port.

**Negativas / custos aceitos**

- Viola os Termos de Serviço do WhatsApp. Número pode ser **banido**; o aviso obriga número dedicado, não o WhatsApp principal da clínica.
- Sessão QR pode cair; suporte operacional maior que Cloud API.
- Sem selo / templates oficiais da Meta. Textos são nossos, renderizados no adapter.
- Código atual ainda instancia Cloud em production — esta leva **só documenta**; implementação quando pedida.

## Alternativas rejeitadas

- Manter ADR-0005 até ter WABA (bloqueia M2 sem credencial).
- Evolution ou OpenWA como default (ADR-0015 §5 / pesquisa §9).
- Clínica emparelha no dashboard do WAHA.
- Dashboard WAHA exposto ao cliente.
- Créditos como cobrança do SaaS só porque a Meta cobrava.
- Playbook para a Meta “não descobrir” o cliente.

## Verificação (quando o código existir)

- QR só depois do checkbox de ciência persistido (`risk_accepted_at`).
- Uma sessão WAHA por tenant (`session_name` estável).
- Webhook HMAC do WAHA; tenant resolvido pelo `session`, não por `phone_number_id` da Meta.
- Fake em test/dev; production default WAHA.
- Kill switch e disconnect fazem logout da sessão no WAHA.
- Marketing sem opt-in → `BLOCKED_NO_CONSENT`.
- Sem débito em `message_credit_ledger` no caminho WAHA.

## Referências

- [RF E8](../requisitos/funcionais/08-whatsapp-comunicacao.md)
- [Módulo messaging](../modulos/08-whatsapp-comunicacao.md)
- [API v1 §2.8](../08-api-v1.md)
