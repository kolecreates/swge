/**
 * @typedef SWGE_Context
 * @property {number} ticks_per_second
 * @property {number} ms_since_last_tick the time in milliseconds since the last tick
 * @property {number} ms_since_start the time in milliseconds since the game started
 * @property {number} tick the current tick
 * @property {any[]} events
 */

/**
 * @typedef SWGE_Entity
 * @property {string} id the unique identifier for the entity
 * @property {number} x how far left or right the entity is
 * @property {number} y how high the entity is from the ground
 * @property {number} z how close or far the entity is from the camera
 * @property {number} width the width of the entity
 * @property {number} height the height of the entity
 * @property {number} rotation_origin_x the x coordinate of the point the entity rotates around
 * @property {number} rotation_origin_y the y coordinate of the point the entity rotates around
 * @property {number} rotation_radians how much the entity is rotated
 * @property {color} color the color of the entity
 */

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} width1
 * @param {number} height1
 * @param {number} x2
 * @param {number} y2
 * @param {number} width2
 * @param {number} height2
 * @returns {boolean} true if the two rectangles intersect, false otherwise
 */
function swge_is_rectangle_intersecting(x1, y1, width1, height1, x2, y2, width2, height2) {
  return x1 < x2 + width2 && x1 + width1 > x2 && y1 < y2 + height2 && y1 + height1 > y2;
}
