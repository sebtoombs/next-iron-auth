import response from "../lib/response";

export default async (req, res, options) => {
  const path = req._auth_path.length > 1 ? req._auth_path[1] : null;
  let {
    error = "Unknown error",
    message = "An unknown error has occurred.",
  } = req.query;

  // I've been a bit all over the place with error responses, so let's just force
  // error and message to be a string for now

  if (typeof error === "object") {
    error = JSON.stringify(error);
  }
  if (typeof message === "object") {
    message = JSON.stringify(message);
  }

  return res.send(`<html>
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${options.siteName}</title>
  </head>
  <body>
  <style>
  body {
    background-color: #f9f9f9;
    font-family: Helvetica, Arial, sans-serif;
    color: #444444;
    margin: 0;
  }
  .card {
    max-width: 36rem;
    background-color: #ffffff;
    margin-left: auto;
    margin-right: auto;
    border-radius:0.25rem;
    padding: 0.75rem 1rem;
    margin-top: 2rem;
  }
  .card >*:first-child {
    margin-top:0;
  }
  .card > *:last-child {
    margin-bottom: 0;
  }
  </style>
  <div class="error-message card">
  <h1 style="text-align:center">${error}</h1>
  <p>${message}</p>
  </div>
  </body></html>`);
};
