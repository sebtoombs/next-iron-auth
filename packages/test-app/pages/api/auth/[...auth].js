import Auth from "next-iron-auth/handlers";
import path from "path";

var Datastore = require("nedb"),
  db = {};

const dataPath = path.resolve("./packages/test-app/tmp-data");

db.accounts = new Datastore({
  filename: path.join(dataPath, "accounts.db"),
  autoload: true,
});
db.users = new Datastore({
  filename: path.join(dataPath, "users.db"),
  autoload: true,
});
db.tokens = new Datastore({
  filename: path.join(dataPath, "tokens.db"),
  autoload: true,
});

const options = {
  emailFrom: "Seb Toombs <sebtoombs@gmail.com>",
  linkUser: async ({ login, email, provider }) => {
    // There are a number of ways one might implement this
    // It's always going to be implementation specific
    // In this scenario, the loginId is "email" for credentials provider, so
    // that will always get passed, but the only thing you can guarantee is
    // "login" & "provier" (string)

    // You could search for an account with another provider and get the user id
    // In this case we're going to search for a user with the email address
    return new Promise((resolve, reject) => {
      db.users.find({ email }, (err, docs) => {
        if (err) {
          return reject(err);
        }
        return resolve(docs.length ? docs[0] : null);
      });
    });
  },
  createUser: async ({ email }) => {
    return new Promise((resolve, reject) => {
      db.users.insert(
        {
          email,
        },
        (err, newDoc) => {
          if (err) {
            return reject(err);
          }
          return resolve(newDoc);
        }
      );
    });
  },
  createAccount: async ({ login, provider, hash, userId }) => {
    return new Promise((resolve, reject) => {
      db.accounts.insert(
        {
          login,
          provider,
          hash,
          userId,
        },
        (err, newDoc) => {
          if (err) {
            return reject(err);
          }
          return resolve(newDoc);
        }
      );
    });
  },
  //accountIdKey: "_id",
  findAccount: async ({ login, provider }) => {
    return new Promise((resolve, reject) => {
      db.accounts.find({ login, provider }, (err, docs) => {
        if (err) {
          return reject(err);
        }
        return resolve(docs.length ? docs[0] : null);
      });
    });
  },
  updateAccount: async (id, data) => {
    return new Promise((resolve, reject) => {
      db.accounts.update({ _id: id }, { $set: data }, {}, (err, updates) => {
        if (err) {
          return reject(err);
        }
        return resolve(updates);
      });
    });
  },
  //userIdKey: "_id",
  findUser: async ({ _id }) => {
    //by is either "id" or "email"
    return new Promise((resolve, reject) => {
      db.users.find({ _id }, (err, docs) => {
        if (err) {
          return reject(err);
        }
        return resolve(docs.length ? docs[0] : null);
      });
    });
  },
  sessionData: async ({ account }, req) => {
    // Add extra data to session. Usually this would be data about the user
    // return { name: "Seb", roles: ["ADMIN"] };
    return {};
  },
  storeToken: async ({ token, hash, sendTo, action, expires }) => {
    return new Promise((resolve, reject) => {
      db.tokens.insert(
        {
          token,
          hash,
          sendTo,
          action,
          expires,
        },
        (err, newDoc) => {
          if (err) {
            return reject(err);
          }
          return resolve(newDoc);
        }
      );
    });
  },
  findToken: async ({ token }) => {
    return new Promise((resolve, reject) => {
      db.tokens.find({ token }, (err, docs) => {
        if (err) {
          return reject(err);
        }
        return resolve(docs.length ? docs[0] : null);
      });
    });
  },
  destroyToken: async ({ token }) => {
    return new Promise((resolve, reject) => {
      db.tokens.remove({ token }, (err, numRemoved) => {
        if (err) {
          return reject(err);
        }
        return resolve(numRemoved);
      });
    });
  },
  providers: {
    email: {
      // loginKey: 'email'
      // tokenKey: 'token'
    },
    credentials: {
      // loginKey: 'email' // The key from req.body to look for the login .e.g email or username
      // passwordKey: 'password // The key in req.body to look for the submitted password
      passwordResetPath: "/auth/reset-password",
    },
  },
  //callback: {
  /**
   * Override an email template by returning a tuple of {emailSubject,emailText,emailHTML}
   * Check args.context for context of email, and other info
   * e.g. args.context = "sendtoken", args.action = "login"/"reset-password"
   */
  // email_template: (
  //   { emailSubject, emailText, emailHTML },
  //   args,
  //   options
  // ) => {},
  /**
   * Handle the callback for a custom token
   * e.g. if lib/sendToken is used in a custom fashion, use this callback to handle the action to take
   * when a verified response happens.
   * "action" will be the action specified when sending the token
   */
  // ["callback::token"]: ({ req, res, action, sendTo },options) => {},
  /**
   * Override the credentials registration redirect/json response.
   * Return false if doing your own res.{method} within the callback
   * Return {url: '...'} to return a redirect
   */
  // ["register::register_success"]: (
  //   url,
  //   { account, user, req, res, provider }
  // ) => {},
  //},
};

export default Auth(options);

/**
 * Required schema:
 * account:
 *  - some id : key (configurable)
 *  - login : String
 *  - hash : String (for password auth)
 *  - provider: String
 *  - user id : key
 *
 * token
 *  - hash : String
 *  - expires : js timestamp (millis)
 *
 * user:
 *  - id key
 *  - email (optional, for password auth, email auth)
 *
 *
 * A user can have multiple accounts (email/credentials, social)
 *
 *
 * Required ENV
 * SITE=localhost:3000 e.g.
 * EMAIL_SERVER=smtp login string
 */
