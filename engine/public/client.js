import { get_adjusted_canvas_scale, get_adjusted_canvas_size } from "./draw.js";
import renderer from "./game/renderer.js";

window.addEventListener("load", async () => {
  const update_worker = new Worker("./client_update_worker.js", {
    type: "module",
  });
  const ws = new WebSocket(`ws://${window.location.host}/ws${window.location.search}`);

  update_worker.postMessage({ type: "ws_connecting" });

  ws.onopen = () => {
    update_worker.postMessage({ type: "ws_open" });
  };

  ws.onerror = (e) => {
    update_worker.postMessage({ type: "ws_error", error: e });
  };

  ws.onclose = () => {
    update_worker.postMessage({ type: "ws_close" });
  };

  ws.onmessage = (e) => {
    const event = JSON.parse(e.data);
    update_worker.postMessage(event);
  };

  const ui = document.getElementById("swge_ui");
  const canvas = document.getElementById("swge_canvas");
  const [adjusted_canvas_width, adjusted_canvas_height] = get_adjusted_canvas_size(canvas);
  canvas.width = adjusted_canvas_width;
  canvas.height = adjusted_canvas_height;
  const adjusted_scale = get_adjusted_canvas_scale(canvas);
  const offscreen_canvas = canvas.transferControlToOffscreen();
  const draw_worker = new Worker("./client_draw_worker.js", {
    type: "module",
  });
  draw_worker.postMessage({ type: "canvas", canvas: offscreen_canvas, adjusted_scale }, [offscreen_canvas]);

  const emit = (event) => {
    ws.send(JSON.stringify(event));
    update_worker.postMessage(event);
    draw_worker.postMessage(event);
  };
  const render = renderer({ ui, emit });

  update_worker.onmessage = (e) => {
    draw_worker.postMessage(e.data);
    render(e.data);
  };
});
