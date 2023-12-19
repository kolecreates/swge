/**
 * @typedef SWGE_Camera
 * @description The camera is the viewport that the user can see. The origin is the center of the camera.
 * @property {number} x top left corner of the camera in world coordinates
 * @property {number} y top left corner of the camera in world coordinates
 * @property {number} z how close or far the camera is from the world. positive is further away, negative is closer.
 * @property {number} fov_width how much of the world the camera can see horizontally. fov_width is equal to canvas.width.
 * @property {number} fov_height how much of the world the camera can see vertically. fov_height is equal to canvas.height.
 */

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {SWGE_Camera} camera
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number[]} [canvas_x, canvas_y]
 */
function swge_transform_world_coordinates_to_canvas_coordinates(ctx, camera, x, y) {
  // the top left corner of the camera in world coordinates is equivalent to the origin of the canvas (0,0)
  const canvas_units_per_world_x = ctx.canvas.width / camera.fov_width;
  const canvas_units_per_world_y = ctx.canvas.height / camera.fov_height;

  // first get world position relative to camera, then scale it to canvas coordinates
  const canvas_x = (x - camera.x) * canvas_units_per_world_x;
  const canvas_y = (y - camera.y) * canvas_units_per_world_y;

  return [canvas_x, canvas_y];
}

/**
 * @description Transforms an entity from world coordinates to canvas coordinates
 * @param {CanvasRenderingContext2D} ctx
 * @param {SWGE_Camera} camera
 * @param {SWGE_Entity} entity
 * @returns {SWGE_Entity}
 * */
function swge_transform_entity_to_canvas(ctx, camera, entity) {
  const [x, y] = swge_transform_world_coordinates_to_canvas_coordinates(ctx, camera, entity.x, entity.y);
  const scale = 1 + entity.z * 2;
  const [rotation_origin_x, rotation_origin_y] = swge_transform_world_coordinates_to_canvas_coordinates(
    ctx,
    camera,
    entity.rotation_origin_x + entity.x,
    entity.rotation_origin_y + entity.y
  );
  const [width, height] = swge_transform_world_coordinates_to_canvas_coordinates(
    ctx,
    {
      ...camera,
      x: 0, // set a fixed position here because the width/height is always the same regardless of camera (x,y)
      y: 0,
    },
    entity.width,
    entity.height
  );

  const scaled_width = width * scale;
  const scaled_height = height * scale;
  const scaled_x = x - (scaled_width - width) / 2;
  const scaled_y = y - (scaled_height - height) / 2;
  const scaled_rotation_origin_x = rotation_origin_x;
  const scaled_rotation_origin_y = rotation_origin_y;

  return {
    ...entity,
    x: scaled_x,
    y: scaled_y,
    width: scaled_width,
    height: scaled_height,
    rotation_origin_x: scaled_rotation_origin_x,
    rotation_origin_y: scaled_rotation_origin_y,
    scale,
  };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {SWGE_Camera} camera
 * @param {SWGE_Entity[]} entities
 * @returns {void}
 * */
function swge_draw_entities(ctx, camera, entities) {
  const sorted = entities.sort((a, b) => a.z - b.z);

  const scale = Math.max(0, 1 / (camera.z === 0 ? 1 : Math.abs(camera.z)));
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.scale(scale, scale);
  ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);

  for (const entity of sorted) {
    const is_behind_camera = entity.z > camera.z;
    if (is_behind_camera) {
      continue;
    }

    const transformed_entity = swge_transform_entity_to_canvas(ctx, camera, entity);

    ctx.translate(transformed_entity.rotation_origin_x, transformed_entity.rotation_origin_y);
    ctx.rotate(transformed_entity.rotation_radians);
    ctx.translate(-transformed_entity.rotation_origin_x, -transformed_entity.rotation_origin_y);

    ctx.fillStyle = transformed_entity.color;

    ctx.fillRect(transformed_entity.x, transformed_entity.y, transformed_entity.width, transformed_entity.height);

    ctx.translate(transformed_entity.rotation_origin_x, transformed_entity.rotation_origin_y);
    ctx.rotate(-transformed_entity.rotation_radians);
    ctx.translate(-transformed_entity.rotation_origin_x, -transformed_entity.rotation_origin_y);
  }

  ctx.resetTransform();
}
