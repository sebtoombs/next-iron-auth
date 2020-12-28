export default async (req, res, options) => {
  req.session.destroy();
  res.json({ isLoggedIn: false });
};
