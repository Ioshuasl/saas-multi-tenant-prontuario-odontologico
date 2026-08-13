'use client';

import { useState } from 'react';
import { PHOTO_CATEGORIES } from '@/packages/clinico/enum/Attachment/AttachmentCategoryEnum';
import { useAttachmentDownloadHook } from '@/packages/clinico/hooks/Attachment/useAttachmentDownloadHook';
import type { AttachmentSummary } from '@/packages/clinico/types/Attachment/AttachmentTypes';
import { Button } from '@/shared/ui/button';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

type AttachmentCompareProps = {
  attachments: AttachmentSummary[];
};

export function AttachmentCompare({ attachments }: AttachmentCompareProps) {
  const photos = attachments
    .filter((item) => PHOTO_CATEGORIES.includes(item.category as (typeof PHOTO_CATEGORIES)[number]))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const download = useAttachmentDownloadHook();
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [leftUrl, setLeftUrl] = useState<string | null>(null);
  const [rightUrl, setRightUrl] = useState<string | null>(null);

  const load = async (id: string, side: 'left' | 'right') => {
    if (!id) {
      if (side === 'left') setLeftUrl(null);
      else setRightUrl(null);
      return;
    }
    const result = await download.mutateAsync(id);
    if (side === 'left') setLeftUrl(result.downloadUrl);
    else setRightUrl(result.downloadUrl);
  };

  if (photos.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Inclua ao menos duas fotos para comparar lado a lado.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <h3 className="text-sm font-medium">Comparar fotos</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <NativeSelect
          aria-label="Foto esquerda"
          value={leftId}
          onChange={(event) => {
            const id = event.target.value;
            setLeftId(id);
            void load(id, 'left');
          }}
        >
          <NativeSelectOption value="">Esquerda</NativeSelectOption>
          {photos.map((photo) => (
            <NativeSelectOption key={photo.id} value={photo.id}>
              {photo.fileName} · {new Date(photo.createdAt).toLocaleDateString('pt-BR')}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Foto direita"
          value={rightId}
          onChange={(event) => {
            const id = event.target.value;
            setRightId(id);
            void load(id, 'right');
          }}
        >
          <NativeSelectOption value="">Direita</NativeSelectOption>
          {photos.map((photo) => (
            <NativeSelectOption key={photo.id} value={photo.id}>
              {photo.fileName} · {new Date(photo.createdAt).toLocaleDateString('pt-BR')}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {leftUrl ? (
          <img src={leftUrl} alt="Foto esquerda" className="max-h-64 w-full rounded-md object-contain" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
            Selecione a foto esquerda
          </div>
        )}
        {rightUrl ? (
          <img src={rightUrl} alt="Foto direita" className="max-h-64 w-full rounded-md object-contain" />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
            Selecione a foto direita
          </div>
        )}
      </div>
      {download.isPending ? (
        <Button type="button" variant="ghost" disabled>
          Carregando…
        </Button>
      ) : null}
    </div>
  );
}
