import { afterAll, spyOn } from 'bun:test';

type AnyFn = (...args: unknown[]) => unknown;

// mock.module replaces a module for every spec file that runs afterwards; spies are restored individually
// (not via mock.restore(), which resets every spy in the worker) so an unrelated spyOn() is left alone.
export function stubMethods(target: object, impls: object): void {
  const methods = target as Record<string, AnyFn>;
  const spies: ReturnType<typeof spyOn>[] = [];
  for (const [name, impl] of Object.entries(impls)) {
    if (typeof methods[name] !== 'function') {
      throw new Error(`Cannot stub "${name}": not a method of the target`);
    }
    spies.push(spyOn(methods, name).mockImplementation(impl as AnyFn));
  }
  afterAll(() => {
    for (const spy of spies) spy.mockRestore();
  });
}
