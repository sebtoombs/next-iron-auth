import argon2 from "argon2";

export default async function validateToken({ token, options }) {
  const { hash = false, expires = false, sendTo = false, action = false } =
    (await options.findToken({ token })) || {};

  if (!hash || !sendTo) {
    return false;
  }

  if (!(await argon2.verify(hash, token))) {
    return false;
  }

  const tokenExpired = new Date().getTime() > expires || !expires;

  if (options.destroyUsedToken || tokenExpired) {
    try {
      await options.destroyToken({ token });
    } catch (e) {
      // DO nothing
    }
  }

  if (tokenExpired) return false;

  return { token, sendTo, action };
}
