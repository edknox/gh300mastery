import assert from "node:assert/strict";
import { describe, it } from "node:test";

import request from "supertest";

import { createApp } from "../src/app.js";

describe("task management API", () => {
  it("returns the health status", async () => {
    const response = await request(createApp()).get("/health");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: "ok" });
  });

  it("returns an empty task list", async () => {
    const response = await request(createApp()).get("/tasks");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, []);
  });

  it("creates and retrieves a task", async () => {
    const app = createApp();
    const createResponse = await request(app).post("/tasks").send({
      title: "Write baseline tests",
      description: "Cover the CRUD status contracts",
      status: "in-progress",
    });

    assert.equal(createResponse.status, 201);
    assert.equal(createResponse.headers.location, `/tasks/${createResponse.body.id}`);
    assert.equal(createResponse.body.title, "Write baseline tests");
    assert.equal(createResponse.body.description, "Cover the CRUD status contracts");
    assert.equal(createResponse.body.status, "in-progress");
    assert.equal(typeof createResponse.body.createdAt, "string");
    assert.equal(createResponse.body.updatedAt, createResponse.body.createdAt);

    const getResponse = await request(app).get(
      `/tasks/${createResponse.body.id}`,
    );

    assert.equal(getResponse.status, 200);
    assert.deepEqual(getResponse.body, createResponse.body);
  });

  it("lists created tasks", async () => {
    const app = createApp();
    const created = await request(app).post("/tasks").send({
      title: "List task",
    });

    const response = await request(app).get("/tasks");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, [created.body]);
  });

  it("replaces a task", async () => {
    const app = createApp();
    const created = await request(app).post("/tasks").send({
      title: "Original",
    });

    const response = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({
        title: "Updated",
        description: "Replacement representation",
        status: "done",
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.id, created.body.id);
    assert.equal(response.body.title, "Updated");
    assert.equal(response.body.description, "Replacement representation");
    assert.equal(response.body.status, "done");
    assert.equal(response.body.createdAt, created.body.createdAt);
    assert.equal(typeof response.body.updatedAt, "string");
  });

  it("deletes a task", async () => {
    const app = createApp();
    const created = await request(app).post("/tasks").send({
      title: "Delete task",
    });

    const deleteResponse = await request(app).delete(
      `/tasks/${created.body.id}`,
    );
    assert.equal(deleteResponse.status, 204);
    assert.equal(deleteResponse.text, "");

    const getResponse = await request(app).get(`/tasks/${created.body.id}`);
    assert.equal(getResponse.status, 404);
    assert.equal(getResponse.body.error.code, "TASK_NOT_FOUND");
  });

  it("returns 404 for missing task operations", async () => {
    const app = createApp();
    const missingId = "missing";

    const getResponse = await request(app).get(`/tasks/${missingId}`);
    const putResponse = await request(app).put(`/tasks/${missingId}`).send({
      title: "Missing",
      description: "Does not exist",
      status: "todo",
    });
    const deleteResponse = await request(app).delete(`/tasks/${missingId}`);

    assert.equal(getResponse.status, 404);
    assert.equal(putResponse.status, 404);
    assert.equal(deleteResponse.status, 404);
    assert.equal(getResponse.body.error.code, "TASK_NOT_FOUND");
    assert.equal(putResponse.body.error.code, "TASK_NOT_FOUND");
    assert.equal(deleteResponse.body.error.code, "TASK_NOT_FOUND");
  });

  it("rejects a missing title", async () => {
    const response = await request(createApp()).post("/tasks").send({});

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: {
        code: "VALIDATION_ERROR",
        message: "title must be a non-empty string",
      },
    });
  });

  it("rejects invalid field types", async () => {
    const app = createApp();
    const invalidTitle = await request(app).post("/tasks").send({
      title: 42,
    });
    const invalidDescription = await request(app).post("/tasks").send({
      title: "Valid title",
      description: false,
    });
    const invalidStatus = await request(app).post("/tasks").send({
      title: "Valid title",
      status: 1,
    });

    assert.equal(invalidTitle.status, 400);
    assert.equal(
      invalidTitle.body.error.message,
      "title must be a non-empty string",
    );
    assert.equal(invalidDescription.status, 400);
    assert.equal(
      invalidDescription.body.error.message,
      "description must be a non-empty string",
    );
    assert.equal(invalidStatus.status, 400);
    assert.equal(
      invalidStatus.body.error.message,
      "status must be one of: todo, in-progress, done",
    );
  });

  it("requires every field when replacing a task", async () => {
    const app = createApp();
    const created = await request(app).post("/tasks").send({
      title: "Original",
    });

    const response = await request(app)
      .put(`/tasks/${created.body.id}`)
      .send({ title: "Incomplete replacement" });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: {
        code: "VALIDATION_ERROR",
        message: "description must be a non-empty string",
      },
    });
  });

  it("rejects an empty title", async () => {
    const response = await request(createApp()).post("/tasks").send({
      title: " ",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: {
        code: "VALIDATION_ERROR",
        message: "title must be a non-empty string",
      },
    });
  });

  it("rejects an unsupported status", async () => {
    const response = await request(createApp()).post("/tasks").send({
      title: "Invalid status task",
      status: "blocked",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: {
        code: "VALIDATION_ERROR",
        message: "status must be one of: todo, in-progress, done",
      },
    });
  });

  it("logs sanitized request metadata without sensitive values", async () => {
    const messages: string[] = [];
    const originalConsoleInfo = console.info;
    console.info = (message?: unknown) => {
      messages.push(String(message));
    };

    try {
      const response = await request(createApp())
        .get("/tasks/private@example.com?token=query-secret")
        .send({ title: "private-request-body" })
        .set("authorization", "Bearer authorization-secret");

      assert.equal(response.status, 404);
    } finally {
      console.info = originalConsoleInfo;
    }

    assert.equal(messages.length, 1);
    const logEntry = JSON.parse(messages[0] ?? "") as Record<string, unknown>;

    assert.deepEqual(Object.keys(logEntry).sort(), [
      "method",
      "path",
      "responseTimeMs",
      "statusCode",
      "timestamp",
    ]);
    assert.equal(logEntry.method, "GET");
    assert.equal(logEntry.path, "/tasks/:segment");
    assert.equal(logEntry.statusCode, 404);
    assert.equal(typeof logEntry.responseTimeMs, "number");
    assert.ok((logEntry.responseTimeMs as number) >= 0);
    assert.equal(typeof logEntry.timestamp, "string");
    assert.ok(!messages[0]?.includes("private@example.com"));
    assert.ok(!messages[0]?.includes("query-secret"));
    assert.ok(!messages[0]?.includes("authorization"));
    assert.ok(!messages[0]?.includes("private-request-body"));
  });
});
