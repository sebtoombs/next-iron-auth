import providers from "../providers";
import response from "../lib/response";
import signIn from "../lib/signIn";

export default async (req, res, options) => {
  // Get the provider from the query
  const { provider = "" } = req.query;

  if (typeof providers[provider] === `undefined`) {
    return res.status(400).json({ code: "PROVIDER_NOT_FOUND" });
  }

  if (
    !options.providers ||
    typeof options.providers[provider] === `undefined`
  ) {
    throw new Error(`Provider not configured`);
  }

  const { type } = providers[provider];

  if (type === "oauth" && req.method === "POST") {
    // TODO do oauth
  } else if (type === "email" && req.method === "POST") {
    try {
      // Send the email
      const [tokenErr] = await providers[provider].sendToken(req, options);
      if (tokenErr) {
        return response({ req, res, options, payload: { error: tokenErr } });
      }
      return response({ req, res, options, payload: {} });
    } catch (error) {
      return response({ req, res, options, payload: { error } });
    }
  } else if (type === "credentials" && req.method === "POST") {
    try {
      // Attempt to authenticate the user via the specified provider
      const [authErr, authResult] = await providers[provider].authenticate(
        req,
        options
      );

      if (authErr) {
        return response({
          req,
          res,
          options,
          payload: { code: "AUTH_FAILURE", ...authErr },
          code: 401,
        });
      }

      const { account, user } = authResult;

      // On success, merge any extra user data into the session cookie

      await signIn({ account, user, options, req });
      return res.status(200).send({ done: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  } else {
    return response({
      req,
      res,
      options,
      payload: `${options.baseUrl}${options.basePath}/signin`,
    });
  }
};
