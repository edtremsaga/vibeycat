// Entity speeds
export const EAGLE_EVASION_SPEED = 1.0;
export const FRIEND_CAT_PLAYER_SPEED = 4.0;
export const PJ_AUTOPILOT_SPEED = 1.96875;

// Eagle movement smoothing (velocity-based acceleration factor)
// Lower values = smoother, wider turns (0.05-0.25 range recommended)
// Reduced from 0.08 to 0.05 for even smoother movement and better escape opportunities
export const EAGLE_ACCELERATION_FACTOR = 0.05;

// Maximum velocity the eagle can reach (prevents sudden speed spikes)
export const EAGLE_MAX_VELOCITY = 3.0;

// Minimum speed the eagle should maintain (prevents freezing when very close)
export const EAGLE_MIN_SPEED = 0.3; // Minimum speed to ensure eagle always moves

// Turn rate limiting - maximum angle change per frame (in radians)
// Lower values = smoother turns, prevents sudden direction changes
export const EAGLE_MAX_TURN_RATE = 0.12; // ~7 degrees per frame

// Distance-based speed scaling - slower when closer to target
// Gives cats better escape window when eagle is nearby
// Refined multi-tiered approach for balanced gameplay
export const EAGLE_CLOSE_DISTANCE = 200; // Distance where slowdown starts (increased from 150)
export const EAGLE_CLOSE_SPEED_MULTIPLIER = 0.5; // Speed multiplier at closest point (reduced from 0.7)
export const EAGLE_VERY_CLOSE_DISTANCE = 80; // Very close range - extra aggressive slowdown
export const EAGLE_VERY_CLOSE_MAX_SPEED_MULTIPLIER = 1.2; // Maximum total speed when very close

// Eagle starting position settings
export const EAGLE_MIN_DISTANCE_FROM_CATS = 250; // Minimum pixels from cats when spawning
export const EAGLE_SPAWN_TOP_PERCENT = 0.60; // Only spawn in top 60% of screen (away from water line)

// Entity sizes
export const CAT_RADIUS = 20;
export const EAGLE_RADIUS = 25;

// Ranges
export const EAGLE_EVASION_RANGE = 200;
export const EAGLE_PLUTO_PROXIMITY_BOOST_RANGE = 100;
export const PJ_EAGLE_PROXIMITY_BOOST_RANGE = 100;

// Environment
export const LAKE_HEIGHT_PERCENTAGE = 0.20;
export const DAY_CYCLE_DURATION = 120000;

// Power-up durations
export const LIGHTNING_STUN_DURATION = 2000;
export const LIGHTNING_COOLDOWN = 10000;
export const POWERUP_SPAWN_INTERVAL = 8000;
export const SHIELD_DURATION = 2000;
export const SPEED_BOOST_DURATION = 2000;
export const FREEZE_DURATION = 3000;
export const INVISIBILITY_DURATION = 2000;
export const DOUBLE_SCORE_DURATION = 10000;

// Multipliers
export const PLUTO_SPEED_BOOST_MULTIPLIER = 1.5;
export const EAGLE_BOOST_DURATION = 3000;
export const EAGLE_DEFENSIVE_BOOST_DURATION = 1000;

// Magic numbers (moved from code)
export const POWERUP_SHIELD_SPAWN_CHANCE = 0.375;
export const DIAGONAL_MOVEMENT_NORMALIZATION = Math.sqrt(2);
export const EAGLE_SHIELD_EVASION_MULTIPLIER = 1.2;
export const EAGLE_PJ_EVASION_MULTIPLIER = 1.5;
export const EAGLE_CHASE_BOOST_MULTIPLIER = 1.8; // Reduced from 2.5 for better balance
export const EAGLE_DEFENSIVE_BOOST_MULTIPLIER = 1.5;
export const EAGLE_TRAIL_UPDATE_INTERVAL = 50;
export const MAX_POWERUPS = 3;
export const MAX_TRAIL_POINTS = 10;
export const VICTORY_SCORE = 6;
export const LEVEL_TRANSITION_SCORE = 3;
export const GAME_OVER_SCORE = 3;

// Combo system
export const COMBO_WINDOW = 5000; // 5 seconds to maintain combo
export const COMBO_MULTIPLIER_BASE = 1.2; // 20% per combo
export const MAX_COMBO_MULTIPLIER = 3.0; // Max 3x multiplier

// Power-up spawn chances (must sum to 1.0)
export const POWERUP_COMMON_CHANCE = 0.75; // Speed, Shield
export const POWERUP_RARE_CHANCE = 0.20; // Freeze, Teleport
export const POWERUP_EPIC_CHANCE = 0.05; // Invisibility, Double Score

// Visual effects
export const SCREEN_SHAKE_DURATION = 200;
export const SCREEN_SHAKE_INTENSITY = 10;

