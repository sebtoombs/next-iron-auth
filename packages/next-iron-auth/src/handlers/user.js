import generateGuestId from "../lib/generateGuestId";

export default async (req, res, options) => {
  const user = req.session.get("user");
  if (user) {
    // in a real world application you might read the user id from the session and then do a database request
    // to get more information on the user if needed
    res.json({
      isLoggedIn: true,
      ...user,
    });
  } else {
    const guest = req.session.get("guest");
    if (!guest) {
      req.session.set("guest", generateGuestId());
      await req.session.save();
    }
    res.json({
      isLoggedIn: false,
      guest,
    });
  }
};
