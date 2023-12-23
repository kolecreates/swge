import { swge_draw_entities, swge_interpolate_entities } from "./draw.js";

const ticks_per_second = 30;
const tick_duration_ms = 1000 / ticks_per_second;

let prev_state = null;
let state = null;
let last_frame_timestamp = null;
let time_since_last_update = null;
onmessage = (event) => {
  if (event.data.canvas) {
    const ctx = event.data.canvas.getContext("2d");

    ctx.scale(event.data.adjusted_scale, event.data.adjusted_scale);
    function draw(timestamp) {
      if (!last_frame_timestamp) {
        last_frame_timestamp = timestamp;
      } else {
        time_since_last_update += timestamp - last_frame_timestamp;
        last_frame_timestamp = timestamp;
      }
      if (prev_state?.camera && state?.camera && state?.entities && prev_state?.entities) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const alpha = time_since_last_update / tick_duration_ms;
        const interpolated_entities = swge_interpolate_entities(prev_state.entities, state.entities, alpha);
        const [interpolated_camera] = swge_interpolate_entities([prev_state.camera], [state.camera], alpha);
        swge_draw_entities(ctx, interpolated_camera, interpolated_entities);
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  } else {
    prev_state = event.data.prev_state;
    state = event.data.state;
    time_since_last_update = 0;
  }
};
