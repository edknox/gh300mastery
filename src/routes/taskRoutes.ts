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

export function createTaskRouter(repository: TaskRepository): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(200).json(repository.list());
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
