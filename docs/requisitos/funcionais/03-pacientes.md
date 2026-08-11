# RF — Pacientes (E3)

**Módulo:** `patients` · **Detalhe:** [modulos/03-pacientes-crm.md](../../modulos/03-pacientes-crm.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E3-01 | Recepção/Dentista cadastra paciente com mínimo nome + telefone; demais campos podem ser completados depois | Must | US-3.1, J2 |
| RF-E3-02 | Sistema valida CPF quando informado e impede CPF duplicado no mesmo tenant (`409` + link para o existente) | Must | US-3.1 |
| RF-E3-03 | Cadastro com telefone já existente gera aviso de possível duplicata (não bloqueia por padrão — pode ser familiar) | Must | módulo patients |
| RF-E3-04 | Busca de paciente por nome parcial (sem acento), telefone (incl. últimos 4 dígitos), CPF ou código da ficha | Must | US-3.2 |
| RF-E3-05 | Sistema registra responsável legal para menores de 18 anos; manutenível no cadastro | Must | US-3.3 |
| RF-E3-06 | Menor sem responsável: aviso não bloqueante no cadastro; bloqueante na aprovação de orçamento pelo próprio paciente | Must | US-3.3, treatments |
| RF-E3-07 | Owner/equipe registra consentimentos versionados (tratamento de dados, WhatsApp marketing, uso de imagem) com data, canal e versão do texto | Must | US-3.4 |
| RF-E3-08 | Sem consentimento de marketing, o sistema não envia mensagens de categoria marketing; mensagens transacionais seguem permitidas | Must | US-3.4, messaging |
| RF-E3-09 | Usuário autorizado visualiza timeline do paciente (agenda, clínico, orçamentos, pagamentos, mensagens) filtrada pelas permissões do papel | Must | US-3.5 / E3, J6 |
| RF-E3-10 | Timeline da recepção omite itens clínicos (não exibe como “bloqueado”) | Must | módulo patients, A3 |
| RF-E3-11 | Exclusão de paciente é inativação (soft delete); remoção real só via fluxo LGPD de anonimização | Must | E3, doc 10 |
| RF-E3-12 | Inativação com parcela em aberto ou agendamento futuro exige confirmação explícita | Must | módulo patients |
| RF-E3-13 | Paciente possui código sequencial legível por tenant (nº de ficha), imutável | Must | módulo patients |
| RF-E3-14 | Sistema registra origem/indicação do paciente (base para CRM futuro) e tags administrativas | Should | E3, fase 2 CRM |
| RF-E3-15 | Nome social, quando informado, é o preferencial na UI | Should | módulo patients |

## Critérios de aceite transversais (E3)

- Mesmo CPF em tenants diferentes é permitido.
- Observações do cadastro são administrativas — conteúdo clínico vai para evolução.
- Revogação de consentimento de marketing interrompe envios subsequentes imediatamente.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E3-16 | Fusão de duplicatas (merge de prontuário/agenda/financeiro) | Could (fase 2) |
| RF-E3-17 | CRM/funil de orçamentos, campanhas e recall automático | Could (fase 2) |
