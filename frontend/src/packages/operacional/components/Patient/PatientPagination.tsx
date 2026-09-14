'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/shared/helpers/utils';

type PatientPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function buildPageItems(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push('ellipsis');
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < totalPages - 1) items.push('ellipsis');
  items.push(totalPages);
  return items;
}

export function PatientPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PatientPaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = buildPageItems(page, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-[#F0EAE5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[#7A716C]">
        Mostrando <span className="font-medium text-[#1A1A1A]">{from}</span>–
        <span className="font-medium text-[#1A1A1A]">{to}</span> de{' '}
        <span className="font-medium text-[#1A1A1A]">{total}</span>
      </p>

      <nav aria-label="Paginação de pacientes" className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-lg border border-[#E4DDD6] bg-white text-[#4A0F16]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'hover:enabled:bg-[#F3EEE9]',
          )}
        >
          <ChevronLeftIcon className="size-4" />
        </button>

        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-xs text-[#9A908A]"
              aria-hidden
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Página ${item}`}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium tabular-nums',
                item === page
                  ? 'bg-[#4A0F16] text-white'
                  : 'border border-[#E4DDD6] bg-white text-[#3A3330] hover:bg-[#F3EEE9]',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Próxima página"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-lg border border-[#E4DDD6] bg-white text-[#4A0F16]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'hover:enabled:bg-[#F3EEE9]',
          )}
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </nav>
    </div>
  );
}
