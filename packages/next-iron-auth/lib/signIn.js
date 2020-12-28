// Actually sign the user in (add data to the session)
export default async function signIn({ account, user, options, req }) {
  // Accounts must have a unique identifier of some sort
  const accountIdKey = options.accountIdKey || "_id";

  const userIdKey = options.userIdKey || "_id";

  const sessionData = {
    ...(typeof options.sessionData === `function`
      ? await options.sessionData({ account, user }, req)
      : {}),
    ...user,
    isLoggedIn: true,
    user: user[userIdKey],
    account: account[accountIdKey],
    login: account.login,
  };
  req.session.set("user", sessionData);
  await req.session.save();
}
