import providers from "../providers";
import response from "../lib/response";
import signIn from "../lib/signIn";
import applyCallback from "../lib/applyCallback";

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
          payload: { error: "AUTH_FAILURE", code: authErr },
          code: 401,
        });
      }

      const { account, user } = authResult;

      // On success, merge any extra user data into the session cookie

      await signIn({ account, user, options, req });
      const callbackResponse = await applyCallback(
        "callback::sign_in_success",
        [
          `${options.baseUrl}/profile`,
          { account, user, req, res, provider: path },
        ],
        options
      );
      if (callbackResponse) {
        return response({
          req,
          res,
          options,
          payload: { url: callbackResponse },
        });
      } else {
        return;
      }
    } catch (error) {
      console.error(error);
      return response({
        req,
        res,
        options,
        payload: { error: e },
      });
    }
  } else {
    return res.status(404).send();
  }
};
