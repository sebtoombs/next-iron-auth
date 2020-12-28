/**
 * Callbacks
 *
 * token - verify token and complete some action (login, verify etc)
 */

import providers from "../providers.js";
import validateToken from "../lib/validateToken";
import response from "../lib/response";
import signIn from "../lib/signIn";

export default async (req, res, options) => {
  const path = req._auth_path.length > 1 ? req._auth_path[1] : null;

  const { action = "" } = req.query;

  // For now callbacks are only for providers. This may change
  if (!path || typeof providers[path] === `undefined`) {
    return response({
      req,
      res,
      options,
      payload: { error: "INVALID_CALLBACK" },
    });
  }

  const provider = providers[path];

  const { type } = provider;

  if (type === `email` && action === `login`) {
    const { token = "" } = req.query;
    try {
      const validationResult = await validateToken({ token, options });
      if (!validationResult) {
        return response({
          req,
          res,
          options,
          payload: { error: "INVALID_TOKEN", action, provider: path },
        });
      }
      const { sendTo, action } = validationResult;
      const [authErr, authResult] = await provider.authenticate(
        req,
        sendTo,
        options
      );
      if (authErr) {
        return response({
          req,
          res,
          options,
          payload: { error: authErr },
        });
      }
      const { account, user } = authResult;
      await signIn({ account, user, options, req });
      return response({
        req,
        res,
        options,
        payload: { url: `${options.baseUrl}${options.basePath}/profile` },
      });
    } catch (e) {
      console.error(e);
      return response({
        req,
        res,
        options,
        payload: { error: e },
      });
    }
  }

  return response({
    req,
    res,
    options,
    payload: { error: "INVALID_CALLBACK" },
  });

  // const { type = "" } = req.query;

  // if (!type) {
  //   return res.status(400).json({ code: "INVALID_CALLBACK_TYPE" });
  // }

  // if (type === "token") {
  //   const { token = "", action = "" } = req.query;
  //   if (!token) {
  //     // return res.status(400).json({code: "MISSING_TOKEN"});
  //     return res.send("MISSING_TOKEN");
  //   }
  //   if (!action) {
  //     // return res.status(400).json({ code: "MISSING_ACTION" });
  //     return res.send("MISSING_ACTION");
  //   }

  //   try {
  //     const validationResult = await validateToken({ token, options });
  //     if (!validationResult) {
  //       return res.send("INVALID_TOKEN");
  //     }
  //   } catch (e) {
  //     return res.send("UNKNOWN_ERROR");
  //   }
  // }
};
