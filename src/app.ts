import express, { type Express } from "express";

import {
  errorHandler,
  notFoundHandler,
} from "./middleware/errorHandler.js";
import { TaskRepository } from "./repositories/taskRepository.js";
import { createTaskRouter } from "./routes/taskRoutes.js";

export function createApp(
  repository: TaskRepository = new TaskRepository(),
): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/tasks", createTaskRouter(repository));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
