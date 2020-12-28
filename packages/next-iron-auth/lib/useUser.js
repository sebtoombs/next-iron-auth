import { useEffect } from "react";
import Router from "next/router";
import useSWR from "swr";
import fetchJson from "./fetchJson";
export default function useUser({
  redirectTo = false,
  redirectIfFound = false,
  requiredRoles = [],
} = {}) {
  const { data: user, mutate: mutateUser } = useSWR(
    "/api/auth/user",
    fetchJson
  );

  // The user data is saved via GraphQL, but some of it (all) is stored in the session, so here we purge the session
  const mutateAndUpdateUser = (data) => {
    mutateUser(data, false);
    fetchJson("/api/auth/user", {
      method: "POST",
    });
  };

  const isAuthenticated = () => {
    if (!user?.isLoggedIn) return false;
    if (!requiredRoles.length) return user?.isLoggedIn;
    const intersection = [
      ...new Set(
        user.roles.filter((element) => requiredRoles.includes(element))
      ),
    ];
    return intersection.length > 0;
  };

  useEffect(() => {
    // if no redirect needed, just return (example: already on /dashboard)
    // if user data not yet there (fetch in progress, logged in or not) then don't do anything yet
    if (!redirectTo || !user) return;

    if (
      // If redirectTo is set, redirect if the user was not found.
      (redirectTo && !redirectIfFound && !isAuthenticated()) ||
      // If redirectIfFound is also set, redirect if the user was found
      (redirectIfFound && isAuthenticated())
    ) {
      Router.push(redirectTo);
    }
  }, [user, redirectIfFound, redirectTo]);

  return { user, mutateUser, mutateAndUpdateUser };
}
