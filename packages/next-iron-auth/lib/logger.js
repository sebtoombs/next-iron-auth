// From next-auth
const logger = {
  error: (errorCode, ...text) => {
    if (!console) {
      return;
    }
    if (text && text.length <= 1) {
      text = text[0] || "";
    }
    console.error(
      `[next-iron-auth][error][${errorCode.toLowerCase()}]`,
      text
      // `\nhttps://next-auth.js.org/errors#${errorCode.toLowerCase()}`
    );
  },
  warn: (warnCode, ...text) => {
    if (!console) {
      return;
    }
    if (text && text.length <= 1) {
      text = text[0] || "";
    }
    console.warn(
      `[next-iron-auth][warn][${warnCode.toLowerCase()}]`,
      text
      // `\nhttps://next-auth.js.org/warnings#${warnCode.toLowerCase()}`
    );
  },
  debug: (debugCode, ...text) => {
    if (!console) {
      return;
    }
    if (text && text.length <= 1) {
      text = text[0] || "";
    }
    if (process && process.env && process.env._NEXT_IRON_AUTH_DEBUG) {
      console.log(`[next-iron-auth][debug][${debugCode.toLowerCase()}]`, text);
    }
  },
};

export default logger;
