/**
 * Callbacks
 *
 * token - verify token and complete some action (login, verify etc)
 */

import providers from "../providers.js";
import validateToken from "../lib/validateToken";
import response from "../lib/response";
import signIn from "../lib/signIn";
import applyCallback from "../lib/applyCallback";

export default async (req, res, options) => {
  const path = req._auth_path.length > 1 ? req._auth_path[1] : null;

  const { action: callbackAction = "", type = "", token = "" } = req.query;

  if (!path && type === "token" && callbackAction && token) {
    const validationResult = await validateToken({
      token,
      options,
      destroyUsedToken: req.method === "GET" ? false : null,
    });
    if (!validationResult) {
      return response({
        req,
        res,
        options,
        payload: {
          error: "INVALID_TOKEN",
          action: callbackAction,
          provider: path,
        },
      });
    }
    const { sendTo, action } = validationResult;
    if (action === "reset-password") {
      if (req.method === "GET") {
        // Show password reset form
        return res.redirect(
          `${options.baseUrl}${options.providers.credentials.passwordResetPath}?token=${token}`
        );
      } else if (req.method === "POST") {
        try {
          const [passwordResetErr] = await providers.credentials.resetPassword(
            req,
            sendTo,
            options
          );
          if (passwordResetErr) {
            return response({
              req,
              res,
              options,
              payload: { error: "PASSWORD_RESET", ...passwordResetErr },
            });
          }
          return response({
            req,
            res,
            options,
            payload: {
              url: `${options.baseUrl}${options.providers.credentials.passwordResetPath}?action=password-reset`,
            },
          });
        } catch (error) {
          return response({
            req,
            res,
            options,
            payload: { error },
          });
        }
      }
    }
  }

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

  const { type: providerType } = provider;

  if (providerType === `email` && callbackAction === `login`) {
    try {
      const validationResult = await validateToken({ token, options });
      if (!validationResult) {
        return response({
          req,
          res,
          options,
          payload: {
            error: "INVALID_TOKEN",
            action: callbackAction,
            provider: path,
          },
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
      const callbackResponse = await applyCallback(
        "callback::sign_in_redirect",
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
};
