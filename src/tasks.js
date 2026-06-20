import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_DATA_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "tasks.json"
);

/** @type {string | undefined} */
let dataFileOverride;

/**
 * @typedef {{ id: string; title: string; completed: boolean; createdAt: string }} Task
 */

/**
 * @param {string} filePath
 */
export function setTasksDataFile(filePath) {
  dataFileOverride = filePath;
}

export function resetTasksDataFile() {
  dataFileOverride = undefined;
}

export function getTasksDataFile() {
  return dataFileOverride ?? DEFAULT_DATA_FILE;
}

function ensureDataFile() {
  const filePath = getTasksDataFile();
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  if (!existsSync(filePath)) {
    writeFileSync(filePath, "[]", "utf8");
  }
}

/**
 * @returns {Task[]}
 */
function readTasks() {
  ensureDataFile();
  const raw = readFileSync(getTasksDataFile(), "utf8");
  return /** @type {Task[]} */ (JSON.parse(raw));
}

/**
 * @param {Task[]} tasks
 */
function writeTasks(tasks) {
  ensureDataFile();
  writeFileSync(getTasksDataFile(), JSON.stringify(tasks, null, 2), "utf8");
}

/**
 * @returns {Task[]}
 */
export function listTasks() {
  return readTasks();
}

/**
 * @param {string} title
 * @returns {Task}
 */
export function createTask(title) {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Title is required");
  }

  const tasks = readTasks();
  const task = {
    id: randomUUID(),
    title: trimmed,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  writeTasks(tasks);
  return task;
}

/**
 * @param {string} id
 * @param {{ completed?: boolean }} updates
 * @returns {Task | null}
 */
export function updateTask(id, updates) {
  const tasks = readTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return null;
  }

  if (typeof updates.completed === "boolean") {
    tasks[index].completed = updates.completed;
  }

  writeTasks(tasks);
  return tasks[index];
}

/**
 * @param {string} id
 * @returns {boolean}
 */
export function deleteTask(id) {
  const tasks = readTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  writeTasks(tasks);
  return true;
}
