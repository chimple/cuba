import { sanitizeNativeBridgePayload } from './safeNativeBridgePayload';

describe('sanitizeNativeBridgePayload', () => {
  it('summarizes fields that commonly hold native-bridge unsafe payloads', () => {
    const result = sanitizeNativeBridgePayload({
      status: 'ok',
      rows: Array.from({ length: 25 }, (_, index) => ({ id: index })),
      base64: 'a'.repeat(1000),
    });

    expect(result).toEqual({
      status: 'ok',
      rows: {
        field: 'rows',
        type: 'array',
        count: 25,
        summarized: true,
      },
      base64: {
        field: 'base64',
        type: 'string',
        length: 1000,
        approximateBytes: 750,
        summarized: true,
      },
    });
  });

  it('limits depth, object keys, array items, and long strings', () => {
    const result = sanitizeNativeBridgePayload({
      values: Array.from({ length: 12 }, (_, index) => ({
        label: 'x'.repeat(600),
        nested: { one: { two: { three: 'deep' } } },
        index,
      })),
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7,
      h: 8,
      i: 9,
      j: 10,
      k: 11,
      l: 12,
      m: 13,
      n: 14,
      o: 15,
      p: 16,
      q: 17,
      r: 18,
      s: 19,
      t: 20,
      u: 21,
    });

    expect(JSON.stringify(result).length).toBeLessThan(9000);
    expect(result).toMatchObject({
      values: expect.arrayContaining([
        expect.objectContaining({
          label: expect.objectContaining({
            type: 'string',
            length: 600,
            truncated: true,
          }),
          nested: expect.objectContaining({
            type: 'object',
            keyCount: 1,
            summarized: true,
          }),
        }),
        expect.objectContaining({
          type: 'array',
          truncatedItems: 2,
          summarized: true,
        }),
      ]),
      __truncatedKeys: 2,
    });
  });

  it('keeps error details bounded', () => {
    const result = sanitizeNativeBridgePayload(
      new Error('native bridge failed'),
    );

    expect(result).toMatchObject({
      message: 'native bridge failed',
    });
  });
});
