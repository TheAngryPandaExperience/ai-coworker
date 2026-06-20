import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "./tasks.js";

const PACKAGE_JSON = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf8"
  )
);

const INDEX_HTML = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "index.html"),
  "utf8"
);

/**
 * @typedef {import('http').IncomingMessage} IncomingMessage
 * @typedef {import('http').ServerResponse} ServerResponse
 */

/** @type {readonly string[]} */
export const FEATURES = [
  "tasks-ui",
  "tasks-api",
  "health",
  "features",
  "version",
];

/**
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {Record<string, unknown>} payload
 * @param {number} [statusCode]
 */
export function sendJson(req, res, payload, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload, null, 2));
}

/**
 * @param {ServerResponse} res
 */
function sendHtml(res) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(INDEX_HTML);
}

/**
 * @param {IncomingMessage} req
 * @returns {Promise<Record<string, unknown>>}
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = /** @type {Buffer[]} */ ([]);

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8").trim();
      if (!text) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

/**
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
export async function handleRequest(req, res) {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://localhost");
  const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);

  if (method === "GET" && url.pathname === "/") {
    sendHtml(res);
    return;
  }

  if (method === "GET" && url.pathname === "/api/health") {
    sendJson(req, res, {
      status: "ok",
      service: "ai-coworker",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/features") {
    sendJson(req, res, {
      features: FEATURES,
      count: FEATURES.length,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/version") {
    sendJson(req, res, {
      name: PACKAGE_JSON.name,
      version: PACKAGE_JSON.version,
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/tasks") {
    sendJson(req, res, { tasks: listTasks() });
    return;
  }

  if (method === "POST" && url.pathname === "/api/tasks") {
    try {
      const body = await readJsonBody(req);
      const title = typeof body.title === "string" ? body.title : "";
      const task = createTask(title);
      sendJson(req, res, task, 201);
    } catch (error) {
      sendJson(
        req,
        res,
        { error: error instanceof Error ? error.message : "Bad Request" },
        400
      );
    }
    return;
  }

  if (method === "PATCH" && taskMatch) {
    try {
      const body = await readJsonBody(req);
      const task = updateTask(taskMatch[1], {
        completed:
          typeof body.completed === "boolean" ? body.completed : undefined,
      });

      if (!task) {
        sendJson(req, res, { error: "Task not found" }, 404);
        return;
      }

      sendJson(req, res, task);
    } catch (error) {
      sendJson(
        req,
        res,
        { error: error instanceof Error ? error.message : "Bad Request" },
        400
      );
    }
    return;
  }

  if (method === "DELETE" && taskMatch) {
    const deleted = deleteTask(taskMatch[1]);
    if (!deleted) {
      sendJson(req, res, { error: "Task not found" }, 404);
      return;
    }

    sendJson(req, res, { ok: true });
    return;
  }

  sendJson(
    req,
    res,
    {
      error: "Not Found",
      path: url.pathname,
    },
    404
  );
}
