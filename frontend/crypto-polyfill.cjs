// Polyfill for crypto.hash in Node.js < 20
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // Ensure crypto exists
  if (!global.crypto) {
    global.crypto = require('crypto');
  }

  // Ensure hash method exists
  if (!global.crypto.hash) {
    const crypto = require('crypto');
    global.crypto.hash = (algorithm, data) => {
      const hash = crypto.createHash(algorithm);
      hash.update(data);
      return hash.digest('hex');
    };
  }
}
