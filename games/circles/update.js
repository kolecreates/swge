// circles is a very simple game with no objective.
// it's literally just a space where each player is a circle
// a player moves their circle by using the keyword
// a lobby id is displayed on the screen.
// any player can join any lobby by going to the url
// @TODO names above circle
export default function update({ events, ticks_per_second, loop_id, is_client, local_player_id, state }) {
  const next_state = {
    ...(state || {
      space_width: 100,
      space_height: 100,
      entities: [],
    }),
  };

  if (!next_state.camera && is_client) {
    next_state.camera = { x: 0, y: 0, z: 1, fov_width: 100, fov_height: 100 };
  }

  next_state.loop_id = loop_id;

  for (let event of events) {
    if (event.type === "server_update") {
      const local_player_entity = next_state.entities.find((e) => e.id === local_player_id);
      const server_player_entity_index = event.state.entities.findIndex((e) => e.id === local_player_id);
      if (local_player_entity) {
        event.state.entities[server_player_entity_index] = {
          ...event.state.entities[server_player_entity_index],
          velocity: local_player_entity.velocity,
          x: local_player_entity.x,
          y: local_player_entity.y,
          z: local_player_entity.z,
        };
      }

      next_state.entities = event.state.entities;
      next_state.space_width = event.state.space_width;
      next_state.space_height = event.state.space_height;
    } else if (event.type === "join") {
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
        speed: 10,
        color: event.is_host ? "red" : "blue",
      });
    } else if (event.type === "leave") {
      next_state.entities = next_state.entities.filter((e) => e.id !== event.player_id);
      if (event.is_host) {
        next_state.entities[0].color = "red";
      }
    } else if (event.type === "move") {
      const entity = next_state.entities.find((e) => e.id === event.player_id);
      if (entity) {
        entity.velocity = [
          event.x === undefined ? entity.velocity[0] : Math.sign(event.x),
          event.y === undefined ? entity.velocity[1] : Math.sign(event.y),
        ];
      }
    }
  }

  for (let entity of next_state.entities) {
    const length = Math.sqrt(entity.velocity[0] ** 2 + entity.velocity[1] ** 2);
    const vx = length > 0 ? (entity.velocity[0] / length) * entity.speed : 0;
    const vy = length > 0 ? (entity.velocity[1] / length) * entity.speed : 0;

    entity.x += vx / ticks_per_second;
    entity.y += vy / ticks_per_second;

    // if (is_client && entity.id === local_player_id) {
    //   next_state.camera.x = entity.x;
    //   next_state.camera.y = entity.y;
    // }
  }

  return next_state;
}
