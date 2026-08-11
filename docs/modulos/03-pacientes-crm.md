# Módulo — Pacientes (`patients`)

## 1. Responsabilidade

Cadastro e ciclo de vida do paciente: dados pessoais, contatos, endereço, responsável legal, consentimentos, tags e a **timeline unificada** (agenda + clínico + financeiro + mensagens). É a entidade de referência de quase todo o sistema, mas **não** guarda dado clínico (isso é `clinical-records`).

## 2. Agregado `Patient`

```ts
interface PatientProps {
  tenantId: TenantId;
  code: number;                 // sequencial legível por tenant ("paciente #142")
  name: string;
  socialName?: string;          // nome social — usar na UI quando presente
  birthDate?: Date;
  cpf?: Cpf;                    // value object com validação de dígito
  rg?: string;
  gender?: 'F' | 'M' | 'OTHER' | 'UNDISCLOSED';
  phonePrimary: PhoneNumber;    // E.164 — chave para WhatsApp
  phoneSecondary?: PhoneNumber;
  email?: Email;
  address?: Address;            // CEP, logradouro, número, complemento, bairro, cidade, UF
  guardians: LegalGuardian[];   // obrigatório quando menor de idade
  origin?: PatientOrigin;       // INDICATION | INSTAGRAM | GOOGLE | WALK_IN | ...
  referredBy?: EntityId;        // outro paciente que indicou
  tags: string[];
  observations?: string;        // observações administrativas (NÃO clínicas)
  active: boolean;
}
```

### Invariantes

1. `name` com no mínimo 2 palavras e 3 caracteres; `phonePrimary` obrigatório (é o canal do produto).
2. `cpf` opcional, mas **único por tenant** quando informado (dígitos validados).
3. Paciente menor de idade (`birthDate` < 18 anos) exige ao menos um responsável legal com nome e telefone; sem isso, o cadastro é criado mas fica com alerta pendente e **não** permite envio de orçamento para aprovação pelo próprio paciente.
4. `code` é sequencial por tenant, gerado por sequence dedicada; imutável.
5. Exclusão é **inativação**. Remoção real só pelo fluxo LGPD de anonimização.
6. `observations` é campo administrativo; qualquer conteúdo clínico deve ir para evolução (regra reforçada com aviso na UI e revisão de código).

## 3. Detecção de duplicidade

Duplicata de paciente é um dos piores problemas operacionais (histórico clínico fragmentado). Estratégia:

| Sinal | Peso | Ação |
| --- | --- | --- |
| CPF idêntico | bloqueio | `409 DUPLICATE_RESOURCE`, oferece abrir o existente |
| Telefone idêntico | alto | Aviso: "há 1 paciente com este telefone — é a mesma pessoa?" (pode ser familiar) |
| Nome normalizado + data de nascimento | alto | Aviso com link para comparação |
| Nome muito semelhante (trigram > 0,6) | médio | Sugestão na lista durante a digitação |

`GET /patients/check-duplicate` é chamado no `onBlur` do CPF/telefone, antes de o usuário terminar o cadastro. **Fusão de duplicatas** (merge de prontuário, agenda e financeiro) é operação delicada e fica para a fase 2, com pré-visualização e auditoria completa.

## 4. Consentimentos

```
consent.type: TREATMENT | DATA_PROCESSING | MARKETING_WHATSAPP | IMAGE_USE
consent.status: GRANTED | REVOKED
consent: { text_version, granted_at, revoked_at, channel, ip, user_agent }
```

Regras:

- `MARKETING_WHATSAPP` é **pré-requisito verificado em runtime** por `messaging` para qualquer mensagem de categoria marketing. Sem consentimento, o envio é bloqueado (não silenciosamente descartado: fica registrado como `BLOCKED_NO_CONSENT`).
- Mensagem transacional (confirmação/lembrete/recibo) não depende desse consentimento — base contratual/legítimo interesse ([doc 10](../10-seguranca-lgpd-compliance.md)).
- Revogação é instantânea e versionada; o texto exibido no momento do aceite é guardado por versão para prova.
- Consentimento coletado no autoagendamento entra com `channel = PUBLIC_BOOKING` e IP/agente registrados.

## 5. Timeline unificada

`GET /patients/:id/timeline` agrega, por ordem cronológica decrescente, dados de outros módulos **via suas APIs públicas** (não com JOIN direto em tabelas alheias):

| Fonte | Item | Requer permissão |
| --- | --- | --- |
| `scheduling` | Agendamentos e mudanças de status | `agenda.read` |
| `clinical-records` | Evoluções, anamneses, anexos | `clinical_records.read` |
| `treatments` | Orçamentos e planos | `quotes.read` |
| `billing` | Parcelas e pagamentos | `finance.read` |
| `messaging` | Mensagens trocadas | `messaging.read` |

Itens sem permissão são **omitidos** (não aparecem como "bloqueado", para não vazar existência de tratamento a quem não pode saber). A recepção vê agenda e financeiro; nunca conteúdo clínico.

## 6. Casos de uso

| Use case | Regras |
| --- | --- |
| `CreatePatientUseCase` | Valida CPF/telefone, checa duplicidade, gera `code`, exige responsável se menor, publica `patients.patient_created` |
| `UpdatePatientUseCase` | Concorrência otimista por `version`; audita alteração de contato |
| `DeactivatePatientUseCase` | Bloqueia se há parcela em aberto ou agendamento futuro (pede confirmação explícita) |
| `GrantConsentUseCase` / `RevokeConsentUseCase` | Versiona texto; revogação notifica `messaging` |
| `GetPatientTimelineUseCase` | Compõe fontes conforme permissão; paginado por cursor |
| `SearchPatientsUseCase` | Busca por nome (trigram, sem acento), CPF, telefone e código; `< 300 ms` com 50k registros |
| `AddGuardianUseCase` | Valida parentesco e contato |

## 7. Busca

```sql
CREATE INDEX idx_patient_search ON patient
  USING gin ((unaccent(lower(name))) gin_trgm_ops);
CREATE INDEX idx_patient_phone ON patient (tenant_id, phone_primary);
CREATE INDEX idx_patient_cpf   ON patient (tenant_id, cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_patient_code  ON patient (tenant_id, code);
```

A busca aceita entrada parcial de telefone (últimos 4 dígitos — caso comum no atendimento telefônico) e nome sem acentuação. Ordenação: correspondência exata → prefixo → similaridade, com pacientes ativos antes dos inativos.

## 8. Eventos

| Publicados | Consumidores |
| --- | --- |
| `patients.patient_created` | `clinical-records` (cria `medical_record`), `messaging` (boas-vindas, se houver consentimento) |
| `patients.consent_revoked` | `messaging` (interrompe automações de marketing) |
| `patients.patient_deactivated` | `scheduling` (alerta agendamentos futuros) |

| Consumidos | Efeito |
| --- | --- |
| `scheduling.appointment_completed` | Atualiza `last_visit_at` |
| `billing.installment_overdue` | Marca flag de inadimplência (visível para papéis financeiros) |

## 9. Fase 2 — CRM

O MVP entrega cadastro + timeline + tags. A camada de CRM (funil de orçamentos não aprovados, campanhas segmentadas, recall automático, reativação de inativos, indicações com premiação) entra na fase 2 e reaproveita `origin`, `referredBy`, `tags` e a infraestrutura de `messaging` — motivo pelo qual esses campos já existem no MVP.

## 10. Testes obrigatórios

- CPF duplicado no mesmo tenant é bloqueado; o mesmo CPF em outro tenant é permitido.
- Telefone repetido gera aviso, não bloqueio.
- Menor de idade sem responsável não recebe link de aprovação de orçamento.
- Timeline da recepção não contém nenhum item clínico.
- Busca por "jose", "José", últimos 4 dígitos do telefone e código encontra o paciente.
- Revogação de consentimento de marketing bloqueia envio subsequente.
- Inativação com parcela em aberto exige confirmação explícita.
