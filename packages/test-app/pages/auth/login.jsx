import React, { useState } from "react";
import fetchJson from "next-iron-auth/lib/fetchJson";
import Link from "next/link";
import { useRouter } from "next/router";
import useUser from "next-iron-auth/lib/useUser";

const Login = () => {
  const router = useRouter();
  // here we just check if user is already logged in and redirect to profile
  const { mutateUser } = useUser({
    redirectTo: "/profile",
    redirectIfFound: true,
  });

  const [errorMsg, setErrorMsg] = useState("");

  async function doCredentialsLogin(e) {
    const body = {
      email: e.currentTarget.email.value,
      password: e.currentTarget.password.value,
      json: true,
    };

    try {
      const r = await mutateUser(
        fetchJson("/api/auth/login?provider=credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );
      console.log(r);
      router.push("/profile");
    } catch (error) {
      console.error("An unexpected error happened:", error);
    }
  }

  async function doEmailLogin(e) {
    const body = {
      email: e.currentTarget.email.value,
      json: true,
    };

    try {
      const r = await fetchJson("/api/auth/login?provider=email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log(r);
    } catch (error) {
      console.error("An unexpected error happened:", error);
      setErrorMsg(error.data.message);
    }
  }

  function handleSubmit(provider) {
    return (e) => {
      e.preventDefault();
      if (provider === "email") return doEmailLogin(e);
      if (provider === "credentials") return doCredentialsLogin(e);
    };
  }

  return (
    <div>
      <div className="login">
        <p>Login with email and password</p>
        <form onSubmit={handleSubmit("credentials")}>
          <label>
            <span>Email</span>
            <input type="email" name="email" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" required />
          </label>
          <button type="submit">Login</button>
        </form>
      </div>

      <div className="login">
        <p>Login with email</p>
        <form onSubmit={handleSubmit("email")}>
          <label>
            <span>Email</span>
            <input type="email" name="email" required />
          </label>
          <button type="submit">Login</button>
        </form>
      </div>
      <div>
        <Link href="/auth/reset-password">
          <a>Reset password</a>
        </Link>
      </div>
      <div>
        <Link href="/auth/register">
          <a>Register</a>
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

export default Login;
