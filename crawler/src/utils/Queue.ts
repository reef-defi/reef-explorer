import logger from "./logger";

class Queue<T> {
  maxLength?: number;

  values: T[] = [];

  constructor(maxLength?: number) {
    this.maxLength = maxLength;
  }

  push(value: T) {
    this.values.push(value);
  }

  pop(): T {
    if (this.values.length > 0) {
      return this.values.shift()!;
    }
    logger.error('Queue is empty!')
    throw new Error('Queue is empty');
  }

  len(): number {
    return this.values.length;
  }

  isFull(): boolean {
    if (!this.maxLength) {
      return false;
    }
    return this.maxLength <= this.values.length;
  }

  isEmpty(): boolean {
    return this.values.length === 0;
  }
}

export default Queue;
