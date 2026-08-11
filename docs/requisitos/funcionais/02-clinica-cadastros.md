# RF — Clínica e Cadastros (E2)

**Módulo:** `clinic` · **Detalhe:** [modulos/02-clinica-cadastros.md](../../modulos/02-clinica-cadastros.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E2-01 | Owner cadastra/edita dados da clínica: razão social, CNPJ/CPF, CRO do responsável técnico, endereço, telefone e fuso horário (IANA) | Must | US-2.1, J1 |
| RF-E2-02 | Sistema mantém Tenant com `slug` único global para link público de autoagendamento | Must | J3, doc 06 |
| RF-E2-03 | Sistema cria Unidade padrão no signup; Owner pode gerenciar unidades (multi-unidade na UI é fase 2; modelo já com `unit_id`) | Must | E2, doc 06 |
| RF-E2-04 | Owner cadastra cadeiras/consultórios por unidade (nome, cor, ativo) | Must | E2 |
| RF-E2-05 | Owner define horário de funcionamento por dia da semana (unidade e/ou profissional), com intervalos (ex.: almoço) | Must | US-2.2 |
| RF-E2-06 | Owner registra exceções de horário por data (feriado, férias) sem cancelar agendamentos automaticamente; sistema lista conflitos | Must | US-2.2, módulo clinic |
| RF-E2-07 | Disponibilidade efetiva de um profissional é a interseção entre horário da unidade, horário do profissional e exceções | Must | módulo clinic |
| RF-E2-08 | Owner mantém catálogo de procedimentos: código, nome, especialidade, duração padrão, preço em centavos, flags de dente/face | Must | US-2.3 |
| RF-E2-09 | No signup (ou sob demanda), sistema importa catálogo padrão sugerido; preços iniciam em zero para a clínica definir | Must | US-2.3, J1 |
| RF-E2-10 | Alteração de preço no catálogo não altera orçamentos já emitidos | Must | módulo clinic |
| RF-E2-11 | Owner cadastra profissionais vinculados a membership: CRO, UF, especialidades, cor na agenda, ativo | Must | J1, E2 |
| RF-E2-12 | Dentista sem CRO não pode assinar evolução clínica | Must | módulo clinic / clinical-records |
| RF-E2-13 | Procedimento, cadeira e profissional com histórico só podem ser inativados (não excluídos fisicamente) | Must | módulo clinic |
| RF-E2-14 | Owner configura formas de pagamento aceitas pela clínica | Must | E2 |
| RF-E2-15 | Wizard de onboarding permite concluir configuração mínima e gerar link público; passos além dos obrigatórios podem ser pulados | Must | J1 |

## Critérios de aceite transversais (E2)

- Timezone do tenant governa agenda e automações; banco persiste UTC.
- Duas unidades padrão simultâneas são impossíveis.
- Código de procedimento único por tenant.
- Slug duplicado entre tenants é rejeitado.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E2-16 | Interface de consolidação multi-unidade e ranking | Could (fase 2) |
| RF-E2-17 | Tabelas de preço por convênio | Could (fase 2) |
