type ProgressPayload = { progress: number };

// Keep track of created instances for tests to inspect/control
export const __instances: FFmpeg[] = [] as any;

export class FFmpeg {
  // jest spies for common methods used in the project
  load = jest.fn(async (opts?: any) => Promise.resolve());
  writeFile = jest.fn(async (name: string, data: any) => Promise.resolve());
  exec = jest.fn(async (args: string[]) => Promise.resolve());
  readFile = jest.fn(async (name: string) => new Uint8Array());

  private listeners: Record<string, Array<(payload: any) => void>> = {};

  constructor() {
    __instances.push(this);
  }

  on = jest.fn((event: string, cb: (payload?: any) => void) => {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(cb);
  });

  off = jest.fn((event: string, cb?: (payload?: any) => void) => {
    if (!this.listeners[event]) return;
    if (!cb) {
      this.listeners[event] = [];
    } else {
      this.listeners[event] = this.listeners[event].filter((c) => c !== cb);
    }
  });

  // Helper used in tests to emit events (e.g., progress)
  __emit(event: string, payload?: any) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }

  // Convenience for emitting progress specifically
  __emitProgress(progress: number) {
    this.__emit("progress", { progress } as ProgressPayload);
  }
}
