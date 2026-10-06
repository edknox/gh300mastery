
import { Router } from "express";

import {
  validateCreateTask,
  validateUpdateTask,
} from "../middleware/validateTask.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "../models/task.js";
import type { TaskRepository } from "../repositories/taskRepository.js";

function taskNotFound(id: string): AppError {
  return new AppError(404, "TASK_NOT_FOUND", `Task ${id} was not found`);
}

function getTaskId(value: string | string[] | undefined): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Task ID is required");
  }

  return value;
}

/**
 * Creates handlers for listing, retrieving, creating, updating, and deleting tasks.
 *
 * Requests use the `id` path parameter for item routes and a validated task body
 * for create and update routes. Successful responses return `200` with task data,
 * `201` with the created task, or `204` after deletion. Invalid or missing IDs
 * produce a `400` error, and unknown task IDs produce a `404` error.
 *
 * @param repository Task persistence used by the handlers.
 */
export function createTaskRouter(repository: TaskRepository): Router {
  const router = Router();

  router.get("/", (req, res, next) => {
    const limitValue = req.query.limit;
    let limit = 20;

    if (limitValue !== undefined) {
      if (
        typeof limitValue !== "string" ||
        !/^[1-9]\d*$/.test(limitValue) ||
        Number(limitValue) > 100
      ) {
        next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "limit must be an integer between 1 and 100",
          ),
        );
        return;
      }
      limit = Number(limitValue);
    }

    const cursorValue = req.query.cursor;
    let cursor: string | undefined;
    if (cursorValue !== undefined) {
      if (typeof cursorValue !== "string" || cursorValue.length === 0) {
        next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "cursor must be a valid base64-encoded task ID",
          ),
        );
        return;
      }

      const decoded = Buffer.from(cursorValue, "base64");
      const decodedId = decoded.toString("utf8");
      if (
        decoded.length === 0 ||
        decoded.toString("base64") !== cursorValue ||
        !Buffer.from(decodedId, "utf8").equals(decoded)
      ) {
        next(
          new AppError(
            400,
            "VALIDATION_ERROR",
            "cursor must be a valid base64-encoded task ID",
          ),
        );
        return;
      }
      cursor = decodedId;
    }

    const page = repository.listPage(limit, cursor);
    if (page === undefined) {
      next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "cursor does not identify an existing task",
        ),
      );
      return;
    }

    res.status(200).json(page);
  });

  router.get("/:id", (req, res, next) => {
    const id = getTaskId(req.params.id);
    const task = repository.findById(id);
    if (task === undefined) {
      next(taskNotFound(id));
      return;
    }

    res.status(200).json(task);
  });

  router.post("/", validateCreateTask, (req, res) => {
    const task = repository.create(req.body as CreateTaskInput);
    res.location(`/tasks/${task.id}`).status(201).json(task);
  });

  router.put("/:id", validateUpdateTask, (req, res, next) => {
    const id = getTaskId(req.params.id);
    const task = repository.update(id, req.body as UpdateTaskInput);
    if (task === undefined) {
      next(taskNotFound(id));
      return;
    }

    res.status(200).json(task);
  });

  router.delete("/:id", (req, res, next) => {
    const id = getTaskId(req.params.id);
    if (!repository.delete(id)) {
      next(taskNotFound(id));
      return;
    }

    res.status(204).send();
  });

  return router;
}
