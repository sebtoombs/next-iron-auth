export default function tempID({ prefix = "guest_" }) {
  return (
    prefix +
    new Date().getTime().toString(16) +
    ":" +
    Math.random().toString(36).substr(2, 9)
  );
}
