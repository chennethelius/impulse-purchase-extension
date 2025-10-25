/**
 * Pokemon Showdown Animations
 * A collection of animations that create a Pokemon battle experience
 */

function registerPokemonAnimations(animService) {
  // === ENTRANCE ANIMATIONS ===
  
  animService.registerAnimation("pokemonEnter", {
    duration: 600,
    description: "Pokemon enters from left with bounce"
  });

  animService.registerAnimation("userEnter", {
    duration: 600,
    description: "User enters from right"
  });

  // === ATTACK ANIMATIONS ===
  
  animService.registerAnimation("shake", {
    duration: 400,
    description: "Dramatic screen shake effect"
  });

  animService.registerAnimation("pulse", {
    duration: 600,
    description: "Pulsing glow effect"
  });

  animService.registerAnimation("slideAttack", {
    duration: 500,
    description: "Slide across screen attack"
  });

  animService.registerAnimation("bounce", {
    duration: 600,
    description: "Bouncy entrance effect"
  });

  // === STATUS ANIMATIONS ===
  
  animService.registerAnimation("fadeOut", {
    duration: 300,
    description: "Fade to invisible"
  });

  animService.registerAnimation("spin", {
    duration: 800,
    description: "360 degree spin rotation"
  });

  animService.registerAnimation("flip", {
    duration: 400,
    description: "3D flip effect"
  });

  // === SPECIAL EFFECTS ===

  animService.registerAnimation("glow", {
    duration: 1000,
    description: "Mystical glow effect"
  });

  animService.registerAnimation("jiggle", {
    duration: 300,
    description: "Fun jiggle animation"
  });
}

// Export for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { registerPokemonAnimations };
}
