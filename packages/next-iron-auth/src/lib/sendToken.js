import { randomBytes } from "crypto";
import hashPassword from "./hashPassword";
import sendMail from "./sendMail";
import {
  emailHtmlLogin,
  emailHtmlResetPassword,
  emailTextLogin,
  emailTextResetPassword,
} from "./emailUtils";
import logger from "./logger";
import applyCallback from "./applyCallback";

export default async function sendToken({
  sendTo,
  action,
  options,
  provider = null,
}) {
  // Create a token
  const token = randomBytes(32).toString("hex");

  const hash = await hashPassword(token);

  // Store the token
  await options.storeToken({
    token,
    hash,
    sendTo,
    action,
    expires: new Date().getTime() + options.tokenExpiry,
  });

  const url = `${options.baseUrl}${options.basePath}/callback${
    provider ? `/${provider}` : ""
  }?type=token&sendTo=${encodeURIComponent(sendTo)}&token=${encodeURIComponent(
    token
  )}&action=${action}`;

  //Get an email body by context
  const site = options.siteName;
  var emailText, emailHTML, emailSubject;
  if (action === "login") {
    emailSubject = `Login to ${options.siteName}`;
    emailHTML = emailHtmlLogin({
      url,
      site,
      email: sendTo,
    });
    emailText = emailTextLogin({
      url,
      site,
      email: sendTo,
    });
  } else if (action === "reset-password") {
    emailSubject = `Reset password request for ${options.siteName}`;
    emailHTML = emailHtmlResetPassword({
      url,
      site,
      login: sendTo,
    });
    emailText = emailTextResetPassword({
      url,
      site,
      login: sendTo,
    });
  }

  // Allow the emailSubject, email content  to be overridden by user for custom actions
  // (e.g.) send verification token for sensitive actions, override email content etc
  ({ emailSubject, emailText, emailHTML } = await applyCallback(
    "email_template",
    [
      { emailSubject, emailText, emailHTML },
      { url, token, sendTo, action, context: "sendtoken", provider },
    ],
    options
  ));

  await sendMail({
    to: sendTo,
    text: emailText,
    html: emailHTML,
    subject: emailSubject,
    options,
  });

  logger.debug("SEND_TOKEN", { url, sendTo });

  return { token, url };
}
