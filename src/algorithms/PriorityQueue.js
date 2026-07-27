/**
 * Stable max-priority queue backed by a binary heap.
 * Higher numeric priority values are dequeued first. Items with the same
 * priority retain insertion order so results remain deterministic.
 */
export class PriorityQueue {
  constructor() {
    this.heap = [];
    this.sequence = 0;
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  enqueue(value, priority = 0) {
    if (!Number.isFinite(priority)) {
      throw new TypeError("Priority must be a finite number.");
    }

    const node = { value, priority, sequence: this.sequence++ };
    this.heap.push(node);
    this.#bubbleUp(this.heap.length - 1);
    return this;
  }

  peek() {
    return this.heap[0]?.value;
  }

  dequeue() {
    if (this.heap.length === 0) return undefined;

    const first = this.heap[0];
    const last = this.heap.pop();

    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.#bubbleDown(0);
    }

    return first.value;
  }

  toSortedArray() {
    const copy = new PriorityQueue();
    copy.heap = this.heap.map((node) => ({ ...node }));
    copy.sequence = this.sequence;

    const values = [];
    while (!copy.isEmpty()) values.push(copy.dequeue());
    return values;
  }

  #isHigherPriority(left, right) {
    if (left.priority !== right.priority) {
      return left.priority > right.priority;
    }
    return left.sequence < right.sequence;
  }

  #bubbleUp(index) {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.#isHigherPriority(this.heap[parent], this.heap[current])) break;
      [this.heap[parent], this.heap[current]] = [this.heap[current], this.heap[parent]];
      current = parent;
    }
  }

  #bubbleDown(index) {
    let current = index;

    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let highest = current;

      if (left < this.heap.length && this.#isHigherPriority(this.heap[left], this.heap[highest])) {
        highest = left;
      }
      if (right < this.heap.length && this.#isHigherPriority(this.heap[right], this.heap[highest])) {
        highest = right;
      }
      if (highest === current) break;

      [this.heap[current], this.heap[highest]] = [this.heap[highest], this.heap[current]];
      current = highest;
    }
  }
}
