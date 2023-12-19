/**
 * @typedef SBG_Player_Ability
 * @property {string} id
 * @property {number} cooldown_remaining_ms
 */

/**
 * @typedef SBG_Player
 * @property {string} id
 * @property {number} health
 * @property {number} energy
 * @property {number} kills
 * @property {number} deaths
 * @property {number} damage_dealt
 * @property {number} damage_taken
 * @property {number} healing_done
 * @property {number} healing_taken
 * @property {number} energy_used
 * @property {string} entity_id
 * @property {string} class
 * @property {number} team
 * @property {SBG_Player_Ability[]} abilities
 */

/**
 * @typedef SBG_State
 * @property {SWGE_Camera} camera
 * @property {SWGE_Entity[]} entities
 * @property {string} game_mode
 * @property {SWGE_Entity[]} spawns
 * @property {SBG_Player[]} players
 * @property {number} max_players
 * @property {number} max_time_ms
 * @property {number} max_players_per_team
 */

/**
 * @description updates the game state. called for every game loop tick.
 * @param {SWGE_Context} context
 * @param {SBG_State} state
 * @returns {SBG_State} new state
 */
export default function update(context, state) {}
