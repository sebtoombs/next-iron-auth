import React from "react";
import fetchJson from "next-iron-auth/lib/fetchJson";
import Link from "next/link";
import { useRouter } from "next/router";
import useUser from "next-iron-auth/lib/useUser";

const ResetPassword = () => {
  const router = useRouter();

  // here we just check if user is already logged in and redirect to profile
  useUser({
    redirectTo: "/profile",
    redirectIfFound: true,
  });

  async function doResetPasswordRequest(e) {
    e.preventDefault();
    const body = {
      action: "reset-password",
      json: true,
    };
    if (router.query.token) {
      body.password = e.currentTarget.password.value;
    } else {
      body.sendTo = e.currentTarget.email.value;
    }
    const url = router.query.token
      ? `/api/auth/callback?type=token&token=${router.query.token}&action=reset-password`
      : `/api/auth/token?provider=credentials`;

    try {
      const r = await fetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log(r);
    } catch (error) {
      console.error("An unexpected error happened:", error);
    }
  }

  return (
    <div>
      <div className="login">
        <p>Request password reset</p>
        <form onSubmit={doResetPasswordRequest}>
          {router.query.token ? (
            <label>
              <span>New Password</span>
              <input type="password" name="password" required />
            </label>
          ) : (
            <label>
              <span>Email</span>
              <input type="email" name="email" required />
            </label>
          )}
          <button type="submit">Reset password</button>
        </form>
      </div>

      <div>
        <Link href="/auth/login">
          <a>Login</a>
        </Link>
      </div>

      <style jsx>{`
        .login {
          max-width: 21rem;
          margin: 0 auto;
          padding: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
