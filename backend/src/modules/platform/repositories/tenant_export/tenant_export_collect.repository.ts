import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import { decryptExportField } from '../../helpers/tenant_export_decrypt.helper.js';
import { attachmentZipPath } from '../../helpers/tenant_export_storage.helper.js';
import type { TenantExportAttachmentMeta } from '../../types/tenant_export/tenant_export.types.js';

function cents(value: bigint): number {
  return Number(value);
}

export type TenantExportSnapshot = {
  patients: Array<Record<string, unknown>>;
  appointments: Array<Record<string, unknown>>;
  clinicalNotes: Array<Record<string, unknown>>;
  anamnesisResponses: Array<Record<string, unknown>>;
  clinicalAlerts: Array<Record<string, unknown>>;
  odontogram: Array<Record<string, unknown>>;
  receivables: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  attachments: TenantExportAttachmentMeta[];
};

/** Snapshot read-only do tenant (RLS). Não importa internals de outros BCs. */
export class CollectRepository {
  async execute(ctx: RequestContext): Promise<TenantExportSnapshot> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      let dek: Buffer | null = null;
      try {
        dek = await unwrapActiveDek(tx, ctx.tenantId);
      } catch {
        dek = null;
      }

      const [
        patientRows,
        appointmentRows,
        noteRows,
        anamnesisRows,
        alertRows,
        toothRows,
        receivableRows,
        paymentRows,
        attachmentRows,
      ] = await Promise.all([
        tx.patient.findMany({
          where: { tenantId: ctx.tenantId },
          select: {
            id: true,
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
        }),
        tx.appointment.findMany({
          where: { tenantId: ctx.tenantId },
          select: {
            id: true,
            patientId: true,
            professionalId: true,
            unitId: true,
            procedureId: true,
            startsAt: true,
            endsAt: true,
            status: true,
            origin: true,
            notes: true,
          },
        }),
        tx.clinicalNote.findMany({
          where: { tenantId: ctx.tenantId },
          select: {
            id: true,
            medicalRecordId: true,
            appointmentId: true,
            professionalId: true,
            content: true,
            procedures: true,
            version: true,
            supersedesId: true,
            amendReason: true,
            signedAt: true,
            medicalRecord: { select: { patientId: true } },
          },
        }),
        tx.anamnesisResponse.findMany({
          where: { tenantId: ctx.tenantId },
          select: {
            id: true,
            medicalRecordId: true,
            formId: true,
            formVersion: true,
            answers: true,
            answeredBy: true,
            answeredAt: true,
            medicalRecord: { select: { patientId: true } },
          },
        }),
        tx.clinicalAlert.findMany({
          where: { tenantId: ctx.tenantId },
          select: {
            id: true,
            medicalRecordId: true,
            severity: true,
            category: true,
            description: true,
            source: true,
            active: true,
            medicalRecord: { select: { patientId: true } },
          },
        }),
        tx.toothState.findMany({
          where: { tenantId: ctx.tenantId },
          select: {
            id: true,
            medicalRecordId: true,
            dentition: true,
            toothCode: true,
            face: true,
            condition: true,
            notes: true,
            medicalRecord: { select: { patientId: true } },
          },
        }),
        tx.receivable.findMany({
          where: { tenantId: ctx.tenantId },
          select: {
            id: true,
            patientId: true,
            totalCents: true,
            installmentCount: true,
            status: true,
            description: true,
            createdAt: true,
          },
        }),
        tx.payment.findMany({
          where: { tenantId: ctx.tenantId, reversedAt: null },
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
          where: { tenantId: ctx.tenantId, deletedAt: null },
          select: {
            id: true,
            patientId: true,
            fileName: true,
            storageKey: true,
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
          patientId: row.medicalRecord.patientId,
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
          patientId: row.medicalRecord.patientId,
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
          patientId: row.medicalRecord.patientId,
          severity: row.severity,
          category: row.category,
          source: row.source,
          active: row.active,
          description: decrypted.value,
          decryptError: decrypted.decryptError,
        };
      });

      return {
        patients: patientRows.map((row) => ({
          id: row.id,
          code: Number(row.code),
          name: row.name,
          socialName: row.socialName,
          cpf: row.cpf,
          birthDate: row.birthDate?.toISOString().slice(0, 10) ?? null,
          sex: row.sex,
          phonePrimary: row.phonePrimary,
          phoneSecondary: row.phoneSecondary,
          email: row.email,
          address: row.address,
          origin: row.origin,
          active: row.active,
          createdAt: row.createdAt.toISOString(),
        })),
        appointments: appointmentRows.map((row) => ({
          id: row.id,
          patientId: row.patientId,
          professionalId: row.professionalId,
          unitId: row.unitId,
          procedureId: row.procedureId,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt.toISOString(),
          status: row.status,
          origin: row.origin,
          notes: row.notes,
        })),
        clinicalNotes,
        anamnesisResponses,
        clinicalAlerts,
        odontogram: toothRows.map((row) => ({
          id: row.id,
          patientId: row.medicalRecord.patientId,
          dentition: row.dentition,
          toothCode: row.toothCode,
          face: row.face,
          condition: row.condition,
          notes: row.notes,
        })),
        receivables: receivableRows.map((row) => ({
          id: row.id,
          patientId: row.patientId,
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
          patientId: row.patientId,
          fileName: row.fileName,
          storageKey: row.storageKey,
          mimeType: row.mimeType,
          sizeBytes: cents(row.sizeBytes),
          zipPath: attachmentZipPath(row.id, row.fileName),
        })),
      };
    });
  }
}
