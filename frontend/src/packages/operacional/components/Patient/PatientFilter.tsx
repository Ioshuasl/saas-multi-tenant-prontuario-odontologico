'use client';

import { Input } from '@/shared/ui/input';

type PatientFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PatientFilter({ value, onChange }: PatientFilterProps) {
  return (
    <div className="max-w-md">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por nome, telefone, CPF ou ficha…"
        aria-label="Buscar pacientes"
      />
    </div>
  );
}
