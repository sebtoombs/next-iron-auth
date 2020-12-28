import argon2 from "argon2";
import sendToken from "./lib/sendToken";

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

      // Create the login string
      // const login = `email:${loginId}`;

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
      }

      if (!user) {
        user =
          typeof options.linkUser === `function`
            ? await options.linkUser({
                login,
                [loginKey]: loginId,
                provider: "email",
              })
            : null;
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
        };
        account = await options.createAccount(accountData);
      }

      return [null, { account, user }];
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

      const hash = await argon2.hash(password);

      await options.updateAccount(account[accountIdKey], { hash });

      return [null, true];
    },
    register: async (req, options) => {
      const body = req.body;

      const loginKey = options?.providers?.credentials?.loginKey || "email";
      const loginId = body[loginKey];

      if (!loginId) {
        return ["LOGIN_MISSING", null];
      }

      // Create the login string
      const login = `credentials:${loginId}`;

      // Get the password
      const passwordKey =
        options?.providers?.credentials?.passwordKey || "password";
      const password = body[passwordKey];

      if (!password) {
        return ["PASSWORD_MISSING", null];
      }

      let account = await options.findAccount({
        [loginKey]: loginId,
        login,
        provider: "credentials",
      });

      if (account && account.login === login) {
        return ["LOGIN_EXISTS", null];
      }

      const hash = await argon2.hash(password);

      const userData = {
        ...body,
        login,
        [loginKey]: loginId,
        provider: "credentials",
        verified: false,
      };
      delete userData[passwordKey];

      let user =
        typeof options.linkUser === `function`
          ? await options.linkUser({
              ...body,
              login,
              [loginKey]: loginId,
              provider: "credentials",
            })
          : null;
      if (!user) user = await options.createUser(userData);

      if (!user[options.userIdKey]) {
        return ["INVALID_USER_OBJECT", null];
      }

      const accountData = {
        [loginKey]: body[loginKey],
        login,
        userId: user[options.userIdKey],
        provider: "credentials",
        hash,
      };
      account = await options.createAccount(accountData);

      return [null, { account, user }];
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
      if (!account.hash || !(await argon2.verify(account.hash, password))) {
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