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

  it("returns a consistent validation error", async () => {
    const response = await request(createApp()).post("/tasks").send({
      title: " ",
      status: "blocked",
    });

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
      error: {
        code: "VALIDATION_ERROR",
        message: "title must be a non-empty string",
      },
    });
  });
});
