# RF — WhatsApp e Comunicação (E8)

**Módulo:** `messaging` · **Detalhe:** [modulos/08-whatsapp-comunicacao.md](../../modulos/08-whatsapp-comunicacao.md) · **ADR:** [0016](../../adr/0016-waha-default-messaging.md) (WAHA default; [0005](../../adr/0005-whatsapp-cloud-api.md) supersedido)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E8-01 | Owner conecta o WhatsApp no app: checkbox obrigatório de ciência (ToS Meta, risco de ban, número dedicado) → QR / pairing code (WAHA). Teste de envio e estado da conexão visíveis. Sem WABA/token Meta no caminho feliz | Must | US-8.1, ADR-0016 |
| RF-E8-02 | Integração é server-side via WAHA (GOWS); não depende de extensão no PC da recepção nem do dashboard do WAHA aberto pelo cliente | Must | D1, ADR-0016 |
| RF-E8-03 | Sistema envia confirmação D-1 e lembrete H-3 a partir dos textos de `message_template` (nossos, sem aprovação Meta), via fila com retry | Must | US-8.2, J4 |
| RF-E8-04 | Envios respeitam fuso do tenant e janela de silêncio (não enviar 21h–8h); não enviam para agendamento cancelado | Must | US-8.2 |
| RF-E8-05 | Paciente confirma ou pede remarcação por **botão** na mensagem (fallback texto se o engine não entregar botão); webhook idempotente por `provider_message_id` | Must | US-8.3, A2 |
| RF-E8-06 | “Confirmar” altera status do agendamento; “Remarcar” abre conversa marcada para atendimento humano | Must | US-8.3, J4 |
| RF-E8-07 | Recepção usa caixa de entrada compartilhada vinculada ao paciente (telefone E.164), com não lidas e atribuição | Must | US-8.4, J9 |
| RF-E8-08 | Inbox não aplica regra de **preço** da janela 24 h da Meta. Indicador de “conversa recente” (se houver) é UX — decidir na implementação | Must | US-8.4 |
| RF-E8-09 | Atendente envia texto/anexo na conversa; histórico persiste no paciente (S7) | Must | US-8.4, J9 |
| RF-E8-10 | Ações contextuais na conversa: agendar, enviar orçamento, anamnese, recibo, cobrança | Should | J9 |
| RF-E8-11 | Owner visualiza **volume e falhas** do período (não R$ Meta) e desliga automações (kill switch) | Must | US-8.5, D6 |
| RF-E8-12 | Textos do MVP cobrem: criação, confirmação, lembrete, cancelamento, fila de espera, orçamento, recibo, anamnese, inadimplência | Must | módulo messaging |
| RF-E8-13 | Textos **nunca** contêm diagnóstico, procedimento ou dado clínico | Must | doc 10 |
| RF-E8-14 | Marketing exige opt-in; bloqueio registrado como `BLOCKED_NO_CONSENT` (não silencioso) | Must | US-3.4, doc 10 |
| RF-E8-15 | Sem franquia/crédito Meta. Anti-spam: teto por paciente/mês por automação; kill switch pausa envios | Must | US-8.5 |
| RF-E8-16 | Sessão caiu / kill switch: automação não dispara, alerta no painel, agendamento **não** é bloqueado | Must | A8 |
| RF-E8-17 | Usage conta envios/falhas; **não** debita crédito no delivery | Must | ADR-0016 |
| RF-E8-18 | Webhook valida HMAC do WAHA; responde 200 rápido e processa em fila; tenant pelo `session` | Must | API §3.5 |
| RF-E8-19 | Toda mensagem enviada (manual ou automática) é auditável (quem/template/quando/resultado) | Must | D6, doc 10 |
| RF-E8-20 | Owner vê fila de envios agendados e pode cancelar envio pendente | Should | módulo messaging |
| RF-E8-21 | Fallback por e-mail quando WhatsApp indisponível (mensagens ficam na fila; UI avisa) | Should | módulo messaging |

## Critérios de aceite transversais (E8)

- Mesmo `provider_message_id` processado duas vezes → um efeito.
- Assinatura HMAC inválida → 401, nada enfileirado.
- Cancelar/mover agendamento cancela lembretes do horário antigo.
- Limite por paciente/mês por automação (anti-spam).
- QR só depois de `risk_accepted_at`.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E8-22 | Campanhas de marketing em massa / chatbot IA | Could (fase 3) |
| RF-E8-23 | SMS como canal principal de contingência | Could (fase 2) |
