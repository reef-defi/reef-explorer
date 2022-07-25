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
    if (this.values.length === 0) {
      throw new Error('Queue is empty');
    }
    return this.values.splice(0, 1)[0];
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
