import argon2 from "argon2";

export default async function hashPassword(password) {
  const hash = await argon2.hash(password);
  return hash;
}
