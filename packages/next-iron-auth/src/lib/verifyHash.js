import argon2 from "argon2";

export default async function verifyHash(hash, password) {
  return argon2.verify(hash, password);
}
