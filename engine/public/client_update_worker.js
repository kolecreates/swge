import update from "./game/update.js";

const ticks_per_second = 30;
const tick_duration_ms = 1000 / ticks_per_second;

let tick = 0;
let start_ms = Date.now();
let last_tick_time = 0;
let prev_state = null;
let state = null;
let loop_id = null;
let events = [];
let local_player_id = null;
onmessage = async (e) => {
  events.push(e.data);
  if (e.data.type === "server_update" && e.data.loop_id !== loop_id) {
    start_ms = e.data.start_ms;
    tick = e.data.tick;
    prev_state = null;
    state = e.data.state;
    loop_id = e.data.loop_id;
  } else if (e.data.type === "server_connect") {
    while (true) {
      local_player_id = e.data.player_id;
      last_tick_time = Date.now();
      tick++;
      prev_state = state;

      state = update({
        ticks_per_second,
        ms_since_last_tick: tick_duration_ms,
        ms_since_start: last_tick_time - start_ms,
        start_ms,
        tick,
        loop_id,
        local_player_id,
        is_client: true,
        events,
        state,
      });
      events = [];
      postMessage({ type: "client_update", local_player_id, state, prev_state });
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, tick_duration_ms - (Date.now() - last_tick_time)))
      );
    }
  }
};
