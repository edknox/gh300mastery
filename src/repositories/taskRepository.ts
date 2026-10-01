import { randomUUID } from "node:crypto";

import type { CreateTaskInput, Task, UpdateTaskInput } from "../models/task.js";

export class TaskRepository {
  private readonly tasks: Task[] = [];

  list(): Task[] {
    return [...this.tasks];
  }

  findById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.push(task);
    return task;
  }

  update(id: string, input: UpdateTaskInput): Task | undefined {
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      return undefined;
    }

    const currentTask = this.tasks[index];
    if (currentTask === undefined) {
      return undefined;
    }

    const updatedTask: Task = {
      ...currentTask,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    this.tasks[index] = updatedTask;
    return updatedTask;
  }

  delete(id: string): boolean {
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index === -1) {
      return false;
    }

    this.tasks.splice(index, 1);
    return true;
  }
}
