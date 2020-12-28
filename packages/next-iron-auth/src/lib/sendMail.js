import nodemailer from "nodemailer";
import logger from "./logger";

export default async function sendMail({ to, text, html, subject, options }) {
  await new Promise((resolve, reject) => {
    const mailData = {
      to,
      from: options.emailFrom,
      subject: subject,
      text,
      html,
    };

    nodemailer
      .createTransport(process.env.EMAIL_SERVER)
      // .createTransport({
      //   host: "",
      //   port: 587,
      //   secure: false, // upgrade later with STARTTLS
      //   auth: {
      //     user: "",
      //     pass: "",
      //   },
      // })
      .sendMail(mailData, (error) => {
        if (error) {
          logger.error("SEND_MAIL", error);
          return reject(new Error("SEND_MAIL", error));
        }

        logger.debug("SEND_MAIL", mailData);

        return resolve();
      });
  });
}
