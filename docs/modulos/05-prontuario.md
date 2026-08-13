# Módulo — Prontuário Clínico (`clinical-records`)

## 1. Responsabilidade

Guardar o registro clínico do paciente com **integridade, autoria e rastreabilidade**: anamnese, alertas, odontograma, evoluções e anexos. É o módulo mais sensível do sistema, tanto pelo valor clínico quanto pelo risco jurídico. Aqui, perder ou alterar dado silenciosamente é falha inaceitável.

Princípio: **append-only**. Nada é editado; correções geram nova versão que referencia a anterior.

## 2. Agregados

| Agregado | Papel |
| --- | --- |
| `MedicalRecord` | Raiz por paciente; agrega anamneses, alertas, odontograma e evoluções |
| `AnamnesisResponse` | Respostas a um formulário versionado; gera alertas |
| `ToothState` (+ `ToothStateHistory`) | Estado atual e histórico por dente/face |
| `ClinicalNote` | Evolução imutável, assinada, versionada |
| `Attachment` | Arquivo (imagem, RX, PDF) com metadados e checksum |

## 3. Anamnese configurável

Formulário definido por JSON schema versionado — cada clínica ajusta perguntas sem mudança de código, e a resposta guarda a versão respondida.

```json
{
  "name": "Anamnese Geral",
  "version": 2,
  "questions": [
    { "id": "allergy_meds", "label": "Possui alergia a medicamentos?", "type": "BOOLEAN_WITH_TEXT",
      "alertWhen": { "equals": true }, "alertSeverity": "CRITICAL", "alertCategory": "ALLERGY" },
    { "id": "anticoagulant", "label": "Usa anticoagulante?", "type": "BOOLEAN_WITH_TEXT",
      "alertWhen": { "equals": true }, "alertSeverity": "CRITICAL", "alertCategory": "MEDICATION" },
    { "id": "diabetes", "label": "É diabético?", "type": "SINGLE_CHOICE",
      "options": ["Não", "Tipo 1", "Tipo 2", "Gestacional"],
      "alertWhen": { "notEquals": "Não" }, "alertSeverity": "WARNING", "alertCategory": "CONDITION" },
    { "id": "pregnant", "label": "Está gestante?", "type": "BOOLEAN",
      "showWhen": { "patientGender": "F" }, "alertWhen": { "equals": true }, "alertSeverity": "CRITICAL" },
    { "id": "hypertension", "label": "Tem pressão alta?", "type": "BOOLEAN_WITH_TEXT", "alertWhen": { "equals": true }, "alertSeverity": "WARNING" },
    { "id": "cardiac", "label": "Problema cardíaco?", "type": "BOOLEAN_WITH_TEXT", "alertWhen": { "equals": true }, "alertSeverity": "CRITICAL" },
    { "id": "smoker", "label": "Fumante?", "type": "SINGLE_CHOICE", "options": ["Não", "Sim", "Ex-fumante"] },
    { "id": "anesthesia_reaction", "label": "Já teve reação a anestesia?", "type": "BOOLEAN_WITH_TEXT", "alertWhen": { "equals": true }, "alertSeverity": "CRITICAL" },
    { "id": "bleeding", "label": "Sangramento excessivo em extrações?", "type": "BOOLEAN_WITH_TEXT", "alertWhen": { "equals": true }, "alertSeverity": "WARNING" },
    { "id": "current_meds", "label": "Medicamentos em uso", "type": "TEXT" },
    { "id": "main_complaint", "label": "Queixa principal", "type": "TEXT", "required": true }
  ]
}
```

Regras:

1. Alterar um formulário **cria nova versão**; respostas antigas continuam legíveis com as perguntas da versão em que foram respondidas.
2. Respostas com `alertWhen` satisfeito geram `ClinicalAlert` automaticamente; alertas `CRITICAL` aparecem em vermelho, fixos no topo da tela de atendimento, e não podem ser dispensados.
3. O paciente pode responder por link (`/public/anamnesis/:token`, uso único, 7 dias) antes da consulta; a resposta fica com assinatura simples (IP, agente, hash) e `answered_by = PATIENT`.
4. Revalidação periódica: anamnese com mais de 12 meses é sinalizada como "desatualizada" no atendimento.

## 4. Odontograma

- Notação **FDI**: permanentes 11–18, 21–28, 31–38, 41–48; decíduos 51–55, 61–65, 71–75, 81–85.
- Estado por dente inteiro ou por face (M, D, V, L, O, C).
- Condições: `HEALTHY`, `CARIES`, `RESTORED`, `ABSENT`, `EXTRACTED`, `IMPLANT`, `CROWN`, `ROOT_CANAL`, `SEALANT`, `FRACTURE` (extensível por tenant na fase 2).
- Toda mudança grava `ToothStateHistory` com origem (`MANUAL` ou `PROCEDURE_EXECUTION`), autor e timestamp → é possível reconstruir o odontograma em qualquer data passada.
- Execução de procedimento no atendimento atualiza o odontograma automaticamente conforme o mapeamento do procedimento (ex.: `RES-01` → `RESTORED` na face indicada; `EXO-01` → `EXTRACTED`).
- Coerência mínima validada: dente `ABSENT`/`EXTRACTED` não recebe restauração (aviso bloqueante com opção de justificar — realidade clínica tem exceções, mas o erro de digitação é mais comum que a exceção).
- UI: permanente = referência FDI + overlay de faces; decídua = glifos SVG — [docs/frontend/odontograma.md](../frontend/odontograma.md).

## 5. Evolução clínica (`ClinicalNote`)

O ponto mais crítico do sistema. Requisitos derivados das normas ([doc 10](../10-seguranca-lgpd-compliance.md)): registro por atendimento, cronológico, com data, hora, autor identificado e número de inscrição no CRO, assinado, e **inalterável**.

```ts
export class ClinicalNote extends Entity<ClinicalNoteProps> {
  static create(id: EntityId, props: CreateClinicalNoteProps): ClinicalNote {
    if (props.content.trim().length < 10) throw new ClinicalNoteTooShortError();
    if (!props.professional.croNumber) throw new ProfessionalWithoutCroError();

    const note = new ClinicalNote(id, {
      ...props,
      version: 1,
      contentHash: sha256(canonical(props.content, props.procedures)),
      signedAt: props.now,
      signature: {
        type: 'SIMPLE',
        userId: props.professional.userId,
        croNumber: props.professional.croNumber,
        croState: props.professional.croState,
        ip: props.requestIp,
      },
    });
    note.addEvent(new ClinicalNoteCreated(note));
    return note;
  }

  amend(reason: string, newContent: string, professional: ProfessionalSummary, now: Date): ClinicalNote {
    if (reason.trim().length < 10) throw new AmendReasonRequiredError();
    // não muta esta instância: retorna nova versão apontando para a anterior
    return ClinicalNote.createAmendment(this, reason, newContent, professional, now);
  }
}
```

Garantias em camadas:

1. **Domínio:** não existe método que altere `content`; `amend` retorna nova entidade.
2. **Aplicação:** não há use case de update/delete de evolução.
3. **API:** `PATCH`/`DELETE` retornam `423 RECORD_IMMUTABLE` com orientação de usar `/amend`.
4. **Banco:** trigger bloqueia `UPDATE`/`DELETE` na tabela.
5. **Integridade:** `content_hash` (SHA-256) por versão; fase 2 encadeia hashes por prontuário e adiciona assinatura digital com certificado.

Auxílios de produtividade que **não** afrouxam a regra: templates de texto por procedimento, rascunho local no navegador antes de assinar (nunca no servidor como registro), preenchimento automático dos procedimentos executados.

## 6. Anexos

- Upload direto para o object storage via URL pré-assinada; a API valida antes de emitir a URL: tipo (allowlist: JPEG, PNG, WEBP, PDF, DICOM na fase 3), tamanho (default 20 MB por arquivo) e cota do plano.
- Confirmação registra `storage_key`, `checksum_sha256`, `category` (`XRAY`, `PHOTO_INTRAORAL`, `PHOTO_FACIAL`, `DOCUMENT`, `EXAM`, `CONSENT_FORM`, `OTHER`), autor e data.
- Download sempre por URL assinada de curta duração (15 min), com `audit_log` do acesso.
- Miniaturas geradas em job assíncrono; nunca redimensionamos o original (valor probatório).
- Exclusão é lógica (`deleted_at` + motivo + autor); o arquivo permanece no storage durante o período de guarda.
- Comparação lado a lado de fotos por data (antes/depois) é entregue no MVP por ser barato e muito valorizado clinicamente.

## 7. Controle de acesso

| Papel | Ler | Escrever evolução | Anexar | Ver anexo |
| --- | :-: | :-: | :-: | :-: |
| OWNER | ✔ | ✔ (se dentista com CRO) | ✔ | ✔ |
| DENTIST | ✔ | ✔ | ✔ | ✔ |
| ASSISTANT | ✔ | ✖ | ✔ | ✔ |
| RECEPTION | ✖ | ✖ | ✖ | ✖ |
| FINANCE | ✖ | ✖ | ✖ | ✖ |

**Toda leitura** de evolução, anamnese e anexo é auditada com `patient_id` — é o que permite responder "quem acessou meus dados?". Um dentista vê o prontuário de qualquer paciente da clínica (necessidade assistencial real), mas o acesso fica registrado; volume anômalo de leituras gera alerta interno.

## 8. Eventos

| Publicados | Consumidores |
| --- | --- |
| `clinical_records.note_created` | `treatments` (marca item como executado), `billing` (registra produção), `reporting` |
| `clinical_records.note_amended` | `platform` (auditoria reforçada) |
| `clinical_records.odontogram_updated` | `reporting` |
| `clinical_records.critical_alert_created` | `scheduling` (destaca alerta no card do agendamento) |

| Consumidos | Efeito |
| --- | --- |
| `patients.patient_created` | Cria `medical_record` |
| `scheduling.appointment_started` | Abre contexto de atendimento (evolução vinculada ao agendamento) |
| `treatments.item_executed` | Sugere texto de evolução e atualização do odontograma |

## 9. Endpoints

Ver [API v1 §2.5](../08-api-v1.md#25-prontuário-clinical-records).

## 10. Testes obrigatórios

- `PATCH`/`DELETE` em evolução → 423; trigger do banco rejeita mesmo em SQL direto.
- `amend` sem motivo (ou com motivo curto) é rejeitado; com motivo, cria versão 2 preservando a 1.
- Dentista sem CRO não consegue assinar.
- Alerta `CRITICAL` é criado automaticamente a partir da anamnese e aparece no contexto do atendimento.
- Resposta de anamnese antiga continua legível após nova versão do formulário.
- Odontograma pode ser reconstruído para uma data passada a partir do histórico.
- Recepção recebe 403 em todas as rotas do módulo, com auditoria.
- Leitura de anexo gera `audit_log` com `patient_id`.
- Upload acima da cota/tipo inválido é bloqueado **antes** de gerar a URL assinada.
- Anexo de outro tenant → 404 (RLS), nunca 403.
