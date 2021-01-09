import argon2 from "argon2";

export default async function verifyHash(hash, password) {
  // Make sure hash actually exists
  if (!hash || !password) {
    throw new Error("Hash or password empty");
  }
  return argon2.verify(hash, password);
}
