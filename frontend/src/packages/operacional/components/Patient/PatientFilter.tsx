'use client';

import { SearchIcon } from 'lucide-react';
import type { PatientActiveFilter } from '@/packages/operacional/types/Patient/PatientTypes';
import { cn } from '@/shared/helpers/utils';

type PatientFilterProps = {
  search: string;
  onSearchChange: (value: string) => void;
  active: PatientActiveFilter;
  onActiveChange: (value: PatientActiveFilter) => void;
};

const ACTIVE_OPTIONS: Array<{ value: PatientActiveFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
];

export function PatientFilter({
  search,
  onSearchChange,
  active,
  onActiveChange,
}: PatientFilterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9A908A]"
          strokeWidth={1.7}
        />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nome, telefone, CPF ou ficha…"
          aria-label="Buscar pacientes"
          className={cn(
            'h-10 w-full rounded-full border border-[#E4DDD6] bg-white',
            'pr-4 pl-10 text-sm text-[#1A1A1A] placeholder:text-[#A39A94]',
            'outline-none transition-[border-color,box-shadow] focus:border-[#4A0F16]/35 focus:ring-2 focus:ring-[#4A0F16]/10',
          )}
        />
      </div>

      <div
        className="inline-flex rounded-full border border-[#E4DDD6] bg-white p-0.5"
        role="group"
        aria-label="Filtrar por status"
      >
        {ACTIVE_OPTIONS.map((option) => {
          const selected = active === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onActiveChange(option.value)}
              aria-pressed={selected}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                selected
                  ? 'bg-[#4A0F16] text-white'
                  : 'text-[#6F6762] hover:bg-[#F3EEE9] hover:text-[#4A0F16]',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
