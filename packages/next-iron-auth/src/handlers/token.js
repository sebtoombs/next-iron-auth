/**
 * Generate, store and send a token
 */

import sendToken from "../lib/sendToken";
import response from "../lib/response";

export default async (req, res, options) => {
  // sendTo is an email address for now
  const { sendTo, action } = await req.body;

  if (req.method !== "POST" || !sendTo || !action) {
    return res.status(400).json({ code: "BAD_REQUEST" });
  }

  const user = req.session.get("user");

  const actions = {
    "reset-password": {
      authenticated: null,
      accountRequired: "credentials",
    },
  };

  if (typeof actions[action] === `undefined`) {
    return res.status(400).json({ code: "INVALID_ACTION" });
  }

  if (actions[action].authenticated === true && !user) {
    return res.status(403).json({ code: "NOT_AUTHENTICATED" });
  }
  if (actions[action].authenticated === true && user) {
    return res.status(400).json({ code: "AUTHENTICATED" });
  }

  try {
    // TODO this needs thinking about from an abstract point of view
    // Currently it's very specific to password reset.
    if (
      typeof actions[action].accountRequired !== "undefined" &&
      actions[action].accountRequired
    ) {
      const account = await options.findAccount({
        login: `${actions[action].accountRequired}:${sendTo}`,
        provider: actions[action].accountRequired,
      });
      if (!account) {
        return response({
          req,
          res,
          options,
          payload: {
            error: "ACCOUNT_REQUIRED",
            message: "This action requires an existing account.",
          },
        });
      }
    }

    await sendToken({ sendTo, action, options });

    return response({
      req,
      res,
      options,
      payload: {
        url: `${options.baseUrl}${options.basePath}/callback/token-sent?action=${action}`,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};
