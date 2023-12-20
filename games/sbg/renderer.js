export default function renderer({ ui, emit }) {
  ui.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      emit({ type: "start_game" });
    }
  });

  let html = "";
  return ({ prev_state, state }) => {
    const new_html = `
  <div class="sbg_lobby_container">
    <h1>Simple Battle Game</h1>
    <p>${state.game_started ? "Game started!" : "Waiting for players..."}</p>
    ${state.game_started ? "" : "<button>Start Game</button>"}
  </div>
`;

    if (html !== new_html) {
      console.log(Date.now());
      html = new_html;
      ui.innerHTML = html;
    }
  };
}
