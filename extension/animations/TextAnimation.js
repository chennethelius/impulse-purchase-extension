/**
 * Text animation utilities - Pokemon-style typewriter effects
 */

class TextAnimation {
  /**
   * Typewriter animation - writes text character by character like old Pokemon games
   * @param {HTMLElement} element - Element to animate text into
   * @param {string} text - Full text to display
   * @param {number} speed - Milliseconds per character (default 50ms for classic Pokemon feel)
   * @returns {Promise} Resolves when animation completes
   */
  static typewriter(element, text, speed = 50) {
    return new Promise((resolve) => {
      // Clear existing content
      element.textContent = "";
      
      let charIndex = 0;
      
      const typeNextChar = () => {
        if (charIndex < text.length) {
          element.textContent += text[charIndex];
          charIndex++;
          
          // Add slight randomness for authentic Pokemon feel (±10ms)
          const variance = Math.random() * 20 - 10;
          setTimeout(typeNextChar, speed + variance);
        } else {
          // Animation complete
          resolve();
        }
      };
      
      typeNextChar();
    });
  }

  /**
   * Fast typewriter - quicker animation for user messages or speedup
   * @param {HTMLElement} element - Element to animate text into
   * @param {string} text - Full text to display
   * @returns {Promise} Resolves when animation completes
   */
  static typewriterFast(element, text) {
    return TextAnimation.typewriter(element, text, 20);
  }

  /**
   * Slow typewriter - slower animation for dramatic effect
   * @param {HTMLElement} element - Element to animate text into
   * @param {string} text - Full text to display
   * @returns {Promise} Resolves when animation completes
   */
  static typewriterSlow(element, text) {
    return TextAnimation.typewriter(element, text, 80);
  }

  /**
   * Skip to end of typewriter animation
   * Useful for letting players skip long animations
   * @param {HTMLElement} element - Element that's being typed into
   * @param {string} text - Full text to display
   */
  static skipTypewriter(element, text) {
    element.textContent = text;
  }

  /**
   * Typewriter with character sound effect callbacks
   * @param {HTMLElement} element - Element to animate text into
   * @param {string} text - Full text to display
   * @param {number} speed - Milliseconds per character
   * @param {Function} onChar - Callback fired for each character (can play sound)
   * @returns {Promise} Resolves when animation completes
   */
  static typewriterWithSound(element, text, speed = 50, onChar = null) {
    return new Promise((resolve) => {
      element.textContent = "";
      
      let charIndex = 0;
      
      const typeNextChar = () => {
        if (charIndex < text.length) {
          const char = text[charIndex];
          element.textContent += char;
          
          // Call sound callback if provided
          if (onChar && char.trim()) {
            onChar(char);
          }
          
          charIndex++;
          
          const variance = Math.random() * 20 - 10;
          setTimeout(typeNextChar, speed + variance);
        } else {
          resolve();
        }
      };
      
      typeNextChar();
    });
  }
}
