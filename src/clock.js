export const systemClock = { now: () => new Date() };

export class FakeClock {
  #ms;

  constructor(start = new Date('2026-11-13T00:00:00Z')) {
    this.#ms = new Date(start).getTime();
  }

  now() {
    return new Date(this.#ms);
  }

  advance(ms) {
    this.#ms += ms;
  }
}
