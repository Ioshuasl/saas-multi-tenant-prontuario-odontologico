import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import { decryptExportField } from '../../helpers/tenant_export_decrypt.helper.js';
import type { PatientPackageSnapshot } from '../../types/data_subject_request/data_subject_request.types.js';

function cents(value: bigint): number {
  return Number(value);
}

/** Snapshot read-only de um paciente (RLS). Não importa internals de outros BCs. */
export class CollectRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<PatientPackageSnapshot | null> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const patient = await tx.patient.findFirst({
        where: { id: patientId, tenantId: ctx.tenantId },
        select: {
          id: true,
          unitId: true,
          code: true,
          name: true,
          socialName: true,
          cpf: true,
          birthDate: true,
          sex: true,
          phonePrimary: true,
          phoneSecondary: true,
          email: true,
          address: true,
          origin: true,
          active: true,
          createdAt: true,
        },
      });
      if (!patient) return null;

      let dek: Buffer | null = null;
      try {
        dek = await unwrapActiveDek(tx, ctx.tenantId);
      } catch {
        dek = null;
      }

      const [
        appointmentRows,
        noteRows,
        anamnesisRows,
        alertRows,
        toothRows,
        receivableRows,
        paymentRows,
        attachmentRows,
      ] = await Promise.all([
        tx.appointment.findMany({
          where: { tenantId: ctx.tenantId, patientId },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            origin: true,
            notes: true,
            procedureId: true,
            professionalId: true,
          },
          orderBy: { startsAt: 'desc' },
        }),
        tx.clinicalNote.findMany({
          where: { tenantId: ctx.tenantId, medicalRecord: { patientId } },
          select: {
            id: true,
            appointmentId: true,
            professionalId: true,
            content: true,
            procedures: true,
            version: true,
            supersedesId: true,
            amendReason: true,
            signedAt: true,
          },
          orderBy: { signedAt: 'desc' },
        }),
        tx.anamnesisResponse.findMany({
          where: { tenantId: ctx.tenantId, medicalRecord: { patientId } },
          select: {
            id: true,
            formId: true,
            formVersion: true,
            answers: true,
            answeredBy: true,
            answeredAt: true,
          },
        }),
        tx.clinicalAlert.findMany({
          where: { tenantId: ctx.tenantId, medicalRecord: { patientId } },
          select: {
            id: true,
            severity: true,
            category: true,
            description: true,
            source: true,
            active: true,
          },
        }),
        tx.toothState.findMany({
          where: { tenantId: ctx.tenantId, medicalRecord: { patientId } },
          select: {
            id: true,
            dentition: true,
            toothCode: true,
            face: true,
            condition: true,
            notes: true,
          },
        }),
        tx.receivable.findMany({
          where: { tenantId: ctx.tenantId, patientId },
          select: {
            id: true,
            totalCents: true,
            installmentCount: true,
            status: true,
            description: true,
            createdAt: true,
          },
        }),
        tx.payment.findMany({
          where: {
            tenantId: ctx.tenantId,
            reversedAt: null,
            installment: { receivable: { patientId } },
          },
          select: {
            id: true,
            installmentId: true,
            amountCents: true,
            receivedAt: true,
            receiptNumber: true,
            installment: { select: { receivableId: true } },
          },
        }),
        tx.attachment.findMany({
          where: { tenantId: ctx.tenantId, patientId, deletedAt: null },
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
          },
        }),
      ]);

      const clinicalNotes = noteRows.map((row) => {
        const decrypted = decryptExportField(row.content, dek, {
          tenantId: ctx.tenantId,
          table: 'clinical_note',
          column: 'content',
          rowId: row.id,
        });
        return {
          id: row.id,
          appointmentId: row.appointmentId,
          professionalId: row.professionalId,
          version: row.version,
          supersedesId: row.supersedesId,
          amendReason: row.amendReason,
          signedAt: row.signedAt.toISOString(),
          procedures: row.procedures,
          content: decrypted.value,
          decryptError: decrypted.decryptError,
        };
      });

      const anamnesisResponses = anamnesisRows.map((row) => {
        const decrypted = decryptExportField(row.answers, dek, {
          tenantId: ctx.tenantId,
          table: 'anamnesis_response',
          column: 'answers',
          rowId: row.id,
        });
        return {
          id: row.id,
          formId: row.formId,
          formVersion: row.formVersion,
          answeredBy: row.answeredBy,
          answeredAt: row.answeredAt.toISOString(),
          answers: decrypted.value,
          decryptError: decrypted.decryptError,
        };
      });

      const clinicalAlerts = alertRows.map((row) => {
        const decrypted = decryptExportField(row.description, dek, {
          tenantId: ctx.tenantId,
          table: 'clinical_alert',
          column: 'description',
          rowId: row.id,
        });
        return {
          id: row.id,
          severity: row.severity,
          category: row.category,
          source: row.source,
          active: row.active,
          description: decrypted.value,
          decryptError: decrypted.decryptError,
        };
      });

      return {
        unitId: patient.unitId,
        patient: {
          id: patient.id,
          code: Number(patient.code),
          name: patient.name,
          socialName: patient.socialName,
          cpf: patient.cpf,
          birthDate: patient.birthDate?.toISOString().slice(0, 10) ?? null,
          sex: patient.sex,
          phonePrimary: patient.phonePrimary,
          phoneSecondary: patient.phoneSecondary,
          email: patient.email,
          address: patient.address,
          origin: patient.origin,
          active: patient.active,
          createdAt: patient.createdAt.toISOString(),
        },
        appointments: appointmentRows.map((row) => ({
          id: row.id,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt.toISOString(),
          status: row.status,
          origin: row.origin,
          notes: row.notes,
          procedureId: row.procedureId,
          professionalId: row.professionalId,
        })),
        clinicalNotes,
        anamnesisResponses,
        clinicalAlerts,
        odontogram: toothRows.map((row) => ({
          id: row.id,
          dentition: row.dentition,
          toothCode: row.toothCode,
          face: row.face,
          condition: row.condition,
          notes: row.notes,
        })),
        receivables: receivableRows.map((row) => ({
          id: row.id,
          totalCents: cents(row.totalCents),
          installmentCount: row.installmentCount,
          status: row.status,
          description: row.description,
          createdAt: row.createdAt.toISOString(),
        })),
        payments: paymentRows.map((row) => ({
          id: row.id,
          receivableId: row.installment.receivableId,
          installmentId: row.installmentId,
          amountCents: cents(row.amountCents),
          receivedAt: row.receivedAt.toISOString(),
          receiptNumber: Number(row.receiptNumber),
        })),
        attachments: attachmentRows.map((row) => ({
          id: row.id,
          fileName: row.fileName,
          mimeType: row.mimeType,
          sizeBytes: cents(row.sizeBytes),
        })),
      };
    });
  }
}
