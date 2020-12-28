/**
 * Generate, store and send a token
 */

import sendToken from "../lib/sendToken";

export default async (req, res, options) => {
  // sendTo is an email address for now
  const { sendTo, action } = await req.body;

  const user = req.session.get("user");

  const actions = {
    "reset-password": {
      authenticated: true,
    },
  };

  if (typeof actions[action] === `undefined`) {
    return res.status(400).json({ code: "INVALID_ACTION" });
  }

  if (actions[action].authenticated && !user) {
    return res.status(403).json({ code: "NOT_AUTHENTICATED" });
  }
  if (!actions[action].authenticated && user) {
    return res.status(400).json({ code: "AUTHENTICATED" });
  }

  try {
    await sendToken({ sendTo, action, options });

    return response({
      req,
      res,
      options,
      payload: {
        url: `${options.baseUrl}${options.basePath}/callback/token-sent?action=${action}`,
      },
    });
  } catch (e) {
    console.error(error);
    return res.status(500).json(error);
  }
};
