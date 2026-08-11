# Módulo — Identidade e Acesso (`identity`)

## 1. Responsabilidade

Autenticar pessoas, resolver a qual clínica (tenant) elas pertencem e com qual papel, e garantir que cada requisição só faça o que o papel permite. É o único módulo que conhece senha, token e sessão.

**Não é responsabilidade dele:** dados da clínica (é `clinic`), assinatura/plano (é `subscription`), perfil clínico do dentista como CRO e especialidades (é `clinic.professional`, que referencia o membership).

## 2. Agregados

| Agregado | Invariantes |
| --- | --- |
| `User` | E-mail único global; senha sempre em hash Argon2id; bloqueio temporário após N falhas |
| `Membership` | Um membership por (tenant, user); papel sempre válido; ao menos **um** OWNER ativo por tenant |
| `Invitation` | Token de uso único, expira em 7 dias; e-mail não pode ter membership ativo no tenant |
| `RefreshTokenFamily` | Rotação: usar um token consumido revoga toda a família (detecção de roubo) |

## 3. Modelo de permissões

Papel → conjunto de permissões, com possibilidade de override pontual por membership.

```ts
export const PERMISSIONS = [
  'agenda.read', 'agenda.write',
  'patients.read', 'patients.write',
  'clinical_records.read', 'clinical_records.write',
  'quotes.read', 'quotes.write', 'quotes.approve',
  'finance.read', 'finance.write', 'finance.close_cash',
  'messaging.read', 'messaging.write', 'messaging.configure',
  'reports.read', 'reports.financial',
  'settings.read', 'settings.write',
  'users.manage', 'subscription.manage', 'data.export', 'audit.read',
] as const;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: PERMISSIONS,                                  // tudo
  DENTIST: [
    'agenda.read', 'agenda.write',
    'patients.read', 'patients.write',
    'clinical_records.read', 'clinical_records.write',
    'quotes.read', 'quotes.write', 'quotes.approve',
    'messaging.read', 'messaging.write',
    'reports.read',
  ],
  RECEPTION: [
    'agenda.read', 'agenda.write',
    'patients.read', 'patients.write',
    'quotes.read', 'quotes.write',
    'finance.read', 'finance.write', 'finance.close_cash',
    'messaging.read', 'messaging.write',
    'reports.read',
  ],
  ASSISTANT: ['agenda.read', 'patients.read', 'clinical_records.read'],
  FINANCE: [
    'patients.read',
    'finance.read', 'finance.write', 'finance.close_cash',
    'reports.read', 'reports.financial',
    'messaging.read', 'messaging.write',
  ],
};
```

Regras não negociáveis:

1. `RECEPTION` **não** tem `clinical_records.read` — sigilo profissional.
2. `DENTIST` não tem `reports.financial` nem `finance.*` (vê apenas a própria produção, por endpoint específico).
3. Somente `OWNER` tem `users.manage`, `subscription.manage`, `data.export`, `audit.read`, `settings.write`.
4. Overrides ficam em `membership.permissions` (`{ "grant": ["reports.financial"], "revoke": [] }`) e são auditados na alteração.
5. Permissão negada gera `403 FORBIDDEN` **e** evento em `audit_log` (`PERMISSION_DENIED`).

## 4. Casos de uso

| Use case | Regras principais |
| --- | --- |
| `SignUpService` | Cria `Tenant` + `Unit` padrão + `User` + `Membership(OWNER)` + seeds (procedimentos, horários, anamnese padrão) em uma transação; publica `identity.tenant_created` |
| `SignInService` | Valida senha (tempo constante), zera contador de falhas, emite access+refresh, registra `LOGIN` |
| `RefreshTokenService` | Rotação com detecção de reuso; revoga família em caso de reuso e registra alerta |
| `SignOutService` / `SignOutAllService` | Revoga token atual / toda a família do usuário |
| `RequestPasswordResetService` | Sempre responde 202 (não revela existência); token de 1h de uso único |
| `ResetPasswordService` | Aplica nova senha, revoga todas as sessões, notifica por e-mail |
| `InviteMemberService` | Verifica limite do plano (`PLAN_LIMIT_EXCEEDED`), impede duplicidade, envia e-mail |
| `AcceptInvitationService` | Cria (ou vincula) `User` e cria `Membership`; consome o token |
| `ChangeMemberRoleService` | Impede remover o último OWNER; audita mudança |
| `DeactivateMemberService` | Revoga sessões do membro; mantém histórico (nunca apaga autoria de evolução) |
| `SwitchTenantService` | Emite novo access token para outro membership válido |

## 5. Endpoints

Ver [API v1 §2.1](../08-api-v1.md#21-autenticação-e-identidade-identity).

## 6. Segurança

- **Hash de senha:** Argon2id, ~64 MB / 3 iterações; parâmetros versionados para permitir rehash progressivo no login.
- **Access token:** JWT `RS256`, TTL 15 min, claims `sub`, `tenantId`, `memberships`, `role`, `permissions` (resolvidas), `jti`, `kid` para rotação de chave.
- **Refresh token:** valor opaco aleatório (32 bytes), armazenado como hash, TTL 30 dias, rotativo, em cookie `httpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`.
- **Rate limit:** login 10/min por IP + 5/min por e-mail; reset de senha 3/hora por e-mail; aceite de convite 10/hora por IP.
- **Enumeração:** respostas e tempos uniformes em login, signup e recuperação.
- **Auditoria:** `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_RESET`, `ROLE_CHANGED`, `MEMBER_INVITED`, `MEMBER_DEACTIVATED`, `PERMISSION_DENIED`, `REFRESH_REUSE_DETECTED`.
- **Fase 2:** MFA TOTP (obrigatório para OWNER na fase 3), lista de sessões ativas com revogação individual, política de senha configurável por tenant.

## 7. Eventos publicados

| Evento | Consumidores |
| --- | --- |
| `identity.tenant_created` | `clinic` (seeds), `subscription` (inicia trial), `messaging` (e-mail de boas-vindas) |
| `identity.member_joined` | `clinic` (cria `professional` se papel clínico), `subscription` (contador de profissionais) |
| `identity.member_deactivated` | `scheduling` (alerta de agendamentos futuros do profissional), `subscription` (contador) |

## 8. Testes obrigatórios

- Login com senha errada não revela se o e-mail existe.
- Reuso de refresh token revoga a família inteira.
- Último OWNER não pode ser removido nem rebaixado.
- `RECEPTION` recebe 403 em qualquer rota de `clinical_records`, com evento de auditoria.
- Convite expirado/reutilizado é rejeitado.
- `X-Tenant-Id` de tenant sem membership → `403 TENANT_NOT_ALLOWED`.
- Signup cria todos os artefatos (tenant, unidade, owner, seeds) ou nenhum (atomicidade).
