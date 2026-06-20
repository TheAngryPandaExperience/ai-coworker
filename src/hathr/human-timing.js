/**
 * Human-like timing helpers for browser automation.
 * @param {() => number} [randomFn]
 */
export function createHumanTiming(randomFn = Math.random) {
  /**
   * @param {number} min
   * @param {number} max
   */
  function between(min, max) {
    return min + randomFn() * (max - min);
  }

  /**
   * @param {number} min
   * @param {number} max
   */
  function intBetween(min, max) {
    return Math.floor(between(min, max + 1));
  }

  /**
   * @param {number} [minMs]
   * @param {number} [maxMs]
   */
  function pause(minMs = 180, maxMs = 720) {
    const ms = intBetween(minMs, maxMs);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * @param {[number, number]} range
   */
  function thinkPause(range) {
    return pause(range[0], range[1]);
  }

  /**
   * Occasionally insert a longer hesitation, like reading the screen.
   * @param {number} [chance]
   */
  async function maybeHesitate(chance = 0.12) {
    if (randomFn() < chance) {
      await pause(400, 1400);
    }
  }

  /**
   * @param {number} minMs
   * @param {number} maxMs
   */
  function typingDelay(minMs, maxMs) {
    return intBetween(minMs, maxMs);
  }

  return {
    between,
    intBetween,
    pause,
    thinkPause,
    maybeHesitate,
    typingDelay,
  };
}
