# RF — Identidade e Acesso (E1)

**Módulo:** `identity` · **Detalhe:** [modulos/01-identidade-acesso.md](../../modulos/01-identidade-acesso.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E1-01 | Visitante cria clínica (signup) com e-mail, senha forte, nome da clínica e nome do responsável; o sistema cria Tenant, Unidade padrão e usuário Owner em uma única operação atômica | Must | US-1.1, J1 |
| RF-E1-02 | Sistema rejeita e-mail já cadastrado com `409` sem revelar se o e-mail pertence a outro tenant | Must | US-1.1 |
| RF-E1-03 | Senha mínima de 10 caracteres, verificada contra lista de senhas vazadas comuns; armazenamento com Argon2id | Must | US-1.1, RNF-SEC |
| RF-E1-04 | Usuário autentica com e-mail/senha e recebe access token JWT (TTL curto) + refresh token rotativo em cookie httpOnly | Must | US-1.2 |
| RF-E1-05 | Reuso de refresh token revoga toda a família de tokens e registra alerta de segurança | Must | US-1.2, módulo identity |
| RF-E1-06 | Após 5 tentativas de login falhas em 10 minutos, o sistema aplica bloqueio temporário progressivo | Must | US-1.2 |
| RF-E1-07 | Usuário renova sessão via refresh sem reinformar senha; logout encerra a sessão atual; logout-all encerra todas as sessões | Must | US-1.2 |
| RF-E1-08 | Usuário solicita e redefine senha por fluxo seguro (token de uso único); resposta de “esqueci senha” não revela se o e-mail existe | Must | módulo identity |
| RF-E1-09 | Owner convida membro por e-mail com perfil definido; convite de uso único válido por 7 dias; pode reenviar ou revogar | Must | US-1.3 |
| RF-E1-10 | Convidado aceita convite, define senha e passa a integrar o tenant com o papel atribuído | Must | US-1.3 |
| RF-E1-11 | Sistema aplica papéis Owner, Dentista, Recepção, Auxiliar (ASB) e Financeiro com permissões por recurso | Must | US-1.4, P1–P3 |
| RF-E1-12 | Perfil Recepção não acessa prontuário clínico (API `403` + auditoria; UI não exibe a aba) | Must | US-1.4, A3 |
| RF-E1-13 | Owner altera papel/ativo de membro; o último Owner do tenant não pode ser removido nem rebaixado | Must | módulo identity |
| RF-E1-14 | Usuário com membership em mais de um tenant troca de contexto de clínica de forma válida (`X-Tenant-Id` validado contra memberships) | Must | doc 06 |
| RF-E1-15 | Owner consulta identidade atual (`me`): usuário, memberships e permissões efetivas | Must | API §2.1 |

## Critérios de aceite transversais (E1)

- Signup cria todos os artefatos (tenant, unidade, owner, seeds) ou nenhum.
- Login com senha errada não revela existência do e-mail (tempo/resposta uniformes).
- Tentativa de acesso a tenant sem membership → `403 TENANT_NOT_ALLOWED`.
- Eventos de auditoria: login, falha, logout, reset de senha, convite, mudança de papel, permissão negada.

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E1-16 | MFA TOTP (obrigatório para Owner na fase 3) | Could (fase 2/3) |
| RF-E1-17 | Lista de sessões ativas com revogação individual | Could (fase 2) |
