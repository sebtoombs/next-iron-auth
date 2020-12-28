import React from "react";
import useUser from "next-iron-auth/lib/useUser";
import Link from "next/link";

export const Index = () => {
  const { user, mutateUser } = useUser();
  return (
    <div>
      <div>Next Iron Auth Test</div>
      {user?.isLoggedIn ? (
        <p>Logged in</p>
      ) : (
        <Link href="/auth/login">
          <a>Login</a>
        </Link>
      )}
    </div>
  );
};

export default Index;
