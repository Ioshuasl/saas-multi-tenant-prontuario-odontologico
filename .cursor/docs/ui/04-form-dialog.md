# Form, FormDialog e grid

Norma: `docs/16` · rules `frontend-component-form` / `form-dialog`.  
Tipagens em `types/<Entidade>/` — **sem** pasta `interfaces/`.

## 1. Nomenclatura

| Arquivo | Uso |
|---|---|
| `PatientForm.tsx` | Formulário de **página** |
| `PatientFormDialog.tsx` | Formulário em **modal** |

Não misturar.

## 2. Grid de campos

| Layout | Quando |
|---|---|
| 1 coluna full | Nome, observação, textarea |
| 2 colunas | Pares (telefone / e-mail; CPF / nascimento) |
| Lookup + botão | Busca paciente / profissional |
| Campos odontológicos | dente/face quando `requires_tooth` |

Ordem típica Patient: identidade → contatos → endereço → consentimentos → ação.

## 3. FormHook

- `usePatientFormHook` centraliza `useForm` + Zod
- Componente: `form.handleSubmit(onSave, onError)`
- Sem `useForm` / `defaultValues` / `resolver` inline no JSX
- Reset no FormDialog via `handleForm` + `useEffect`

## 4. FormDialog

- Props em `types/Patient/PatientFormDialogTypes.ts`
- Index monta só quando aberto
- Create vs Update: Data decide método HTTP (`POST`/`PATCH`) — não o Form

## 5. Form de página (longo)

Quando o formulário for extenso (ex.: orçamento, configuração de clínica):

- cards empilhados na main
- Sidebar 360 de navegação (ver [05](05-sidebar-details.md))
- progressive disclosure: cadastro principal primeiro, vínculos depois

## 6. Bloqueios de produto (exemplos)

| Contexto | Regra de UI |
|---|---|
| Paciente menor | Exigir responsável antes de aprovação de orçamento |
| Sem CRO no profissional | Bloquear assinar evolução (mensagem clara) |
| Assinatura suspensa | Somente leitura + exportação liberada |

Mensagens em pt-BR; erros de API via `code` estável (`docs/08`).
