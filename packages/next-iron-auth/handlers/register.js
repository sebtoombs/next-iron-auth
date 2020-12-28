/**
 * Only for credentials login at this point
 * Maybe look at making it more generic in the future, but other providers don't really
 * require a registration step
 */
import providers from "../providers";

export default async (req, res, options) => {
  // Get the provider from the query
  const { provider = "" } = req.query;

  // For now, must be credentials provider
  if (provider !== "credentials") {
    return res.status(400).json({ code: "INVALID_PROVIDER" });
  }

  if (typeof providers[provider] === `undefined`) {
    return res.status(400).json({ code: "PROVIDER_NOT_FOUND" });
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
      return res.status(401).json({ code: "REGISTER_FAILURE", ...registerErr });
    }

    const { account, user } = registerResult;

    await signIn({ account, user, options, req });

    return response({
      req,
      res,
      options,
      payload: { url: `${options.baseUrl}${options.basePath}/profile` },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};
