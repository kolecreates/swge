import renderer from "./game/renderer.js";

window.addEventListener("load", async () => {
  const worker = new Worker("./client_worker.js", {
    type: "module",
  });

  const ui = document.getElementById("swge_ui");
  const emit = (event) => worker.postMessage({ events: [event] });
  const render = renderer({ ui, emit });
  worker.onmessage = (e) => {
    render({
      state: e.data.state,
      prev_state: e.data.prev_state,
    });
  };
});
