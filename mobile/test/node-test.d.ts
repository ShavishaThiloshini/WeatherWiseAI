declare module 'node:assert/strict' {
  const assert: {
    equal(actual: unknown, expected: unknown): void;
    deepEqual(actual: unknown, expected: unknown): void;
    ok(value: unknown): void;
  };
  export default assert;
}

declare module 'node:test' {
  type TestCallback = () => void | Promise<void>;
  const test: (name: string, callback: TestCallback) => void;
  export default test;
}
