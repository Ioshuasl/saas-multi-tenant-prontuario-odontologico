'use client';

import type { KeyboardEvent } from 'react';
import {
  TOOTH_CONDITION_FILL,
  TOOTH_CONDITION_LABELS,
  type ToothCondition,
} from '@/packages/clinico/enum/Odontogram/ToothConditionEnum';
import { TOOTH_FACES, TOOTH_FACE_LABELS, type ToothFace } from '@/packages/clinico/enum/Odontogram/ToothFaceEnum';
import { odontogramFaceCondition } from '@/packages/clinico/helpers/OdontogramCondition';
import { odontogramGlyph, odontogramIsUpper, odontogramMirror } from '@/packages/clinico/helpers/OdontogramFdi';
import {
  ODONTOGRAM_ABSENT_MARK,
  ODONTOGRAM_CEJ,
  ODONTOGRAM_CX,
  ODONTOGRAM_CY,
  ODONTOGRAM_FACE_PATHS,
  ODONTOGRAM_OCCLUSAL,
  ODONTOGRAM_OUTLINE,
  ODONTOGRAM_STROKE,
  ODONTOGRAM_VIEWBOX,
} from '@/packages/clinico/helpers/OdontogramSvgPaths';
import type { OdontogramTooth } from '@/packages/clinico/types/Odontogram/OdontogramTypes';
import { cn } from '@/shared/helpers/utils';

type OdontogramToothSvgProps = {
  toothCode: string;
  teeth: OdontogramTooth[];
  onSelect: (toothCode: string, face: ToothFace | null) => void;
};

function activate(event: KeyboardEvent, run: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    run();
  }
}

function faceFill(condition: ToothCondition): string {
  if (condition === 'HEALTHY') {
    return 'fill-transparent hover:fill-emerald-700/15 focus-visible:fill-emerald-700/20';
  }
  return TOOTH_CONDITION_FILL[condition];
}

export function OdontogramToothSvg({ toothCode, teeth, onSelect }: OdontogramToothSvgProps) {
  const glyph = odontogramGlyph(toothCode);
  const upper = odontogramIsUpper(toothCode);
  const { sx, sy } = odontogramMirror(toothCode);
  const whole = odontogramFaceCondition(teeth, toothCode, null);
  const missing = whole === 'ABSENT' || whole === 'EXTRACTED';
  const occlusal = ODONTOGRAM_OCCLUSAL[glyph];
  const faces = ODONTOGRAM_FACE_PATHS[glyph];
  const selectWhole = () => onSelect(toothCode, null);

  const fdiLabel = (
    <button
      type="button"
      className="rounded px-0.5 text-[11px] font-medium leading-none text-[#5c6d7e] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={selectWhole}
    >
      {toothCode}
    </button>
  );

  const drawing = (
    <svg
      viewBox={ODONTOGRAM_VIEWBOX}
      className="h-[7.25rem] w-full max-w-[2.85rem] overflow-visible"
      role="group"
      aria-label={`Dente ${toothCode}`}
    >
      <g
        transform={`translate(${ODONTOGRAM_CX} ${ODONTOGRAM_CY}) scale(${sx} ${sy}) translate(${-ODONTOGRAM_CX} ${-ODONTOGRAM_CY})`}
      >
        <path
          d={ODONTOGRAM_OUTLINE[glyph]}
          fill={whole === 'HEALTHY' ? '#fff' : undefined}
          stroke={ODONTOGRAM_STROKE}
          strokeWidth={1.35}
          strokeLinejoin="round"
          className={cn('cursor-pointer', whole === 'HEALTHY' ? '' : TOOTH_CONDITION_FILL[whole])}
          tabIndex={0}
          role="button"
          aria-label={`Dente ${toothCode} inteiro, ${TOOTH_CONDITION_LABELS[whole]}`}
          onClick={(event) => {
            event.stopPropagation();
            selectWhole();
          }}
          onKeyDown={(event) => activate(event, selectWhole)}
        />
        <path
          d={ODONTOGRAM_CEJ[glyph]}
          fill="none"
          stroke={ODONTOGRAM_STROKE}
          strokeWidth={1.2}
          className="pointer-events-none"
        />
        {occlusal ? (
          <path
            d={occlusal}
            fill="none"
            stroke={ODONTOGRAM_STROKE}
            strokeWidth={1.2}
            className="pointer-events-none"
          />
        ) : null}
        {TOOTH_FACES.map((face) => {
          const condition = odontogramFaceCondition(teeth, toothCode, face);
          return (
            <path
              key={face}
              d={faces[face]}
              style={{ stroke: 'none' }}
              className={cn('cursor-pointer', faceFill(condition))}
              tabIndex={0}
              role="button"
              aria-label={`Dente ${toothCode}, ${TOOTH_FACE_LABELS[face]}, ${TOOTH_CONDITION_LABELS[condition]}`}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(toothCode, face);
              }}
              onKeyDown={(event) => activate(event, () => onSelect(toothCode, face))}
            >
              <title>{`${toothCode} · ${TOOTH_FACE_LABELS[face]}`}</title>
            </path>
          );
        })}
        {missing ? (
          <path
            d={ODONTOGRAM_ABSENT_MARK}
            fill="none"
            stroke={ODONTOGRAM_STROKE}
            strokeWidth={1.6}
            className="pointer-events-none"
          />
        ) : null}
      </g>
    </svg>
  );

  return (
    <div className="grid min-w-0 justify-items-center gap-0.5">
      {upper ? (
        <>
          {drawing}
          {fdiLabel}
        </>
      ) : (
        <>
          {fdiLabel}
          {drawing}
        </>
      )}
    </div>
  );
}
