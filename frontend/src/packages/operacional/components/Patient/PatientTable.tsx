'use client';

import type { PatientSummary } from '@/packages/operacional/types/Patient/PatientTypes';
import {
  formatCpfMask,
  formatPhoneMask,
} from '@/packages/operacional/helpers/FormatPatientContact';
import type { PatientTableProps } from '@/packages/operacional/types/Patient/PatientTableTypes';
import { cn } from '@/shared/helpers/utils';

function displayName(patient: PatientSummary): string {
  return patient.socialName?.trim() || patient.name;
}

export function PatientTable({ patients, onOpen, loading }: PatientTableProps) {
  if (loading) {
    return (
      <div className="grid gap-2 p-4" aria-busy="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-11 animate-pulse rounded-lg bg-[#F3EEE9]" />
        ))}
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
        <p className="text-sm font-medium text-[#1A1A1A]">Nenhum paciente encontrado</p>
        <p className="max-w-sm text-xs text-[#7A716C]">
          Ajuste a busca ou o filtro, ou cadastre um novo paciente.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#F0EAE5] text-[10px] font-semibold tracking-[0.08em] text-[#A39A94] uppercase">
            <th className="px-4 py-2.5 font-semibold">Ficha</th>
            <th className="px-3 py-2.5 font-semibold">Nome</th>
            <th className="px-3 py-2.5 font-semibold">Telefone</th>
            <th className="px-3 py-2.5 font-semibold">CPF</th>
            <th className="px-3 py-2.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              tabIndex={0}
              role="link"
              aria-label={`Abrir paciente ${displayName(patient)}`}
              className={cn(
                'cursor-pointer border-b border-[#F0EAE5] transition-colors',
                'hover:bg-[#FCFAF8] focus-visible:bg-[#F3EEE9] focus-visible:outline-none',
              )}
              onClick={() => onOpen(patient)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen(patient);
                }
              }}
            >
              <td className="px-4 py-3 text-sm font-medium tabular-nums text-[#4A0F16]">
                #{patient.code}
              </td>
              <td className="px-3 py-3">
                <p className="truncate text-sm font-semibold text-[#1A1A1A]">
                  {displayName(patient)}
                </p>
                {patient.socialName ? (
                  <p className="truncate text-[11px] text-[#9A908A]">{patient.name}</p>
                ) : null}
              </td>
              <td className="px-3 py-3 text-sm tabular-nums text-[#3A3330]">
                {formatPhoneMask(patient.phonePrimary)}
              </td>
              <td className="px-3 py-3 text-sm tabular-nums text-[#3A3330]">
                {formatCpfMask(patient.cpf)}
              </td>
              <td className="px-3 py-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
                    patient.active
                      ? 'bg-[#E8F6EE] text-[#1F7A45]'
                      : 'bg-[#F3EEE9] text-[#7A716C]',
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      patient.active ? 'bg-[#1F7A45]' : 'bg-[#C4BBB4]',
                    )}
                    aria-hidden
                  />
                  {patient.active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
