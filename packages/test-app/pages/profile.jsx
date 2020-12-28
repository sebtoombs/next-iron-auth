import React from "react";
import useUser from "next-iron-auth/lib/useUser";
import { useRouter } from "next/router";
import fetchJson from "next-iron-auth/lib/fetchJson";

export const Profile = () => {
  const { user, mutateUser } = useUser({ redirectTo: "/auth/login" });
  const router = useRouter();

  async function doLogout(e) {
    e.preventDefault();
    try {
      await mutateUser(fetchJson("/api/auth/logout"));
      router.push("/auth/login");
    } catch (error) {
      console.error("An unexpected error happened:", error);
    }
  }

  if (!user?.isLoggedIn) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <div>
        <pre>{JSON.stringify(user, null, "\t")}</pre>
      </div>
      <div>
        <button onClick={doLogout}>Log out</button>
      </div>
    </div>
  );
};

export default Profile;
