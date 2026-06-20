import http from "node:http";
import { handleRequest } from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`AI Coworker server listening on http://localhost:${PORT}`);
});
