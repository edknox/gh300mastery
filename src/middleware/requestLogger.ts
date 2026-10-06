import type { RequestHandler } from "express";

const safePathSegments = new Set(["health", "tasks"]);

export interface RequestLogEntry {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
}

function sanitizePath(path: string): string {
  const segments = path
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => safePathSegments.has(segment) ? segment : ":segment");

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

export const requestLogger: RequestHandler = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const start = process.hrtime.bigint();
  const path = sanitizePath(req.path);

  res.on("finish", () => {
    const responseTimeMs =
      Number(process.hrtime.bigint() - start) / 1_000_000;

    console.info(JSON.stringify({
      timestamp,
      method: req.method,
      path,
      statusCode: res.statusCode,
      responseTimeMs,
    } satisfies RequestLogEntry));
  });

  next();
};
