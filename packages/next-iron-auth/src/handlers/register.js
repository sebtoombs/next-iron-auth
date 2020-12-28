/**
 * Only for credentials login at this point
 * Maybe look at making it more generic in the future, but other providers don't really
 * require a registration step
 */
import providers from "../providers";
import response from "../lib/response";
import signIn from "../lib/signIn";
import applyCallback from "../lib/applyCallback";

export default async (req, res, options) => {
  // Get the provider from the query
  const { provider = "" } = req.query;

  if (typeof providers[provider] === `undefined`) {
    // return res.status(400).json({ code: "PROVIDER_NOT_FOUND" });
    return response({
      req,
      res,
      options,
      payload: {
        error: "PROVIDER_NOT_CONFIGURED",
        message: "The specified provider is not configured",
      },
    });
  }

  // For now, must be credentials provider
  if (providers[provider].type !== "credentials") {
    // return res.status(400).json({ code: "INVALID_PROVIDER" });
    return response({
      req,
      res,
      options,
      payload: {
        error: "INVALID_PROVIDER",
        message:
          'Only providers with type "credentials" support the register endpoint.',
      },
    });
  }

  if (
    !options.providers ||
    typeof options.providers[provider] === `undefined`
  ) {
    throw new Error(`Provider not configured`);
  }

  // Make sure the findAccount method is set in options
  if (typeof options.findAccount !== `function`) {
    throw new Error("findAccount method not set.");
  }

  try {
    // Attempt to authenticate the user via the specified provider
    const [registerErr, registerResult] = await providers[provider].register(
      req,
      options
    );

    if (registerErr) {
      return response({
        req,
        res,
        options,
        payload: { error: registerErr },
      });
      // return res.status(401).json({ code: "REGISTER_FAILURE", ...registerErr });
    }

    const { account, user } = registerResult;

    await signIn({ account, user, options, req });

    const callbackResponse = await applyCallback(
      "register::register_redirect",
      [
        `${options.baseUrl}/profile`,
        { account, user, req, res, provider: "credentials" },
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
    return response({
      req,
      res,
      options,
      payload: { error },
    });
  }
};
