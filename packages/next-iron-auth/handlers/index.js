import login from "./login";
import logout from "./logout";
import token from "./token";
import user from "./user";
import callback from "./callback";
import withSession from "../lib/withSession";
import register from "./register";
import parseUrl from "../lib/parseUrl";

function parseAndValidateOptions(options) {
  const _defaults = {
    accountIdKey: "_id",
    userIdKey: "_id",
    tokenExpiry: 1000 * 60 * 10, //10 minutes
    emailSiteName: `${options.baseUrl.replace(/^https?:\/\//, "")}`,
    emailFrom: `"Next-Iron-Auth" <auth@${options.baseUrl}>`,
    destroyUsedToken: true,
  };

  options = shallowMaybeMerge(options, _defaults);

  // Validate

  const requiredMethods = [
    "createUser",
    "createAccount",
    "findUser",
    "findAccount",
    "storeToken",
    "findToken",
    "destroyToken",
  ];

  requiredMethods.forEach((requiredMethod) => {
    if (typeof options[requiredMethod] !== `function`) {
      throw new Error(`${requiredMethod} method not set in options.`);
    }
  });

  return options;
}

function shallowMaybeMerge(options, defaults) {
  Object.keys(defaults).map((key) => {
    if (typeof options[key] === `undefined`) {
      options[key] = defaults[key];
    }
  });
  return options;
}

export default function Auth(options) {
  const parsedUrl = parseUrl(process.env.AUTH_URL || process.env.VERCEL_URL);
  const baseUrl = parsedUrl.baseUrl;
  const basePath = parsedUrl.basePath;

  options = { ...options, basePath, baseUrl };

  options = parseAndValidateOptions(options);

  return withSession((req, res) => {
    // req.query.auth => auth is the filename of [...auth]
    const {
      query: { auth },
    } = req;

    const path = !!auth.length ? auth : [];

    // options.path = path;
    req._auth_path = path;

    const path0 = path.length ? path[0] : null;

    if (path0 === "login") {
      return login(req, res, options);
    }
    if (path0 === "logout") {
      return logout(req, res, options);
    }
    if (path0 === "token") {
      return token(req, res, options);
    }
    if (path0 === "user") {
      return user(req, res, options);
    }
    if (path0 === "register") {
      return register(req, res, options);
    }
    if (path0 === "callback") {
      return callback(req, res, options);
    }
    return res.status(404).end();
  });
}
