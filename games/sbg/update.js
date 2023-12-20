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
 * @property {string} game_mode
 * @property {string} level
 * @property {boolean} in_lobby
 * @property {number} acceleration_factor
 * @property {number} match_time_ms
 * @property {number} max_match_time_ms
 * @property {number} max_match_count
 * @property {number[]} team_match_wins
 * @property {SWGE_Camera} camera
 * @property {SWGE_Entity[]} entities
 * @property {SWGE_Entity[]} spawns
 * @property {SBG_Player[]} players
 * @property {number} max_players
 * @property {number} max_time_ms
 * @property {number} max_players_per_team
 */

export default function update({ context, state }) {
  return {
    ...(state || {}),
    in_lobby: true,
    game_started: state?.game_started || context.events.find((e) => e.type === "start_game"),
    match_time_ms: context.ms_since_start,
  };
}
