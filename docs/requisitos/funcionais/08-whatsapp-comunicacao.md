# RF — WhatsApp e Comunicação (E8)

**Módulo:** `messaging` · **Detalhe:** [modulos/08-whatsapp-comunicacao.md](../../modulos/08-whatsapp-comunicacao.md) · **ADR:** [0005](../../adr/0005-whatsapp-cloud-api.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E8-01 | Owner conecta número da clínica via WhatsApp Cloud API (fluxo guiado WABA/número/token) com teste de envio e estado da conexão visível | Must | US-8.1 |
| RF-E8-02 | Integração é server-side (Cloud API oficial); não depende de WhatsApp Web nem do computador da recepção ligado | Must | D1, ADR-0005 |
| RF-E8-03 | Sistema envia confirmação D-1 e lembrete H-3 por templates de utilidade, via fila com retry | Must | US-8.2, J4 |
| RF-E8-04 | Envios respeitam fuso do tenant e janela de silêncio (não enviar 21h–8h); não enviam para agendamento cancelado | Must | US-8.2 |
| RF-E8-05 | Paciente confirma ou pede remarcação por botão na mensagem; webhook idempotente por `wamid` | Must | US-8.3, A2 |
| RF-E8-06 | “Confirmar” altera status do agendamento; “Remarcar” abre conversa marcada para atendimento humano | Must | US-8.3, J4 |
| RF-E8-07 | Recepção usa caixa de entrada compartilhada vinculada ao paciente (telefone E.164), com não lidas e atribuição | Must | US-8.4, J9 |
| RF-E8-08 | Inbox indica explicitamente se a janela de 24h está aberta (texto livre) ou fechada (só template) | Must | US-8.4, doc 02 |
| RF-E8-09 | Dentro da janela, atendente envia texto/anexo; histórico persiste no paciente | Must | US-8.4, J9 |
| RF-E8-10 | Ações contextuais na conversa: agendar, enviar orçamento, anamnese, recibo, cobrança | Should | J9 |
| RF-E8-11 | Owner visualiza consumo/custo de mensagens do período e desliga qualquer automação (kill switch) | Must | US-8.5, D6 |
| RF-E8-12 | Templates do MVP cobrem: criação, confirmação, lembrete, cancelamento, fila de espera, orçamento, recibo, anamnese, inadimplência | Must | módulo messaging |
| RF-E8-13 | Templates **nunca** contêm diagnóstico, procedimento ou dado clínico | Must | doc 10 |
| RF-E8-14 | Marketing exige opt-in; bloqueio registrado como `BLOCKED_NO_CONSENT` (não silencioso) | Must | US-3.4, doc 10 |
| RF-E8-15 | Créditos/franquia: marketing bloqueado sem saldo; confirmações críticas podem usar margem de cortesia configurável | Must | US-8.5, A8 |
| RF-E8-16 | Sem crédito: automação não dispara, alerta no painel, agendamento **não** é bloqueado | Must | A8 |
| RF-E8-17 | Consumo debitado no callback de entrega (mensagem não entregue não consome) | Must | módulo messaging |
| RF-E8-18 | Webhook valida assinatura Meta; responde 200 rápido e processa em fila | Must | API §3.5 |
| RF-E8-19 | Toda mensagem enviada (manual ou automática) é auditável (quem/template/quando/resultado) | Must | D6, doc 10 |
| RF-E8-20 | Owner vê fila de envios agendados e pode cancelar envio pendente | Should | módulo messaging |
| RF-E8-21 | Fallback por e-mail quando WhatsApp indisponível (mensagens ficam na fila; UI avisa) | Should | módulo messaging |

## Critérios de aceite transversais (E8)

- Mesmo `wamid` processado duas vezes → um efeito.
- Assinatura inválida → 401, nada enfileirado.
- Cancelar/mover agendamento cancela lembretes do horário antigo.
- Limite por paciente/mês por automação (anti-spam).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E8-22 | Campanhas de marketing em massa / chatbot IA | Could (fase 3) |
| RF-E8-23 | SMS como canal principal de contingência | Could (fase 2) |
