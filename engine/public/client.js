import renderer from "./game/renderer.js";

window.addEventListener("load", async () => {
  const worker = new Worker("./client_worker.js", {
    type: "module",
  });

  const ws = new WebSocket(`ws://${window.location.host}/ws`);

  worker.postMessage({ events: [{ type: "ws_connecting" }] });

  ws.onopen = () => {
    worker.postMessage({ events: [{ type: "ws_open" }] });
  };

  ws.onerror = (e) => {
    worker.postMessage({ events: [{ type: "ws_error", error: e }] });
  };

  ws.onclose = () => {
    worker.postMessage({ events: [{ type: "ws_close" }] });
  };

  ws.onmessage = (e) => {
    const event = JSON.parse(e.data);
    worker.postMessage({ events: [event] });
  };

  const ui = document.getElementById("swge_ui");
  const emit = (event) => {
    worker.postMessage({ events: [event] });
    ws.send(JSON.stringify(event));
  };
  const render = renderer({ ui, emit });

  worker.onmessage = (e) => {
    render({
      state: e.data.state,
      prev_state: e.data.prev_state,
    });
  };
});
