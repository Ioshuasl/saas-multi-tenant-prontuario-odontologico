# RF — Prontuário Clínico (E5)

**Módulo:** `clinical-records` · **Detalhe:** [modulos/05-prontuario.md](../../modulos/05-prontuario.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E5-01 | Ao criar paciente, sistema cria prontuário (`MedicalRecord`) 1:1 | Must | patients → clinical-records |
| RF-E5-02 | Clínica mantém formulário de anamnese configurável (JSON versionado); alterar cria nova versão | Must | US-5.2, E5 |
| RF-E5-03 | Paciente responde anamnese por link com token de uso único e expiração; respostas entram no prontuário | Must | US-5.2, J3 |
| RF-E5-04 | Respostas que disparam alerta geram alertas clínicos (alergia, condição, medicação) com severidade | Must | US-5.2, J6 |
| RF-E5-05 | Alertas CRITICAL ficam fixos e destacados no topo do atendimento; não são dispensáveis | Must | J6, módulo prontuário |
| RF-E5-06 | Dentista usa odontograma clicável (permanente e decídua, notação FDI) por dente e/ou face | Must | US-5.1, J6 |
| RF-E5-07 | Sistema registra condições (sadio, cariado, restaurado, ausente, implante, coroa, canal, extraído, etc.) com histórico por dente | Must | US-5.1 |
| RF-E5-08 | Execução de procedimento atualiza odontograma conforme mapeamento (ex.: restauração → RESTAURADO) | Must | US-5.1, treatments |
| RF-E5-09 | Dentista registra evolução clínica assinada (usuário, CRO, timestamp, hash do conteúdo) | Must | US-5.3, J6 |
| RF-E5-10 | Evolução é imutável (append-only): não há edição/exclusão destrutiva; API retorna `423 RECORD_IMMUTABLE` | Must | US-5.3, A6 |
| RF-E5-11 | Correção de evolução cria nova versão com motivo obrigatório, preservando a anterior consultável | Must | US-5.3, A6 |
| RF-E5-12 | Toda leitura e escrita de prontuário/evolução/anexo/anamnese é auditada com `patient_id` | Must | US-5.3, doc 10 |
| RF-E5-13 | Dentista anexa imagens/PDF ao prontuário via upload pré-assinado; tipos e tamanho validados; cota por plano | Must | US-5.4 |
| RF-E5-14 | Download de anexo usa URL assinada de curta duração e gera auditoria | Must | US-5.4 |
| RF-E5-15 | Exclusão de anexo é lógica (motivo + autor); arquivo permanece no período de guarda | Must | módulo prontuário |
| RF-E5-16 | Tela de atendimento unifica alertas, odontograma, plano de tratamento, evolução e histórico | Must | J6, doc 09 |
| RF-E5-17 | Templates/atalhos de texto por procedimento auxiliarem o registro; rascunho local até assinar | Should | J6 |
| RF-E5-18 | Anamnese com mais de 12 meses é sinalizada como desatualizada no atendimento | Should | módulo prontuário |
| RF-E5-19 | Comparação lado a lado de fotos por data (antes/depois) | Should | módulo prontuário |
| RF-E5-20 | Auxiliar (ASB) lê prontuário e anexa; não registra evolução | Must | matriz de permissões |

## Critérios de aceite transversais (E5)

- Recepção e Financeiro: `403` em rotas clínicas + auditoria.
- Dentista sem CRO não assina evolução.
- Trigger no banco bloqueia UPDATE/DELETE em `clinical_note`.
- Anexo de outro tenant → `404` (não `403`).
- No MVP a assinatura é eletrônica simples — **não** afirmar eliminação do papel (ver doc 10).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E5-21 | Assinatura digital ICP-Brasil + requisitos NGS2 | Could (fase 2) |
| RF-E5-22 | Receituário/atestado com certificado A1/A3 | Could (fase 2) |
| RF-E5-23 | Fichas clínicas por especialidade / ortodontia / HOF | Could (fase 3) |
| RF-E5-24 | Transcrição de evolução por IA | Could (fase 3) |
