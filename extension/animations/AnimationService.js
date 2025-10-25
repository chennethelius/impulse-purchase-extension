/**
 * AnimationService - Manages all overlay animations
 * Decouples animation logic from UI components
 * Provides a clean, reusable API for triggering animations
 */
class AnimationService {
  constructor() {
    this.animations = new Map();
    this.currentAnimation = null;
    this.animationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Register a custom animation
   * @param {string} name - Animation identifier
   * @param {Object} config - Animation configuration
   */
  registerAnimation(name, config) {
    this.animations.set(name, config);
  }

  /**
   * Trigger an animation on an element
   * @param {HTMLElement} element - Target element
   * @param {string} animationName - Which animation to play
   * @param {Object} options - Animation-specific options
   * @returns {Promise} Resolves when animation completes
   */
  async playAnimation(element, animationName, options = {}) {
    if (!element) {
      console.error("AnimationService: No element provided");
      return;
    }

    const animation = this.animations.get(animationName);
    if (!animation) {
      console.error(`AnimationService: Animation "${animationName}" not registered`);
      return;
    }

    this.currentAnimation = animationName;

    return new Promise((resolve) => {
      // Apply animation class
      element.classList.add(`animate-${animationName}`);

      // Listen for animation end
      const handleAnimationEnd = () => {
        element.removeEventListener("animationend", handleAnimationEnd);
        element.classList.remove(`animate-${animationName}`);
        this.currentAnimation = null;
        resolve();
      };

      element.addEventListener("animationend", handleAnimationEnd);

      // Fallback timeout in case animationend doesn't fire
      setTimeout(() => {
        element.removeEventListener("animationend", handleAnimationEnd);
        if (this.currentAnimation === animationName) {
          element.classList.remove(`animate-${animationName}`);
          this.currentAnimation = null;
          resolve();
        }
      }, animation.duration + 100);
    });
  }

  /**
   * Play multiple animations in sequence (one after another)
   * @param {HTMLElement} element - Target element
   * @param {string[]} animationNames - Array of animation names
   */
  async playSequence(element, animationNames) {
    for (const name of animationNames) {
      await this.playAnimation(element, name);
    }
  }

  /**
   * Play multiple animations in parallel (all at once)
   * @param {HTMLElement[]} elements - Array of elements
   * @param {string[]} animationNames - Array of animation names (one per element)
   */
  async playParallel(elements, animationNames) {
    const promises = elements.map((el, index) =>
      this.playAnimation(el, animationNames[index] || animationNames[0])
    );
    return Promise.all(promises);
  }

  /**
   * Check if any animation is currently playing
   */
  isAnimating() {
    return this.currentAnimation !== null;
  }

  /**
   * Get all registered animations
   */
  getRegisteredAnimations() {
    return Array.from(this.animations.keys());
  }
}

// Export for use in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationService };
}
