import assert from 'node:assert/strict';
import {
  integerToPtBr,
  receiptAmountInWords,
} from '../src/modules/billing/helpers/receipt_amount_in_words.helper.js';

const moneyCases: Array<[bigint, string]> = [
  [0n, 'zero reais'],
  [1n, 'um centavo'],
  [2n, 'dois centavos'],
  [50n, 'cinquenta centavos'],
  [100n, 'um real'],
  [101n, 'um real e um centavo'],
  [150n, 'um real e cinquenta centavos'],
  [200n, 'dois reais'],
  [1100n, 'onze reais'],
  [10000n, 'cem reais'],
  [10100n, 'cento e um reais'],
  [100000n, 'mil reais'],
  [180000n, 'mil e oitocentos reais'],
  [123456n, 'mil duzentos e trinta e quatro reais e cinquenta e seis centavos'],
  [200000n, 'dois mil reais'],
  [100000000n, 'um milhão de reais'],
];

function main() {
  for (const [cents, expected] of moneyCases) {
    assert.equal(receiptAmountInWords(cents), expected, `cents=${cents.toString()}`);
  }

  assert.equal(integerToPtBr(0n), 'zero');
  assert.equal(integerToPtBr(15n), 'quinze');
  assert.equal(integerToPtBr(100n), 'cem');
  assert.equal(integerToPtBr(1800n), 'mil e oitocentos');
  assert.equal(integerToPtBr(1_100_000n), 'um milhão e cem mil');

  assert.throws(() => receiptAmountInWords(-1n), RangeError);

  console.log('OK: receiptAmountInWords table checks passed');
}

main();
