import { aiConfig, type ModelClass } from "./config";
import { metrics } from "./metrics";

// Caps concurrent calls per model class (the platform limits concurrent requests per key)
// and tells each waiting request its place in line so the UI can show it.
type Waiter = { resolve: () => void; onPosition?: (pos: number) => void };

class Lane {
  active = 0;
  waiting: Waiter[] = [];
  constructor(private limit: () => number, private cls: ModelClass) {}

  async acquire(onPosition?: (pos: number) => void): Promise<() => void> {
    if (this.active < this.limit()) {
      this.active++;
      return () => this.release();
    }
    await new Promise<void>((resolve) => {
      this.waiting.push({ resolve, onPosition });
      metrics.peakQueue[this.cls] = Math.max(metrics.peakQueue[this.cls], this.waiting.length);
      onPosition?.(this.waiting.length);
    });
    this.active++;
    return () => this.release();
  }

  private release() {
    this.active--;
    const next = this.waiting.shift();
    this.waiting.forEach((w, i) => w.onPosition?.(i + 1));
    next?.resolve();
  }
}

const g = globalThis as unknown as { __ednovaLanes?: Record<ModelClass, Lane> };
const lanes = (g.__ednovaLanes ??= {
  compact: new Lane(() => aiConfig.concurrency.compact, "compact"),
  mid: new Lane(() => aiConfig.concurrency.mid, "mid"),
});

export function acquireSlot(cls: ModelClass, onPosition?: (pos: number) => void) {
  return lanes[cls].acquire(onPosition);
}

export function queueDepth(cls: ModelClass) {
  return lanes[cls].waiting.length;
}
