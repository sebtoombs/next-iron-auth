export default function applyCallback(name, args, options) {
  return new Promise((resolve) => {
    if (
      typeof options.callback !== "undefined" &&
      typeof options.callback[name] === `function`
    ) {
      return resolve(options.callback[name].apply(null, [...args, options]));
    }
    return resolve(args.length ? args[0] : null);
  });
}
