import http from "http";
import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";
import * as WebSocket from "ws";

const __dirname = new URL(".", import.meta.url).pathname;

const game = process.argv[2];

if (!game) {
  console.error("No game specified");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let is_in_game_folder = req.url.startsWith("/game/");
  let game_folder_path = path.join(__dirname, "../games", game);
  let file_path = is_in_game_folder
    ? path.join(game_folder_path, req.url.replace("/game/", ""))
    : path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);

  let content_type = "text/html";
  const extname = path.extname(file_path);

  switch (extname) {
    case ".js":
      content_type = "text/javascript";
      break;
    case ".css":
      content_type = "text/css";
      break;
  }

  fs.readFile(file_path, (error, content) => {
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
      res.writeHead(200, { "Content-Type": content_type });
      res.end(content, "utf-8");
    }
  });
});

const wss = new WebSocket.WebSocketServer({ server, path: "/ws" });

const worker = new Worker(path.join(__dirname, "./server_worker.js"), {
  env: {
    GAME_UPDATE_FILE_PATH: path.join(__dirname, "../games", game, "update.js"),
  },
});

const gen_uuid = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

const local_loops = new Set();

const emit_loop_event = (loop_id, event) => {
  if (local_loops.has(loop_id)) {
    worker.postMessage({ ...event, loop_id });
  } else {
    //@TODO publish to redis
  }
};

worker.on("message", (message) => {
  const serialized = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.loop_id === message.loop_id) {
      client.send(serialized);
    }
  });
  //@TODO publish to redis
});

wss.on("connection", (ws, req) => {
  const url_of_page = new URL(req.headers.referer);
  const join_loop_id = url_of_page.searchParams.get("loop_id");
  const loop_id = join_loop_id || gen_uuid();
  ws.id = gen_uuid();
  ws.loop_id = loop_id;

  if (join_loop_id) {
    emit_loop_event(loop_id, { type: "join", player_id: ws.id });
  } else {
    local_loops.add(loop_id);
    emit_loop_event({ type: "start", loop_id, player_id: ws.id });
  }

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    emit_loop_event(loop_id, { ...message, type: message.type, player_id: ws.id });
  });

  ws.on("close", () => {
    emit_loop_event(loop_id, { type: "leave", player_id: ws.id });
    unsubscribe_from_relayed_loop_events();
  });
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    worker.terminate();
    wss.close();
    server.close();
    process.exit();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
