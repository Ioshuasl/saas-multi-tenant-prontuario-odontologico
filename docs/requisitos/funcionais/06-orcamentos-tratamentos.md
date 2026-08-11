# RF — Orçamentos e Tratamentos (E6)

**Módulo:** `treatments` · **Detalhe:** [modulos/06-orcamentos-tratamentos.md](../../modulos/06-orcamentos-tratamentos.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E6-01 | Dentista/recepção monta orçamento com procedimentos, dentes/faces, quantidade, desconto e validade | Must | US-6.1, J7 |
| RF-E6-02 | Preço do item é copiado do catálogo na emissão; mudanças posteriores no catálogo não alteram o orçamento | Must | módulo treatments |
| RF-E6-03 | Procedimento que exige dente/face rejeita item sem essa informação | Must | módulo treatments |
| RF-E6-04 | Desconto respeita limite por papel; acima do limite exige aprovação do Owner e fica auditado | Must | módulo treatments |
| RF-E6-05 | Orçamento em rascunho é editável; após envio, fluxo segue máquina de estados (enviado, aprovado, parcial, rejeitado, expirado) | Must | US-6.1 |
| RF-E6-06 | Recepção envia orçamento em PDF por WhatsApp/e-mail com link de visualização | Must | US-6.2, J7 |
| RF-E6-07 | Paciente aprova/rejeita pelo link público ou presencialmente na recepção | Must | US-6.3, J7 |
| RF-E6-08 | Aprovação parcial é suportada: plano e título nascem só com itens aprovados | Must | US-6.3 |
| RF-E6-09 | Ao aprovar, sistema cria atomicamente Plano de Tratamento + itens + Contas a Receber/parcelas (`Idempotency-Key` obrigatório) | Must | US-6.3, A4 |
| RF-E6-10 | Soma das parcelas + entrada = total aprovado; resíduo de arredondamento na primeira parcela | Must | US-6.3, A4 |
| RF-E6-11 | Orçamento expirado não aceita decisão; pode ser duplicado com preços atualizados | Must | módulo treatments |
| RF-E6-12 | Rejeição registra motivo (insumo para CRM futuro) | Should | módulo treatments |
| RF-E6-13 | Dentista marca item do plano como executado apenas via evolução clínica assinada (sem atalho que ignore prontuário) | Must | US-6.4, J6 |
| RF-E6-14 | Execução atualiza odontograma, vincula evolução e gera lançamento de produção | Must | US-6.4 |
| RF-E6-15 | Item já executado não pode ser cancelado; correção financeira via estorno | Must | módulo treatments |
| RF-E6-16 | Menor de idade: decisão de orçamento pelo link só pelo responsável legal | Must | patients + treatments |
| RF-E6-17 | PDF do orçamento contém dados da clínica (CNPJ, CRO responsável), paciente, itens e valores — sem diagnóstico detalhado | Must | módulo treatments |
| RF-E6-18 | Usuário consulta progresso do plano (% concluído, valor executado vs pendente) | Should | módulo treatments |

## Critérios de aceite transversais (E6)

- Duplo POST de decisão com a mesma `Idempotency-Key` cria um plano e um título.
- Falha ao criar título faz rollback do plano e do status do orçamento.
- Teste de propriedade cobre parcelamentos com qualquer total e N parcelas.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E6-19 | Contratos, termos e assinatura eletrônica do paciente com validade jurídica | Could (fase 2) |
| RF-E6-20 | CRM/funil de orçamentos não aprovados | Could (fase 2) |
