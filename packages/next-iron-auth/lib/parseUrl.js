// from next-auth
export default (url) => {
  // Default values
  const defaultHost = "http://localhost:3000";
  const defaultPath = "/api/auth";

  if (!url) {
    url = `${defaultHost}${defaultPath}`;
  }

  // Default to HTTPS if no protocol explictly specified
  const protocol = url.match(/^http?:\/\//) ? "http" : "https";

  // Normalize URLs by stripping protocol and no trailing slash
  url = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Simple split based on first /
  const [_host, ..._path] = url.split("/");
  const baseUrl = _host ? `${protocol}://${_host}` : defaultHost;
  const basePath = _path.length > 0 ? `/${_path.join("/")}` : defaultPath;

  return {
    baseUrl,
    basePath,
  };
};
