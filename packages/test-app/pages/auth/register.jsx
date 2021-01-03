import React, { useState } from "react";
import fetchJson from "next-iron-auth/lib/fetchJson";
import Link from "next/link";
import { useRouter } from "next/router";
import useUser from "next-iron-auth/lib/useUser";

const Register = () => {
  const router = useRouter();
  // here we just check if user is already logged in and redirect to profile
  const { mutateUser } = useUser({
    redirectTo: "/profile",
    redirectIfFound: true,
  });

  function doRegister(providerId) {
    return async (e) => {
      e.preventDefault();

      const body = {
        email: e.currentTarget.email.value,
        json: true,
      };

      if (providerId === "credentials") {
        body.password = e.currentTarget.password.value;
      }

      try {
        const r = await mutateUser(
          fetchJson(`/api/auth/register?provider=${providerId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        );
        console.log(r);
        // router.push("/profile");
      } catch (error) {
        console.error("An unexpected error happened:", error);
      }
    };
  }

  return (
    <div>
      <div className="login">
        <p>Register email and password</p>
        <form onSubmit={doRegister("credentials")}>
          <label>
            <span>Email</span>
            <input type="email" name="email" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" name="password" required />
          </label>
          <button type="submit">Register</button>
        </form>
      </div>

      <div className="login">
        <p>Register with email</p>
        <form onSubmit={doRegister("email")}>
          <label>
            <span>Email</span>
            <input type="email" name="email" required />
          </label>
          <button type="submit">Register</button>
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

export default Register;
