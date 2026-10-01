import type { RequestHandler } from "express";

import {
  taskStatuses,
  type CreateTaskInput,
  type TaskStatus,
  type UpdateTaskInput,
} from "../models/task.js";
import { AppError } from "./errorHandler.js";

type RequestBody = Record<string, unknown>;

function requireBody(body: unknown): RequestBody {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Request body must be a JSON object",
    );
  }

  return body as RequestBody;
}

function requireNonEmptyString(
  body: RequestBody,
  field: "title" | "description",
): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `${field} must be a non-empty string`,
    );
  }

  return value.trim();
}

function requireStatus(value: unknown): TaskStatus {
  if (
    typeof value !== "string" ||
    !taskStatuses.includes(value as TaskStatus)
  ) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `status must be one of: ${taskStatuses.join(", ")}`,
    );
  }

  return value as TaskStatus;
}

function rejectUnknownFields(body: RequestBody): void {
  const allowedFields = new Set(["title", "description", "status"]);
  const unknownField = Object.keys(body).find(
    (field) => !allowedFields.has(field),
  );

  if (unknownField !== undefined) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      `Unknown field: ${unknownField}`,
    );
  }
}

export const validateCreateTask: RequestHandler = (req, _res, next) => {
  try {
    const body = requireBody(req.body);
    rejectUnknownFields(body);

    const input: CreateTaskInput = {
      title: requireNonEmptyString(body, "title"),
      description:
        body.description === undefined
          ? ""
          : requireNonEmptyString(body, "description"),
      status: body.status === undefined ? "todo" : requireStatus(body.status),
    };

    req.body = input;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateTask: RequestHandler = (req, _res, next) => {
  try {
    const body = requireBody(req.body);
    rejectUnknownFields(body);

    const input: UpdateTaskInput = {
      title: requireNonEmptyString(body, "title"),
      description: requireNonEmptyString(body, "description"),
      status: requireStatus(body.status),
    };

    req.body = input;
    next();
  } catch (error) {
    next(error);
  }
};
