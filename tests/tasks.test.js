import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createTask,
  deleteTask,
  listTasks,
  resetTasksDataFile,
  setTasksDataFile,
  updateTask,
} from "../src/tasks.js";

test("task store persists create, update, and delete", () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "ai-coworker-tasks-"));
  const dataFile = path.join(tempDir, "tasks.json");
  setTasksDataFile(dataFile);

  try {
    assert.deepEqual(listTasks(), []);

    const created = createTask("Buy milk");
    assert.equal(created.title, "Buy milk");
    assert.equal(created.completed, false);
    assert.match(created.id, /^[0-9a-f-]{36}$/);

    assert.equal(listTasks().length, 1);

    const updated = updateTask(created.id, { completed: true });
    assert.equal(updated?.completed, true);

    assert.equal(deleteTask(created.id), true);
    assert.deepEqual(listTasks(), []);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
    resetTasksDataFile();
  }
});

test("createTask rejects empty titles", () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "ai-coworker-tasks-"));
  setTasksDataFile(path.join(tempDir, "tasks.json"));

  try {
    assert.throws(() => createTask("   "), /Title is required/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("updateTask and deleteTask return null or false for missing ids", () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "ai-coworker-tasks-"));
  setTasksDataFile(path.join(tempDir, "tasks.json"));

  try {
    assert.equal(updateTask("missing-id", { completed: true }), null);
    assert.equal(deleteTask("missing-id"), false);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
