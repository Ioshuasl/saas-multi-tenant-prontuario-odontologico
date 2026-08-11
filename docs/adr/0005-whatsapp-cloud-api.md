# ADR-0005 — WhatsApp Business Cloud API oficial (não WhatsApp Web)

- **Status:** Aceito
- **Data:** 2026-08-11

## Contexto

WhatsApp é o canal de comunicação real entre clínica e paciente no Brasil, e confirmação de consulta por WhatsApp é o recurso com efeito mais direto sobre a receita da clínica (reduz cadeira vazia).

Existem três caminhos de integração:

1. **Extensão de navegador sobre o WhatsApp Web** — abordagem que o material público de vários concorrentes descreve (por exemplo, Simples Dental e Codental documentam integração via WhatsApp Web).
2. **Biblioteca não oficial** que automatiza o protocolo do WhatsApp Web (`whatsapp-web.js`, Baileys e similares).
3. **WhatsApp Business Cloud API oficial**, da Meta.

## Decisão

**Cloud API oficial**, com número dedicado por clínica (WABA própria do cliente ou número conectado via nosso onboarding), templates aprovados e webhook server-side.

Consequências de desenho que essa decisão impõe ao produto:

- Envio proativo só por **template aprovado**, com categoria (`marketing`, `utility`, `authentication`, `service`).
- A cobrança da Meta é **por mensagem de template entregue** desde 1º de julho de 2025, com preço por categoria; mensagens fora de template dentro de uma janela de atendimento aberta (24 h após mensagem do paciente) não são cobradas ([documentação oficial de preços](https://developers.facebook.com/docs/whatsapp/pricing/)). Modelamos janela, categoria e consumo desde o MVP.
- Marketing exige **opt-in** registrado (verificado em `patients`).
- Webhook precisa de verificação de assinatura, resposta rápida e idempotência por `wamid`.

## Consequências

**Positivas**

- **Funciona 24/7 sem computador ligado.** Confirmação D-1 e lembrete H-3 saem no horário certo, inclusive com a clínica fechada — é isso que faz o recurso funcionar.
- Entrega e status confiáveis (`sent`/`delivered`/`read`/`failed`), viabilizando métrica de taxa de confirmação e cobrança justa de créditos.
- **Botões interativos** ("Confirmar" / "Cancelar") com resposta processada automaticamente pelo backend — sem ninguém digitar nada.
- Múltiplos atendentes na mesma caixa de entrada, com histórico central vinculado ao paciente.
- Conformidade com a política da Meta: sem risco de banimento do número da clínica (que é o telefone principal do negócio).
- Estável: não quebra quando o WhatsApp Web muda a interface.

**Negativas / custos aceitos**

- **Custo variável** por mensagem de template. Mitigação: preferência por categoria `utility`, franquia por plano, créditos pré-pagos, medição por tenant e transparência de consumo.
- **Onboarding mais burocrático**: verificação do negócio na Meta e aprovação de número podem levar dias. Mitigação: iniciar o processo na Sprint 1 (não na Sprint 3), guia passo a passo no produto, número de teste para desenvolvimento e fallback por e-mail enquanto não aprovado. Este é o principal risco de cronograma do MVP (R1 no [roadmap](../13-roadmap-estimativas.md)).
- **Templates precisam de aprovação** e não permitem texto livre proativo. Mitigação: submeter os templates do MVP com antecedência e manter alternativas.
- Não é possível migrar o histórico de conversas anteriores do celular da clínica.
- Depender de um provedor único é risco de plataforma. Mitigação: `messaging` isola o provedor atrás de um port (`MessagingProvider`), permitindo trocar por outro BSP ou adicionar SMS/e-mail sem tocar no domínio.

## Alternativas rejeitadas

**Extensão de navegador sobre WhatsApp Web:** parece equivalente na demonstração comercial e é radicalmente pior na operação. Depende do computador da recepção ligado, do navegador aberto e da sessão ativa; não envia lembrete de manhã antes de alguém chegar; perde mensagens quando a máquina reinicia; não suporta bem múltiplos atendentes; e está sujeita a quebrar com qualquer mudança do WhatsApp. Além disso, empurra o custo real (tempo da recepção, mensagens não enviadas) para o cliente de forma invisível. Rejeitar isso é uma decisão de **produto**, não só técnica — é um dos nossos diferenciais declarados.

**Bibliotecas não oficiais:** violam os termos de uso do WhatsApp e expõem o número da clínica a banimento. Para uma clínica, perder o número do WhatsApp é perder o canal de contato com a base de pacientes. Risco inaceitável para nós e para o cliente.

**Não integrar WhatsApp no MVP:** inviável comercialmente — todos os concorrentes relevantes têm alguma forma de integração, e é o recurso mais pedido.

## Desenho técnico resultante

```
Port (application)                Adapter (infrastructure)
MessagingProvider {               WhatsAppCloudProvider
  sendTemplate(...)                 → POST /{phone_number_id}/messages
  sendFreeText(...)                 → só com janela aberta
  getTemplates()                    → catálogo da WABA
}                                 EmailProvider (fallback)
                                  SmsProvider (fase 2)
```

Webhook: verificar assinatura → responder 200 → enfileirar job idempotente por `wamid` → processar. Consumo de crédito debitado no **callback de entrega**, não no envio.

## Verificação

- Mesmo `wamid` processado duas vezes gera um único efeito.
- Webhook com assinatura inválida é recusado sem enfileirar.
- Botão "Confirmar" muda o agendamento para `CONFIRMED`.
- Cancelamento do agendamento cancela os envios pendentes.
- Janela de silêncio (21h–8h) respeitada.
- Marketing sem opt-in bloqueado e registrado.
- Provedor indisponível: mensagens permanecem na fila e a UI avisa.

## Referências

- [docs/modulos/08-whatsapp-comunicacao.md](../modulos/08-whatsapp-comunicacao.md)
- [WhatsApp Business Platform — Pricing](https://developers.facebook.com/docs/whatsapp/pricing/)
- [docs/02-benchmark-mercado.md](../02-benchmark-mercado.md)
