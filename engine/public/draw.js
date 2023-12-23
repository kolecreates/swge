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
export function swge_draw_entities(ctx, camera, entities) {
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

/**
 * @param {SWGE_Entity[]} prev_entities
 * @param {SWGE_Entity[]} next_entities
 * @param {number} alpha a number between 0 and 1 that represents how far between prev_entities and next_entities to interpolate
 * @returns {SWGE_Entity[]}
 */
export function swge_interpolate_entities(prev_entities, next_entities, alpha) {
  const interpolated_entities = [];
  const clamped_alpha = Math.max(0, Math.min(1, alpha));
  for (let i = 0; i < next_entities.length; i++) {
    const next_entity = next_entities[i];
    const prev_entity = prev_entities.find((e) => e.id === next_entity.id);
    if (!prev_entity) {
      interpolated_entities.push(next_entity);
      continue;
    }
    const interpolated_entity = {
      ...next_entity,
      x: prev_entity.x + (next_entity.x - prev_entity.x) * clamped_alpha,
      y: prev_entity.y + (next_entity.y - prev_entity.y) * clamped_alpha,
      z: prev_entity.z + (next_entity.z - prev_entity.z) * clamped_alpha,
      rotation_radians:
        prev_entity.rotation_radians + (next_entity.rotation_radians - prev_entity.rotation_radians) * clamped_alpha,
    };
    interpolated_entities.push(interpolated_entity);
  }
  return interpolated_entities;
}

//https://medium.com/@doomgoober/understanding-html-canvas-scaling-and-sizing-c04925d9a830
export function get_adjusted_canvas_size(canvas) {
  const dimensions = get_object_fit_size(true, canvas.clientWidth, canvas.clientHeight, canvas.width, canvas.height);

  const dpr = window.devicePixelRatio || 1;
  return [dimensions.width * dpr, dimensions.height * dpr];
}

export function get_adjusted_canvas_scale(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const ratio = Math.min(canvas.clientWidth / canvas.width, canvas.clientHeight / canvas.height);

  return ratio * dpr;
}

// adapted from: https://www.npmjs.com/package/intrinsic-scale
export function get_object_fit_size(
  contains /* true = contain, false = cover */,
  containerWidth,
  containerHeight,
  width,
  height
) {
  const doRatio = width / height;
  const cRatio = containerWidth / containerHeight;
  let targetWidth = 0;
  let targetHeight = 0;
  const test = contains ? doRatio > cRatio : doRatio < cRatio;

  if (test) {
    targetWidth = containerWidth;
    targetHeight = targetWidth / doRatio;
  } else {
    targetHeight = containerHeight;
    targetWidth = targetHeight * doRatio;
  }

  return {
    width: targetWidth,
    height: targetHeight,
    x: (containerWidth - targetWidth) / 2,
    y: (containerHeight - targetHeight) / 2,
  };
}
