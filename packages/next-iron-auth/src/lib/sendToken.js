import { randomBytes } from "crypto";
import argon2 from "argon2";
import sendMail from "./sendMail";
import {
  emailHtmlLogin,
  emailHtmlResetPassword,
  emailTextLogin,
  emailTextResetPassword,
} from "./emailUtils";
import logger from "./logger";

export default async function sendToken({
  sendTo,
  action,
  options,
  provider = null,
}) {
  // Create a token
  const token = randomBytes(32).toString("hex");

  const hash = await argon2.hash(token);

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

  await sendMail({
    to: sendTo,
    text: emailText,
    html: emailHTML,
    subject: emailSubject,
    options,
  });

  logger.debug("SEND_TOKEN", { url });

  return { token, url };
}
