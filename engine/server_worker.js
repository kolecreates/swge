import { parentPort } from "worker_threads";
const update = (await import(process.env.GAME_UPDATE_FILE_PATH)).default;
const loops = new Map();
const ticks_per_second = 30;
const tick_duration_ms = 1000 / ticks_per_second;
const max_loop_time_ms = tick_duration_ms * 0.9;

parentPort.on("message", (event) => {
  if (event.type === "start") {
    loops.set(event.loop_id, {
      tick: 0,
      start_ms: Date.now(),
      last_tick_time: 0,
      state: null,
      loop_id: event.loop_id,
      player_count: 0,
      events: [],
    });
    if (loops.size === 1) {
      run_loops();
    }
  } else if (event.type === "stop") {
    loops.delete(event.loop_id);
  } else if (event.type === "join") {
    loops.set(event.loop_id, {
      ...loops.get(event.loop_id),
      player_count: loops.get(event.loop_id).player_count + 1,
    });
  } else if (event.type === "leave") {
    const loop_data = loops.get(event.loop_id);
    loop_data.player_count = loop_data.player_count - 1;
    if (loop_data.player_count <= 0) {
      parentPort.postMessage({ type: "server_worker_loop_stopped", loop_id: event.loop_id });
      loops.delete(event.loop_id);
    } else {
      loops.set(event.loop_id, loop_data);
    }
  }
  loops.get(event.loop_id)?.events?.push(event);
});

async function run_loops() {
  parentPort.postMessage({ type: "server_worker_loops_started", loop_count: loops.size });
  while (loops.size > 0) {
    const loop_start_time = Date.now();
    for (const [loop_id, loop_data] of loops) {
      const { tick, start_ms, last_tick_time, state, events } = loop_data;
      const ms_since_last_tick = Date.now() - last_tick_time;
      const ms_since_start = last_tick_time - start_ms;
      const updated_state = update({
        ticks_per_second,
        ms_since_last_tick,
        ms_since_start,
        start_ms,
        tick,
        loop_id,
        is_server: true,
        events,
        state,
      });
      loop_data.last_tick_time = Date.now();
      loop_data.tick++;
      loop_data.state = updated_state;
      loop_data.events = [];
      loops.set(loop_id, loop_data);
      parentPort.postMessage({ type: "server_update", loop_id, tick, start_ms, state: updated_state });
    }
    const loop_time = Date.now() - loop_start_time;
    if (max_loop_time_ms <= loop_time) {
      //@TODO handle this scenario
      parentPort.postMessage({ type: "server_worker_maxed_out", loop_time });
    }
    const time_to_sleep = tick_duration_ms - loop_time;
    if (time_to_sleep > 0) {
      await new Promise((resolve) => setTimeout(resolve, time_to_sleep));
    }
  }

  parentPort.postMessage({ type: "server_worker_loops_stopped" });
}
