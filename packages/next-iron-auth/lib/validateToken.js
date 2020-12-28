import argon2 from "argon2";

export default async function validateToken({
  token,
  options,
  destroyUsedToken = null,
}) {
  const { hash = false, expires = false, sendTo = false, action = false } =
    (await options.findToken({ token })) || {};

  if (!hash || !sendTo) {
    return false;
  }

  if (!(await argon2.verify(hash, token))) {
    return false;
  }

  const tokenExpired = new Date().getTime() > expires || !expires;

  destroyUsedToken =
    destroyUsedToken === true || destroyUsedToken === false
      ? destroyUsedToken
      : options.destroyToken;

  if (destroyUsedToken || tokenExpired) {
    try {
      await options.destroyToken({ token });
    } catch (e) {
      // DO nothing
    }
  }

  if (tokenExpired) return false;

  return { token, sendTo, action };
}
