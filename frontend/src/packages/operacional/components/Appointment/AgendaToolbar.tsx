'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import {
  SLOT_MINUTES_OPTIONS,
  type SlotMinutes,
} from '@/packages/operacional/helpers/AgendaNotionTokens';
import type {
  AgendaResourceMode,
  AgendaViewMode,
  ChairOption,
  ProfessionalOption,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { Button } from '@/shared/ui/button';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

type AgendaToolbarProps = {
  viewMode: AgendaViewMode;
  onViewMode: (mode: AgendaViewMode) => void;
  anchorLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  slotMinutes: SlotMinutes;
  onSlotMinutes: (value: SlotMinutes) => void;
  resourceMode: AgendaResourceMode;
  onResourceMode: (mode: AgendaResourceMode) => void;
  professionals: ProfessionalOption[];
  professionalId: string;
  onProfessionalId: (id: string) => void;
  chairs: ChairOption[];
  chairId: string;
  onChairId: (id: string) => void;
  onBlock: () => void;
};

export function AgendaToolbar({
  viewMode,
  onViewMode,
  anchorLabel,
  onPrev,
  onNext,
  onToday,
  slotMinutes,
  onSlotMinutes,
  resourceMode,
  onResourceMode,
  professionals,
  professionalId,
  onProfessionalId,
  chairs,
  chairId,
  onChairId,
  onBlock,
}: AgendaToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
      <h1 className="mr-auto text-xl font-semibold tracking-tight text-foreground">Agenda</h1>

      <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'day' ? 'secondary' : 'ghost'}
          onClick={() => onViewMode('day')}
        >
          Dia
        </Button>
        <Button
          type="button"
          size="sm"
          variant={viewMode === 'week' ? 'secondary' : 'ghost'}
          onClick={() => onViewMode('week')}
        >
          Semana
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Anterior" onClick={onPrev}>
          <ChevronLeftIcon />
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onToday}>
          Hoje
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Próximo" onClick={onNext}>
          <ChevronRightIcon />
        </Button>
        <span className="min-w-36 px-2 text-sm capitalize text-foreground">{anchorLabel}</span>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
        <Button
          type="button"
          size="sm"
          variant={resourceMode === 'professional' ? 'secondary' : 'ghost'}
          onClick={() => onResourceMode('professional')}
        >
          Profissional
        </Button>
        <Button
          type="button"
          size="sm"
          variant={resourceMode === 'chair' ? 'secondary' : 'ghost'}
          onClick={() => onResourceMode('chair')}
        >
          Cadeira
        </Button>
      </div>

      {resourceMode === 'professional' ? (
        <NativeSelect
          aria-label="Profissional"
          value={professionalId}
          onChange={(e) => onProfessionalId(e.target.value)}
          className="h-8 w-44"
        >
          <NativeSelectOption value="">Profissional…</NativeSelectOption>
          {professionals.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : (
        <NativeSelect
          aria-label="Cadeira"
          value={chairId}
          onChange={(e) => onChairId(e.target.value)}
          className="h-8 w-44"
        >
          <NativeSelectOption value="">Cadeira…</NativeSelectOption>
          {chairs.map((c) => (
            <NativeSelectOption key={c.id} value={c.id}>
              {c.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      <NativeSelect
        aria-label="Duração do slot"
        value={String(slotMinutes)}
        onChange={(e) => onSlotMinutes(Number(e.target.value) as SlotMinutes)}
        className="h-8 w-28"
      >
        {SLOT_MINUTES_OPTIONS.map((m) => (
          <NativeSelectOption key={m} value={String(m)}>
            {m} min
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <Button type="button" size="sm" variant="outline" onClick={onBlock}>
        Bloquear
      </Button>
    </div>
  );
}
