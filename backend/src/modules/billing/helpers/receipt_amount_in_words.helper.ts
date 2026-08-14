/**
 * Valor por extenso em pt-BR a partir de centavos (bigint). Sem float.
 * Ex.: 180000n → "mil e oitocentos reais"
 */
const UNITS = [
  'zero',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
] as const;
const TEENS = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
] as const;
const TENS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
] as const;
const HUNDREDS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
] as const;

const SCALES: ReadonlyArray<{ singular: string; plural: string }> = [
  { singular: '', plural: '' },
  { singular: 'mil', plural: 'mil' },
  { singular: 'milhão', plural: 'milhões' },
  { singular: 'bilhão', plural: 'bilhões' },
  { singular: 'trilhão', plural: 'trilhões' },
];

function belowThousand(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds > 0) parts.push(HUNDREDS[hundreds]!);
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]!);
  } else {
    const tens = Math.floor(rest / 10);
    const units = rest % 10;
    if (tens > 0) parts.push(TENS[tens]!);
    if (units > 0) parts.push(UNITS[units]!);
  }
  return parts.join(' e ');
}

function isSimpleRemainder(remainder: bigint): boolean {
  if (remainder <= 0n) return false;
  let n = remainder;
  let nonZeroGroups = 0;
  let lastGroup = 0;
  while (n > 0n) {
    const group = Number(n % 1000n);
    if (group !== 0) {
      nonZeroGroups += 1;
      lastGroup = group;
    }
    n /= 1000n;
  }
  if (nonZeroGroups !== 1) return false;
  return lastGroup < 100 || lastGroup % 100 === 0;
}

export function integerToPtBr(value: bigint): string {
  if (value < 0n) {
    throw new RangeError('Valor por extenso não aceita negativo.');
  }
  if (value === 0n) return 'zero';

  const phrases: string[] = [];
  const remainders: bigint[] = [];
  let rest = value;
  let scale = 0;
  while (rest > 0n) {
    const group = Number(rest % 1000n);
    rest /= 1000n;
    if (group !== 0) {
      const scaleLabel = SCALES[scale];
      if (!scaleLabel) {
        throw new RangeError('Valor por extenso excede a escala suportada.');
      }
      let phrase = belowThousand(group);
      if (scale === 1 && group === 1) {
        phrase = scaleLabel.singular;
      } else if (scale > 0) {
        const label = group === 1 ? scaleLabel.singular : scaleLabel.plural;
        phrase = `${phrase} ${label}`;
      }
      phrases.unshift(phrase);
      remainders.unshift(value % 1000n ** BigInt(scale + 1));
    }
    scale += 1;
  }

  let result = phrases[0] ?? '';
  for (let i = 1; i < phrases.length; i += 1) {
    const following = remainders[i] ?? 0n;
    const join = isSimpleRemainder(following) ? ' e ' : ' ';
    result = `${result}${join}${phrases[i]}`;
  }
  return result;
}

export function receiptAmountInWords(amountCents: bigint): string {
  if (amountCents < 0n) {
    throw new RangeError('Valor em centavos não pode ser negativo.');
  }

  const reais = amountCents / 100n;
  const centavos = Number(amountCents % 100n);

  const reaisWords = integerToPtBr(reais);
  const reaisConnector = reais >= 1_000_000n && reais % 1_000_000n === 0n ? ' de ' : ' ';
  const reaisLabel = reais === 1n ? 'real' : 'reais';
  const centavosLabel = centavos === 1 ? 'centavo' : 'centavos';

  if (reais === 0n && centavos === 0) {
    return 'zero reais';
  }
  if (reais === 0n) {
    return `${integerToPtBr(BigInt(centavos))} ${centavosLabel}`;
  }
  const reaisPart = `${reaisWords}${reaisConnector}${reaisLabel}`;
  if (centavos === 0) {
    return reaisPart;
  }
  return `${reaisPart} e ${integerToPtBr(BigInt(centavos))} ${centavosLabel}`;
}
