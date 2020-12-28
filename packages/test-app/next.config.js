// const withTM = require("next-transpile-modules")(["next-iron-auth"]);
// module.exports = withTM();

const path = require("path");

module.exports = {
  webpack: (config) => {
    config.resolve.alias["next-iron-auth"] = path.join(
      process.cwd(),
      "packages",
      "next-iron-auth",
      "dist"
    );

    return config;
  },
};
