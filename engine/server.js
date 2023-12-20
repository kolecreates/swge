import http from "http";
import fs from "fs";
import path from "path";
import * as WebSocket from "ws";

const __dirname = new URL(".", import.meta.url).pathname;

const game = process.argv[2];

if (!game) {
  console.error("No game specified");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let isInGameFolder = req.url.startsWith("/game/");
  let gameFolderPath = path.join(__dirname, "../games", game);
  let filePath = isInGameFolder
    ? path.join(gameFolderPath, req.url.replace("/game/", ""))
    : path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);

  let contentType = "text/html";
  const extname = path.extname(filePath);

  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile(path.join(__dirname, "public", "404.html"), (error, content) => {
          res.writeHead(404, { "Content-Type": "text/html" });
          res.end(content, "utf-8");
        });
      } else {
        console.error(error);
        res.writeHead(500);
        res.end("Server error");
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

const wss = new WebSocket.WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.id = Date.now(); // Assign a unique identifier to the WebSocket connection
  console.log(`Client connected: ${ws.id}`);
  ws.on("message", (data) => {
    const message = JSON.parse(data.toString()); // Convert buffer to string, then parse JSON
    console.log("Received: %s", message);
    wss.clients.forEach((client) => {
      const isSelf = client === ws;
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({}));
      }
    });
  });

  ws.on("close", () => {
    console.log(`Client disconnected: ${ws.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
