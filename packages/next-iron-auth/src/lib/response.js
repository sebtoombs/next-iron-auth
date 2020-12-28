import logger from "./logger";

export default function response({
  req,
  res,
  payload,
  status = null,
  options,
}) {
  const isError = !!payload?.error;
  const responseAsJson = !!(req.body && req.body.json === true);

  if (!status) {
    if (!responseAsJson) status = 302;
    else if (responseAsJson && isError) status = 400;
    else status = 200;
  }

  //if payload is a string, assume its a redirect
  if (typeof payload === "string") {
    payload = { url: payload };
  }

  if (!responseAsJson && isError) {
    payload.url = `${options.baseUrl}${options.basePath}/error?${serialize(
      payload
    )}`;
  }

  console.log({ responseAsJson, isError, payload, status });

  if (responseAsJson) {
    logger.debug("RESPONSE_JSON", payload);
    return res.status(status).json(payload);
  } else {
    logger.debug("RESPONSE_REDIRECT", payload);
    return res.redirect(
      status,
      typeof payload.url === "string"
        ? payload.url
        : `${options.baseUrl}${options.basePath}/error`
    );
  }
}

function serialize(obj, prefix = "") {
  const str = [];
  Object.keys(obj).map((key) => {
    const k = prefix ? `${prefix}[${key}]` : key;
    let v = obj[key];
    if (v && (v.stack || v.message)) {
      // Is an Error
      v = v.message;
    }
    str.push(
      v !== null && typeof v === "object"
        ? serialize(v, k)
        : encodeURIComponent(k) + "=" + encodeURIComponent(v)
    );
  });
  return str.join("&");
}
