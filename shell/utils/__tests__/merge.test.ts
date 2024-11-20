import { mergeObjectAndArray, mergeObjectValueFromArrayEnv } from '@shell/utils/merge';

const obj = {
  a: 1,
  b: 2,
  c: 3
};

const array = [
  { key: 'b', value: 20 },
  { key: 'c', value: 30 },
  { key: 'd', value: 40 }
];

describe('fx: mergeObjectValueFromArray', () => {
  it('given a obj & array', () => {
    const result = mergeObjectValueFromArrayEnv(obj, array);

    const expected = {
      a: 1, b: 20, c: 30
    };

    expect(result).toStrictEqual(expected);
    // Output: { a: 1, b: 20, c: 30 }
  });
});

describe('fx: mergeObjectAndArray', () => {
  it('given a obj & array', () => {
    const result = mergeObjectAndArray(obj, array);

    const expected = {
      a: 1, b: 20, c: 30, d: 40
    };

    expect(result).toStrictEqual(expected);
    // Output: { a: 1, b: 20, c: 3, d: 40 }
  });
});
