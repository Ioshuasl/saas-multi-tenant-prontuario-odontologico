'use client';

import type { InstallmentFilterProps } from '@/packages/financeiro/types/Installment/InstallmentFilterTypes';
import type { InstallmentListPreset } from '@/packages/financeiro/types/Installment/InstallmentTypes';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

const PRESETS: Array<{ value: InstallmentListPreset; label: string }> = [
  { value: '', label: 'Em aberto' },
  { value: 'due_today', label: 'Vencendo hoje' },
  { value: 'overdue', label: 'Em atraso' },
];

export function InstallmentFilter({
  patientSearch,
  onPatientSearchChange,
  preset,
  onPresetChange,
}: InstallmentFilterProps) {
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
        aria-label="Filtro de vencimento"
        value={preset}
        onChange={(event) => onPresetChange(event.target.value as InstallmentListPreset)}
        className="w-56"
      >
        {PRESETS.map((item) => (
          <NativeSelectOption key={item.value || 'open'} value={item.value}>
            {item.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
