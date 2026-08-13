import type { ToothFace } from '@/packages/clinico/enum/Odontogram/ToothFaceEnum';
import type { OdontogramReferenceTooth } from '@/packages/clinico/helpers/OdontogramReferenceRegions';

export type OdontogramOverlayRect = { x: number; y: number; w: number; h: number };

export function odontogramNumberHitRect(tooth: OdontogramReferenceTooth): OdontogramOverlayRect {
  if (tooth.arch === 'upper') {
    return { x: tooth.x, y: tooth.y + tooth.h, w: tooth.w, h: 28 };
  }
  return { x: tooth.x, y: tooth.y - 28, w: tooth.w, h: 28 };
}

export function odontogramCrownRect(tooth: OdontogramReferenceTooth): OdontogramOverlayRect {
  if (tooth.arch === 'upper') {
    return {
      x: tooth.x + tooth.w * 0.06,
      y: tooth.y + tooth.h * 0.38,
      w: tooth.w * 0.88,
      h: tooth.h * 0.6,
    };
  }
  return {
    x: tooth.x + tooth.w * 0.06,
    y: tooth.y + tooth.h * 0.02,
    w: tooth.w * 0.88,
    h: tooth.h * 0.6,
  };
}

function mesialOnRight(code: string): boolean {
  const quadrant = Number(code[0]);
  return quadrant === 1 || quadrant === 4 || quadrant === 5 || quadrant === 8;
}

export function odontogramFaceRect(
  tooth: OdontogramReferenceTooth,
  face: ToothFace,
): OdontogramOverlayRect {
  const crown = odontogramCrownRect(tooth);
  const incisalBottom = tooth.arch === 'upper';
  const mRight = mesialOnRight(tooth.code);

  if (face === 'C') {
    return incisalBottom
      ? { x: crown.x, y: crown.y, w: crown.w, h: crown.h * 0.18 }
      : { x: crown.x, y: crown.y + crown.h * 0.82, w: crown.w, h: crown.h * 0.18 };
  }
  if (face === 'O') {
    return incisalBottom
      ? { x: crown.x + crown.w * 0.22, y: crown.y + crown.h * 0.55, w: crown.w * 0.56, h: crown.h * 0.38 }
      : { x: crown.x + crown.w * 0.22, y: crown.y + crown.h * 0.07, w: crown.w * 0.56, h: crown.h * 0.38 };
  }
  if (face === 'L') {
    return {
      x: crown.x + crown.w * 0.22,
      y: crown.y + crown.h * 0.4,
      w: crown.w * 0.56,
      h: crown.h * 0.18,
    };
  }
  if (face === 'V') {
    return {
      x: crown.x + crown.w * 0.22,
      y: crown.y + crown.h * 0.18,
      w: crown.w * 0.56,
      h: crown.h * 0.28,
    };
  }
  if (face === 'D') {
    return mRight
      ? { x: crown.x, y: crown.y + crown.h * 0.12, w: crown.w * 0.22, h: crown.h * 0.8 }
      : { x: crown.x + crown.w * 0.78, y: crown.y + crown.h * 0.12, w: crown.w * 0.22, h: crown.h * 0.8 };
  }
  return mRight
    ? { x: crown.x + crown.w * 0.78, y: crown.y + crown.h * 0.12, w: crown.w * 0.22, h: crown.h * 0.8 }
    : { x: crown.x, y: crown.y + crown.h * 0.12, w: crown.w * 0.22, h: crown.h * 0.8 };
}
