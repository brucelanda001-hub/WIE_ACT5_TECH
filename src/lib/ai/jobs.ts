import { randomUUID } from "node:crypto";

// Responses are not streamed, so each question becomes a short-lived job. The child's screen
// polls it and shows each real stage: queued, searching notes, deep thinking, waiting for quota,
// switching to the fast model… (Spec A, Operational Constraints: "a sense of progress").

export type StageKey =
  | "reading"
  | "cache_hit"
  | "notes"
  | "triage"
  | "queued"
  | "thinking_fast"
  | "thinking_deep"
  | "waiting_quota"
  | "busy_fallback"
  | "fixing_request"
  | "low_quota"
  | "retrying"
  | "done";

export type Stage = { key: StageKey; at: number; data?: Record<string, string | number> };

export type ChatResult = {
  answer: string;
  lang: string;
  modelClass: "compact" | "mid" | "local" | "cache";
  route: string;
  notices: string[];
  confused: boolean;
  sources: string[];
  calls: number;
  retryAfterSec?: number;
  ms: number;
};

export type Job = {
  id: string;
  owner: string;
  status: "running" | "done" | "error";
  stages: Stage[];
  result?: ChatResult;
  error?: string;
  createdAt: number;
};

const g = globalThis as unknown as { __ednovaJobs?: Map<string, Job> };
const jobs = (g.__ednovaJobs ??= new Map());
const TTL = 10 * 60_000;

export function createJob(owner: string): Job {
  const now = Date.now();
  for (const [id, j] of jobs) if (now - j.createdAt > TTL) jobs.delete(id);
  const job: Job = { id: randomUUID(), owner, status: "running", stages: [], createdAt: now };
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function stageReporter(job: Job) {
  return (key: StageKey, data?: Stage["data"]) => {
    const last = job.stages[job.stages.length - 1];
    if (last && last.key === key) last.data = data; // update in place (e.g. queue position)
    else job.stages.push({ key, at: Date.now(), data });
  };
}
