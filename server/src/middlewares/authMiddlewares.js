export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
}

export function requireRole(allowedRoleIds = []) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoleIds.includes(user.roleId)) {
      return res.status(403).json({ message: "Forbidden. Insufficient permissions." });
    }

    next();
  };
}