import { parentPort } from "worker_threads";

const update = await import(process.env.GAME_UPDATE_FILE_PATH);

const loops = new Map();
parentPort.on("message", (message) => {
  events.push(message);
});

const ticks_per_second = 30;
const tick_duration_ms = 1000 / ticks_per_second;

while (true) {
  for (const event of events) {
    if (event.type === "start") {
      loops.set(event.loop_id, {
        tick: 0,
        start_ms: Date.now(),
        last_tick_time: 0,
        state: null,
        loop_id: event.loop_id,
        player_count: 1,
        events: [],
      });
    } else if (event.type === "stop") {
      loops.delete(event.loop_id);
    } else {
      if (event.type === "join") {
        loops.get(event.loop_id).player_count++;
      } else if (event.type === "leave") {
        loops.get(event.loop_id).player_count--;
        if (loops.get(event.loop_id).player_count === 0) {
          loops.delete(event.loop_id);
        }
      }

      loops.get(event.loop_id)?.events?.push(event);
    }
  }

  for (const [loop_id, loop_data] of loops) {
    const { tick, start_ms, last_tick_time, state, events } = loop_data;
    const ms_since_last_tick = Date.now() - last_tick_time;
    if (tick > 0 && ms_since_last_tick < tick_duration_ms) {
      continue;
    }
    const ms_since_start = last_tick_time - start_ms;
    const updated_state = update({
      ticks_per_second,
      ms_since_last_tick,
      ms_since_start,
      start_ms,
      tick,
      loop_id,
      events,
      state,
    });
    loop_data.last_tick_time = Date.now();
    loop_data.tick++;
    loop_data.state = updated_state;
    loop_data.events = [];
    parentPort.postMessage({ type: "update", loop_id, tick, start_ms, state: updated_state });
  }
}
