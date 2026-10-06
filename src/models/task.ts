
export const taskStatuses = ["todo", "in-progress", "done"] as const;

export type TaskStatus = (typeof taskStatuses)[number];

/** A task with its status and timestamp strings. */
export interface Task {
  /** Task identifier. */
  id: string;
  /** Task title. */
  title: string;
  /** Task description. */
  description: string;
  /** Current status: "todo", "in-progress", or "done". */
  status: TaskStatus;
  /** Creation timestamp. */
  createdAt: string;
  /** Last-update timestamp. */
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status: TaskStatus;
}

export type UpdateTaskInput = CreateTaskInput;
