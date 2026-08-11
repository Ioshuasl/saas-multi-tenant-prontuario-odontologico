# RF — Agenda (E4)

**Módulo:** `scheduling` · **Detalhe:** [modulos/04-agenda.md](../../modulos/04-agenda.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E4-01 | Recepção visualiza agenda dia/semana por profissional e/ou cadeira, com grade configurável (10/15/20/30/60 min) | Must | US-4.1, J2 |
| RF-E4-02 | Agendamentos exibem status coloridos: Solicitado, Agendado, Confirmado, Atendendo, Atendido, Faltou, Cancelado | Must | US-4.1, benchmark |
| RF-E4-03 | Recepção cria agendamento a partir de slot livre em no máximo 3 interações (paciente, procedimento/duração, confirmação) | Must | US-4.2, J2 |
| RF-E4-04 | Duração padrão vem do procedimento; usuário pode ajustar | Must | US-4.2 |
| RF-E4-05 | Recepção move/redimensiona agendamento (drag & drop); conflito é rejeitado com mensagem clara; histórico registra quem/quando/de-para | Must | US-4.3 |
| RF-E4-06 | Sistema impede double-booking do mesmo profissional ou cadeira no mesmo intervalo (constraint no banco + validação na aplicação) | Must | US-4.4, A1 |
| RF-E4-07 | Em conflito de slot, API retorna `409 SLOT_UNAVAILABLE` com sugestão de horários | Must | US-4.4, A1 |
| RF-E4-08 | Recepção bloqueia horários (reunião, manutenção, férias) por profissional, cadeira ou unidade | Must | US-4.5 |
| RF-E4-09 | Bloqueio sobre agendamentos existentes lista conflitos e não cancela automaticamente | Must | módulo scheduling |
| RF-E4-10 | Recepção cria compromisso recorrente (ex.: manutenção ortodôntica); exclusão com escopo esta/futuras/todas | Must | US-4.6 |
| RF-E4-11 | Paciente agenda pelo link público `/agendar/{slug}` vendo apenas horários realmente livres | Must | US-4.7, J3 |
| RF-E4-12 | Autoagendamento exige identificação + OTP (WhatsApp/SMS); rate limit por IP/telefone; política do tenant define status Solicitado ou Agendado | Must | US-4.7, J3 |
| RF-E4-13 | Autoagendamento respeita antecedência mínima/máxima, expediente e procedimentos marcados como públicos | Must | J3 |
| RF-E4-14 | Recepção mantém fila de espera com preferências (profissional, procedimento, períodos) | Must | US-4.8, J5 |
| RF-E4-15 | Ao cancelar ou marcar falta, sistema oferece o horário a pacientes compatíveis da fila (WhatsApp utility); primeiro aceite ocupa o slot | Must | US-4.8, J5, A7 |
| RF-E4-16 | Transições de status seguem máquina de estados; transição inválida → `409 INVALID_STATE_TRANSITION` | Must | módulo scheduling |
| RF-E4-17 | Cancelamento exige motivo; falta (NO_SHOW) só após horário de início; concluído só a partir de “Atendendo” | Must | módulo scheduling |
| RF-E4-18 | Ao criar/mover agendamento, sistema agenda confirmação D-1 e lembrete H-3; ao cancelar/mover, cancela jobs antigos | Must | J2, J4, E8 |
| RF-E4-19 | Confirmação do paciente (botão WhatsApp ou link) atualiza status para Confirmado | Must | J4, A2 |
| RF-E4-20 | Agenda atualiza em tempo quase real entre usuários da mesma clínica (SSE ou equivalente) | Should | doc 09 |
| RF-E4-21 | Agendamento concluído sem evolução gera pendência visível ao dentista (não bloqueia operação) | Should | módulo scheduling |

## Critérios de aceite transversais (E4)

- 20 requisições concorrentes no mesmo slot → exatamente 1 sucesso.
- Nenhuma notificação enviada na janela de silêncio (21h–8h no fuso do tenant).
- Agenda do dia com 200 agendamentos responde em &lt; 1 s (ver RNF-PERF).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E4-22 | Central de retorno / recall automático | Could (fase 2) |
| RF-E4-23 | Integração com Alexa / assistentes de voz | Won't (MVP) |
