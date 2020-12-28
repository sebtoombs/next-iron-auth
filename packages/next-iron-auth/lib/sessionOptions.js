export default {
  password: process.env.SECRET_COOKIE_PASSWORD,
  cookieName: process.env.COOKIE_NAME,
  cookieOptions: {
    // the next line allows to use the session in non-https environements like
    // Next.js dev mode (http://localhost:3000)
    secure: process.env.NODE_ENV === "production",
  },
};
