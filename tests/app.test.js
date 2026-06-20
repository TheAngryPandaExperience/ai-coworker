import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { handleRequest, FEATURES } from "../src/app.js";
import { resetTasksDataFile, setTasksDataFile } from "../src/tasks.js";

/**
 * @param {string} urlPath
 * @param {{ method?: string; body?: Record<string, unknown> }} [options]
 * @returns {Promise<{ statusCode: number; body: unknown; headers: Record<string, string> }>}
 */
function request(urlPath, options = {}) {
  const { method = "GET", body } = options;
  const bodyText = body !== undefined ? JSON.stringify(body) : "";

  return new Promise((resolve, reject) => {
    /** @type {((chunk: string) => void) | undefined} */
    let dataListener;
    /** @type {(() => void) | undefined} */
    let endListener;

    const req = /** @type {import('http').IncomingMessage} */ ({
      method,
      url: urlPath,
      /** @param {string} event @param {(...args: never[]) => void} listener */
      on(event, listener) {
        if (event === "data") {
          dataListener = /** @type {(chunk: string) => void} */ (listener);
        }
        if (event === "end") {
          endListener = /** @type {() => void} */ (listener);
        }
        return this;
      },
    });

    const res = {
      statusCode: 200,
      headers: /** @type {Record<string, string>} */ ({}),
      /** @param {number} statusCode @param {Record<string, string>} headers */
      writeHead(statusCode, headers) {
        this.statusCode = statusCode;
        this.headers = headers;
      },
      /** @param {string | Buffer | undefined} chunk */
      end(chunk) {
        const text = chunk ? String(chunk) : "";
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: text ? JSON.parse(text) : null,
        });
      },
    };

    queueMicrotask(() => {
      if (bodyText && dataListener) {
        dataListener(bodyText);
      }
      endListener?.();
    });

    handleRequest(req, /** @type {import('http').ServerResponse} */ (/** @type {unknown} */ (res))).catch(
      reject
    );
  });
}

test("GET / serves the task manager UI", async () => {
  const req = /** @type {import('http').IncomingMessage} */ ({
    method: "GET",
    url: "/",
  });
  let statusCode = 200;
  let contentType = "";
  let html = "";

  const res = {
    /** @param {number} code @param {Record<string, string>} headers */
    writeHead(code, headers) {
      statusCode = code;
      contentType = headers["Content-Type"] ?? "";
    },
    /** @param {string} chunk */
    end(chunk) {
      html = chunk;
    },
  };

  await handleRequest(req, /** @type {import('http').ServerResponse} */ (/** @type {unknown} */ (res)));

  assert.equal(statusCode, 200);
  assert.match(contentType, /text\/html/);
  assert.match(html, /Task Manager/);
});

test("GET /api/health returns ok status", async () => {
  const response = await request("/api/health");
  assert.equal(response.statusCode, 200);
  assert.equal(/** @type {{ status: string }} */ (response.body).status, "ok");
});

test("GET /api/features lists enabled features", async () => {
  const response = await request("/api/features");
  assert.equal(response.statusCode, 200);
  const body = /** @type {{ features: string[]; count: number }} */ (response.body);
  assert.deepEqual(body.features, FEATURES);
  assert.equal(body.count, FEATURES.length);
});

test("GET /api/version returns package metadata", async () => {
  const response = await request("/api/version");
  assert.equal(response.statusCode, 200);
  const body = /** @type {{ name: string; version: string }} */ (response.body);
  assert.equal(body.name, "ai-coworker");
  assert.match(body.version, /^\d+\.\d+\.\d+$/);
});

test("task API supports create, complete, and delete", async () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "ai-coworker-app-"));
  setTasksDataFile(path.join(tempDir, "tasks.json"));

  try {
    const createResponse = await request("/api/tasks", {
      method: "POST",
      body: { title: "Write tests" },
    });
    assert.equal(createResponse.statusCode, 201);
    const created = /** @type {{ id: string; title: string; completed: boolean }} */ (
      createResponse.body
    );
    assert.equal(created.title, "Write tests");
    assert.equal(created.completed, false);

    const listResponse = await request("/api/tasks");
    assert.equal(listResponse.statusCode, 200);
    assert.equal(
      /** @type {{ tasks: Array<{ id: string }> }} */ (listResponse.body).tasks.length,
      1
    );

    const patchResponse = await request(`/api/tasks/${created.id}`, {
      method: "PATCH",
      body: { completed: true },
    });
    assert.equal(patchResponse.statusCode, 200);
    assert.equal(
      /** @type {{ completed: boolean }} */ (patchResponse.body).completed,
      true
    );

    const deleteResponse = await request(`/api/tasks/${created.id}`, {
      method: "DELETE",
    });
    assert.equal(deleteResponse.statusCode, 200);

    const emptyList = await request("/api/tasks");
    assert.deepEqual(
      /** @type {{ tasks: unknown[] }} */ (emptyList.body).tasks,
      []
    );
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
    resetTasksDataFile();
  }
});

test("unknown route returns 404", async () => {
  const response = await request("/missing");
  assert.equal(response.statusCode, 404);
});
