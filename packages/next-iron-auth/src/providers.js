import sendToken from "./lib/sendToken";
import applyCallback from "./lib/applyCallback";
import hashPassword from "./lib/hashPassword";
import verifyHash from "./lib/verifyHash";

/**
 * Create a new user and account, possibly trigger account verification if required
 * Alternatively, link a new auth method if possible
 */
async function registerUser(
  { req, provider, providerId, verified = false },
  options
) {
  const body = req.body;

  const loginKey = options?.providers?.[providerId]?.loginKey || "email";
  const loginId = body[loginKey];

  let userCreated = false; // WAs a user created or linked?
  let hash; //password hash for credentials

  if (!loginId) {
    return ["LOGIN_MISSING", null];
  }

  // Create the login string
  const login = `${providerId}:${loginId}`;

  // Try to find existing account
  let account = await options.findAccount({
    [loginKey]: loginId,
    login,
    provider: providerId,
  });

  if (account && account.login === login) {
    return ["LOGIN_EXISTS", null];
  }

  const userData = {
    ...body,
    login,
    [loginKey]: loginId,
    provider: providerId,
    verified: false,
  };

  if (provider.type === "credentials") {
    // Get the password
    const passwordKey =
      options?.providers?.credentials?.passwordKey || "password";
    const password = body[passwordKey];

    if (!password) {
      return ["PASSWORD_MISSING", null];
    }
    hash = await hashPassword(password);
    delete userData[passwordKey];
  }

  let user =
    typeof options.linkUser === `function`
      ? await options.linkUser({
          ...body,
          login,
          [loginKey]: loginId,
          provider: "credentials",
        })
      : null;

  if (!user) {
    try {
      await applyCallback(
        "register::before_create_user",
        [{ req, provider, providerId, verified, userData }],
        options
      );
      user = await options.createUser(userData);
      userCreated = true;
      await applyCallback(
        "register::after_create_user",
        [{ req, provider, providerId, verified, user }],
        options
      );
    } catch (e) {
      return ["CREATE_USER_ERROR", e];
    }
  }

  if (!user[options.userIdKey]) {
    return ["INVALID_USER_OBJECT", null];
  }

  const accountData = {
    [loginKey]: body[loginKey],
    login,
    userId: user[options.userIdKey],
    provider: "credentials",
    hash: hash ? hash : null,
    verified,
  };

  try {
    account = await options.createAccount(accountData);
  } catch (e) {
    return ["CREATE_ACCOUNT_ERROR", e];
  }

  await applyCallback(
    "register::after_register",
    [{ req, provider, providerId, verified, user, account, userCreated }],
    options
  );

  return [null, { account, user, userCreated }];
}

export default {
  email: {
    type: "email",
    sendToken: async (req, options) => {
      const body = await req.body;

      // The the identifiable piece of information (email, username etc)
      const loginKey = options?.providers?.email?.loginKey || "email";
      const loginId = body[loginKey];

      if (!loginId) {
        return ["LOGIN_MISSING", null];
      }

      const accountRequired =
        options?.providers?.email?.accountRequired === true;

      if (accountRequired) {
        // Create the login string
        const login = `email:${loginId}`;

        // TRy to find an account
        const account = await options.findAccount({
          [loginKey]: loginId,
          login,
          provider: "email",
        });

        // Maybe link account
        if (!account) {
          const user =
            typeof options.linkUser === `function`
              ? await options.linkUser({
                  login,
                  [loginKey]: loginId,
                  provider: "email",
                })
              : null;

          if (!user) {
            return ["ACCOUNT_REQUIRED", null];
          }
        }
      }

      await sendToken({
        sendTo: loginId,
        action: "login",
        options,
        provider: "email",
      });

      return [null, true];
    },
    authenticate: async (req, loginId, options) => {
      // This is a bit misnamed, its not really "authenticate",
      // its more sign in/create account & user

      // Steps:
      // Find an existing account
      // If existing account, find user
      // If no account, create one, attempt to link to existing user
      // If no existing user, create one
      const loginKey = options?.providers?.email?.loginKey || "email";

      // Create the login string
      const login = `email:${loginId}`;

      // Find the account
      let account, user;

      account = await options.findAccount({
        [loginKey]: loginId,
        login,
        provider: "email",
      });

      if (account) {
        user = await options.findUser({
          [options.userIdKey]: account.userId,
        });
      } else {
        user =
          typeof options.linkUser === `function`
            ? await options.linkUser({
                login,
                [loginKey]: loginId,
                provider: "email",
              })
            : null;
      }

      // We might want to let existing users link an account via email
      // but not allow new users via email
      const canCreateUser = options?.providers?.email?.accountRequired !== true;

      if (!user && !canCreateUser) {
        return ["ACCOUNT_REQUIRED", null];
      }

      if (!user) {
        const userData = {
          login,
          [loginKey]: loginId,
          provider: "email",
          verified: true,
        };
        user = await options.createUser(userData);
      }

      if (!account) {
        const accountData = {
          [loginKey]: loginId,
          login,
          userId: user[options.userIdKey],
          provider: "email",
          verified: true,
        };
        account = await options.createAccount(accountData);
      }

      if (!account) {
        return ["ACCOUNT_REQUIRED", null];
      }
      if (!user) {
        //TODO log this somewhere, it should never happen!
        return ["CORRUPTED_ACCOUNT", null];
      }

      return [null, { account, user }];
    },
    register: async (req, options) => {
      return registerUser(
        {
          req,
          provider: { type: "email" },
          providerId: "email",
          verified: false,
        },
        options
      );
    },
  },
  credentials: {
    type: "credentials",
    resetPassword: async (req, email, options) => {
      const body = await req.body;
      const accountIdKey = options.accountIdKey || "_id";
      const loginKey = options?.providers?.credentials?.loginKey || "email";
      const loginId = email;

      const login = `credentials:${loginId}`;

      const password =
        body[options?.providers?.credentials?.passwordKey || "password"];

      if (!password) {
        return ["PASSWORD_MISSING", null];
      }

      const account = await options.findAccount({
        [loginKey]: loginId,
        login,
        provider: "credentials",
      });

      if (!account || account.login !== login) {
        return ["LOGIN_NOT_FOUND", null];
      }

      const hash = await hashPassword(password);

      await options.updateAccount(account[accountIdKey], { hash });

      return [null, true];
    },
    register: async (req, options) => {
      return registerUser(
        {
          req,
          provider: { type: "credentials" },
          providerId: "credentials",
          verified: false,
        },
        options
      );
    },
    authenticate: async (req, options) => {
      const body = req.body;

      // The the identifiable piece of information (email, username etc)
      const loginKey = options?.providers?.credentials?.loginKey || "email";
      const loginId = body[loginKey];

      if (!loginId) {
        return ["LOGIN_MISSING", null];
      }

      // Create the login string
      const login = `credentials:${loginId}`;

      // Get the password
      const password =
        body[options?.providers?.credentials?.passwordKey || "password"];

      if (!password) {
        return ["PASSWORD_MISSING", null];
      }

      // Find the account
      const account = await options.findAccount({
        [loginKey]: body[loginKey],
        login,
        provider: "credentials",
      });

      if (!account || account.login !== login) {
        return ["LOGIN_NOT_FOUND", null];
      }

      // Verify the password
      if (!account.hash || !(await verifyHash(account.hash, password))) {
        return ["PASSWORD_MISMATCH", null]; // TODO Maybe send LOGN_NOT_FOUND unless process.env.NODE_ENV is dev/debug?
      }

      // Get the user
      const user = await options.findUser({
        [options.userIdKey]: account.userId,
      });

      if (!user) {
        //TODO log this somewhere, it should never happen!
        return ["CORRUPTED_ACCOUNT", null];
      }

      // At this point we should be ok
      return [null, { account, user }];
    },
  },
};
