/**
 * Circular Buffer Implementation
 * Fixed-size buffer that overwrites oldest items when full
 */

export class CircularBuffer<T> {
  private items: T[] = [];
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(public readonly capacity: number) {
    this.items = new Array(capacity);
  }

  add(item: T): void {
    this.items[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  getRecent(n: number): T[] {
    const result: T[] = [];
    const actualN = Math.min(n, this.count);

    for (let i = 0; i < actualN; i++) {
      const index = (this.tail - 1 - i + this.capacity) % this.capacity;
      result.push(this.items[index]);
    }

    return result;
  }

  getOldest(n: number): T[] {
    const result: T[] = [];
    const actualN = Math.min(n, this.count);

    for (let i = 0; i < actualN; i++) {
      const index = (this.head + i) % this.capacity;
      result.push(this.items[index]);
    }

    return result;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined;
    }
    const actualIndex = (this.head + index) % this.capacity;
    return this.items[actualIndex];
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      result.push(this.items[index]);
    }
    return result;
  }

  clear(): void {
    this.items = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  get size(): number {
    return this.count;
  }

  get isFull(): boolean {
    return this.count === this.capacity;
  }

  get isEmpty(): boolean {
    return this.count === 0;
  }

  average(): number {
    if (this.count === 0) return 0;

    let sum = 0;
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      const value = this.items[index];
      if (typeof value === 'number') {
        sum += value;
      }
    }

    return sum / this.count;
  }

  min(): number {
    if (this.count === 0) return Infinity;

    let minVal = Infinity;
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      const value = this.items[index];
      if (typeof value === 'number' && value < minVal) {
        minVal = value;
      }
    }

    return minVal;
  }

  max(): number {
    if (this.count === 0) return -Infinity;

    let maxVal = -Infinity;
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      const value = this.items[index];
      if (typeof value === 'number' && value > maxVal) {
        maxVal = value;
      }
    }

    return maxVal;
  }

  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      callback(this.items[index], i);
    }
  }

  map<U>(callback: (item: T, index: number) => U): U[] {
    const result: U[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      result.push(callback(this.items[index], i));
    }
    return result;
  }

  filter(predicate: (item: T) => boolean): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const index = (this.head + i) % this.capacity;
      if (predicate(this.items[index])) {
        result.push(this.items[index]);
      }
    }
    return result;
  }
}

export default CircularBuffer;
