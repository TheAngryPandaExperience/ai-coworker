import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HATHR_AREAS } from "./areas.js";
import { closeRunner, openSetupBrowser, queueAreaRun } from "./runner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PANEL_HTML = readFileSync(
  path.join(__dirname, "..", "..", "public", "hathr.html"),
  "utf8"
);

/** @typedef {import('./areas.js').HathrAreaId} HathrAreaId */

/** @type {Set<import('http').ServerResponse>} */
const sseClients = new Set();

/**
 * @param {Record<string, unknown>} payload
 */
function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    client.write(data);
  }
}

/**
 * @param {import('http').ServerResponse} res
 * @param {Record<string, unknown>} payload
 * @param {number} [statusCode]
 */
function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload, null, 2));
}

/**
 * @param {import('http').IncomingMessage} req
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
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
async function handleRequest(req, res) {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://localhost");

  if (method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(PANEL_HTML);
    return;
  }

  if (method === "GET" && url.pathname === "/api/areas") {
    sendJson(res, {
      areas: HATHR_AREAS.map((area) => ({
        id: area.id,
        label: area.label,
        description: area.description,
        shortcut: area.shortcut,
      })),
    });
    return;
  }

  if (method === "GET" && url.pathname === "/api/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("data: {\"type\":\"connected\"}\n\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  if (method === "POST" && url.pathname === "/api/setup") {
    try {
      await openSetupBrowser((event, detail) => {
        broadcast({ type: event, ...detail });
      });
      sendJson(res, { ok: true, message: "Setup browser opened." });
    } catch (error) {
      sendJson(
        res,
        { error: error instanceof Error ? error.message : "Setup failed" },
        500
      );
    }
    return;
  }

  if (method === "POST" && url.pathname === "/api/run") {
    try {
      const body = await readJsonBody(req);
      const areaId = typeof body.areaId === "string" ? body.areaId : "";
      const input =
        body.input && typeof body.input === "object"
          ? /** @type {Record<string, string>} */ (body.input)
          : {};
      const newChat = body.newChat === true;

      if (!areaId) {
        sendJson(res, { error: "areaId is required" }, 400);
        return;
      }

      const result = await queueAreaRun(
        {
          areaId: /** @type {HathrAreaId} */ (areaId),
          input,
          newChat,
        },
        (event, detail) => {
          broadcast({ type: event, ...detail });
        }
      );

      sendJson(res, result);
    } catch (error) {
      broadcast({
        type: "error",
        message: error instanceof Error ? error.message : "Run failed",
      });
      sendJson(
        res,
        { error: error instanceof Error ? error.message : "Run failed" },
        400
      );
    }
    return;
  }

  sendJson(res, { error: "Not Found", path: url.pathname }, 404);
}

/**
 * @param {number} [port]
 */
export function startHathrServer(port = Number(process.env.HATHR_PORT ?? 3001)) {
  const server = createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      sendJson(
        res,
        { error: error instanceof Error ? error.message : "Internal error" },
        500
      );
    });
  });

  server.listen(port, () => {
    console.log(`Hathr control panel: http://localhost:${port}`);
    console.log("Keyboard: F1/F2/F3 select area · Ctrl+Enter run · Ctrl+Shift+S setup login");
  });

  process.on("SIGINT", async () => {
    await closeRunner();
    server.close();
    process.exit(0);
  });

  return server;
}
