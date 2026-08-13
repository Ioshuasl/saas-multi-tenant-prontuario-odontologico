/** Agregado raiz do prontuário — 1:1 com paciente. */
export class MedicalRecord {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly patientId: string,
    readonly openedAt: Date,
  ) {}

  static open(input: {
    id: string;
    tenantId: string;
    patientId: string;
    openedAt?: Date;
  }): MedicalRecord {
    return new MedicalRecord(
      input.id,
      input.tenantId,
      input.patientId,
      input.openedAt ?? new Date(),
    );
  }
}
