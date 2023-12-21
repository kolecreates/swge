import update from "./game/update.js";

let events = [];
onmessage = (e) => {
  events.push(...e.data.events);
};

const ticks_per_second = 30;
const tick_duration_ms = 1000 / ticks_per_second;

let tick = 0;
let start_ms = Date.now();
let last_tick_time = 0;
let prev_state = null;
let state = null;
let loop_id = null;
while (true) {
  const update_event = events.find((e) => e.type === "update");
  if (update_event && update_event.loop_id !== loop_id) {
    start_ms = start_event.start_ms;
    tick = start_event.tick;
    prev_state = null;
    state = start_event.state;
    loop_id = start_event.loop_id;
  }

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
    events,
    state,
  });
  events = [];
  postMessage({ state, prev_state });
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, tick_duration_ms - (Date.now() - last_tick_time))));
}
