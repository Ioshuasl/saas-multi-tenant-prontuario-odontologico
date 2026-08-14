'use client';

import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from '@/packages/operacional/enum/Quote/QuoteStatusEnum';
import type { QuoteStatus } from '@/packages/operacional/enum/Quote/QuoteStatusEnum';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

type QuoteFilterProps = {
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  status: QuoteStatus | '';
  onStatusChange: (value: QuoteStatus | '') => void;
};

export function QuoteFilter({
  patientSearch,
  onPatientSearchChange,
  status,
  onStatusChange,
}: QuoteFilterProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="min-w-56 flex-1">
        <Input
          value={patientSearch}
          onChange={(event) => onPatientSearchChange(event.target.value)}
          placeholder="Filtrar paciente…"
          aria-label="Filtrar paciente"
        />
      </div>
      <NativeSelect
        aria-label="Filtrar status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as QuoteStatus | '')}
        className="w-56"
      >
        <NativeSelectOption value="">Todos os status</NativeSelectOption>
        {QUOTE_STATUSES.map((item) => (
          <NativeSelectOption key={item} value={item}>
            {QUOTE_STATUS_LABELS[item]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
