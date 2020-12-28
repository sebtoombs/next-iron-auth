// this file is a wrapper with defaults to be used in both API routes and `getServerSideProps` functions
import { withIronSession } from "next-iron-session";
import sessionOptions from "./sessionOptions";
export default function withSession(handler) {
  return withIronSession(handler, sessionOptions);
}
