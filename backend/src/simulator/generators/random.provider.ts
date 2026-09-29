export interface IRandomProvider {
  /**
   * Returns a pseudo-random floating point number in [0, 1)
   */
  next(): number;

  /**
   * Returns a random number in range [min, max]
   */
  nextInRange(min: number, max: number): number;

  /**
   * Generates Gaussian (normally distributed) noise using the Box-Muller transform
   */
  nextGaussian(mean?: number, stdDev?: number): number;
}

/**
 * Standard production random provider utilizing Math.random()
 */
export class DefaultRandomProvider implements IRandomProvider {
  next(): number {
    return Math.random();
  }

  nextInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextGaussian(mean = 0, stdDev = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 === 0) u1 = this.next(); // Avoid Math.log(0)
    while (u2 === 0) u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

/**
 * Deterministic pseudo-random number generator for automated unit & integration testing.
 * Uses a 32-bit Mulberry32 algorithm seeded with a fixed integer.
 */
export class DeterministicRandomProvider implements IRandomProvider {
  private state: number;

  constructor(seed = 123456789) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextGaussian(mean = 0, stdDev = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 === 0) u1 = this.next();
    while (u2 === 0) u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }

  reset(seed = 123456789): void {
    this.state = seed >>> 0;
  }
}
