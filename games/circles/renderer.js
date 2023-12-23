export default function renderer({ ui, emit }) {
  let move_x = 0;
  let move_y = 0;
  const set_move_x = (x, player_id) => {
    if (move_x !== x) {
      move_x = x;
      emit({ type: "move", x, player_id });
    }
  };
  const set_move_y = (y, player_id) => {
    if (move_y !== y) {
      move_y = y;
      emit({ type: "move", y, player_id });
    }
  };
  const pressed_keys = new Set();

  window.addEventListener("keydown", (e) => {
    pressed_keys.add(e.key);
  });

  window.addEventListener("keyup", (e) => {
    pressed_keys.delete(e.key);
  });

  let html = "";
  return ({ prev_state, state, local_player_id }) => {
    const next_html = `
    <p>${state.loop_id}</p>
    `;
    if (html !== next_html) {
      html = next_html;
      ui.innerHTML = html;
    }
    if (pressed_keys.has("ArrowLeft")) {
      set_move_x(-1, local_player_id);
    } else if (pressed_keys.has("ArrowRight")) {
      set_move_x(1, local_player_id);
    } else {
      set_move_x(0, local_player_id);
    }

    if (pressed_keys.has("ArrowUp")) {
      set_move_y(-1, local_player_id);
    } else if (pressed_keys.has("ArrowDown")) {
      set_move_y(1, local_player_id);
    } else {
      set_move_y(0, local_player_id);
    }
  };
}
