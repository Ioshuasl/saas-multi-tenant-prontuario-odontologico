export const AuditActorType = {
  USER: 'USER',
  PATIENT: 'PATIENT',
  SYSTEM: 'SYSTEM',
  SUPPORT: 'SUPPORT',
} as const;

export type AuditActorType = (typeof AuditActorType)[keyof typeof AuditActorType];

export const AUDIT_ACTOR_TYPE_LABELS: Record<AuditActorType, string> = {
  USER: 'Usuário',
  PATIENT: 'Paciente',
  SYSTEM: 'Sistema',
  SUPPORT: 'Suporte',
};

export function auditActorTypeLabel(actorType: string): string {
  return AUDIT_ACTOR_TYPE_LABELS[actorType as AuditActorType] ?? actorType;
}
