// circles is a very simple game with no objective.
// it's literally just a space where each player is a circle
// a player moves their circle by using the keyword
// a lobby id is displayed on the screen.
// any player can join any lobby by going to the url
export default function update({ events, ticks_per_second, loop_id, state }) {
  const next_state = {
    ...(state || {
      space_width: 100,
      space_height: 100,
      entities: [],
    }),
  };

  next_state.loop_id = loop_id;

  for (let event of events) {
    if (event.type === "join") {
      next_state.entities.push({
        id: event.player_id,
        x: Math.random() * next_state.space_width,
        y: Math.random() * next_state.space_height,
        z: 0,
        width: 10,
        height: 10,
        shape: "circle",
        rotation_origin_x: 0,
        rotation_origin_y: 0,
        rotation_radians: 0,
        velocity: [0, 0],
        speed: 1,
        color: event.is_host ? "red" : "blue",
      });
    }
    if (event.type === "leave") {
      next_state.entities = next_state.entities.filter((e) => e.id !== event.player_id);
      if (event.is_host) {
        next_state.entities[0].color = "red";
      }
    }

    if (event.type === "move") {
      const entity = next_state.entities.find((e) => e.id === event.player_id);
      if (entity) {
        entity.velocity = [
          Math.min(1, Math.max(-1, event.vector[0])) * entity.speed,
          Math.min(1, Math.max(-1, event.vector[1])) * entity.speed,
        ];
      }
    }
  }

  for (let entity of next_state.entities) {
    entity.x += entity.velocity[0] / ticks_per_second;
    entity.y += entity.velocity[1] / ticks_per_second;

    if (entity.x < 0) {
      entity.x = 0;
    }
    if (entity.x > next_state.space_width) {
      entity.x = next_state.space_width;
    }

    if (entity.y < 0) {
      entity.y = 0;
    }

    if (entity.y > next_state.space_height) {
      entity.y = next_state.space_height;
    }
  }

  return next_state;
}
