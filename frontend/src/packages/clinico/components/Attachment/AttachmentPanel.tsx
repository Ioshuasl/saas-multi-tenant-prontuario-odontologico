'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AttachmentCompare } from '@/packages/clinico/components/Attachment/AttachmentCompare';
import {
  ATTACHMENT_CATEGORIES,
  ATTACHMENT_CATEGORY_LABELS,
  type AttachmentCategory,
} from '@/packages/clinico/enum/Attachment/AttachmentCategoryEnum';
import { ATTACHMENT_MIME_ALLOWLIST } from '@/packages/clinico/helpers/AttachmentChecksum';
import { clinicoErrorMessage } from '@/packages/clinico/helpers/ClinicoErrorMessage';
import { useAttachmentDownloadHook } from '@/packages/clinico/hooks/Attachment/useAttachmentDownloadHook';
import { useAttachmentListHook } from '@/packages/clinico/hooks/Attachment/useAttachmentListHook';
import { useAttachmentUploadHook } from '@/packages/clinico/hooks/Attachment/useAttachmentUploadHook';
import type { AttachmentSummary } from '@/packages/clinico/types/Attachment/AttachmentTypes';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

const AttachmentDeleteFormDialog = dynamic(
  () =>
    import('@/packages/clinico/components/Attachment/AttachmentDeleteFormDialog').then(
      (m) => m.AttachmentDeleteFormDialog,
    ),
  { ssr: false },
);

type AttachmentPanelProps = {
  patientId: string;
};

export function AttachmentPanel({ patientId }: AttachmentPanelProps) {
  const listQuery = useAttachmentListHook(patientId);
  const upload = useAttachmentUploadHook(patientId);
  const download = useAttachmentDownloadHook();
  const [category, setCategory] = useState<AttachmentCategory>('PHOTO_INTRAORAL');
  const [deleting, setDeleting] = useState<AttachmentSummary | null>(null);

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    await upload.mutateAsync({ file, category });
  };

  const onDownload = async (attachmentId: string) => {
    const result = await download.mutateAsync(attachmentId);
    window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  const items = listQuery.data ?? [];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-medium">Anexos</h2>
        <Can permission="clinical_records.read">
          <div className="flex flex-wrap items-end gap-2">
            <Field>
              <FieldLabel htmlFor="attachment-category">Categoria</FieldLabel>
              <NativeSelect
                id="attachment-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as AttachmentCategory)}
              >
                {ATTACHMENT_CATEGORIES.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {ATTACHMENT_CATEGORY_LABELS[item]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="attachment-file">Arquivo</FieldLabel>
              <Input
                id="attachment-file"
                type="file"
                accept={ATTACHMENT_MIME_ALLOWLIST.join(',')}
                disabled={upload.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void onUpload(file);
                  event.target.value = '';
                }}
              />
            </Field>
          </div>
        </Can>
      </div>

      {upload.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{clinicoErrorMessage(upload.error)}</AlertDescription>
        </Alert>
      ) : null}
      {upload.isSuccess ? (
        <Alert>
          <AlertDescription>Anexo enviado.</AlertDescription>
        </Alert>
      ) : null}

      {listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando anexos…</p>
      ) : listQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{clinicoErrorMessage(listQuery.error)}</AlertDescription>
        </Alert>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum anexo.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{item.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {ATTACHMENT_CATEGORY_LABELS[item.category as AttachmentCategory] ?? item.category}
                  {' · '}
                  {new Date(item.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void onDownload(item.id);
                  }}
                >
                  Baixar
                </Button>
                <Can permission="clinical_records.write">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setDeleting(item)}>
                    Excluir
                  </Button>
                </Can>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AttachmentCompare attachments={items} />

      {deleting ? (
        <AttachmentDeleteFormDialog attachment={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </div>
  );
}
