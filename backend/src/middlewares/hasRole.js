/**
 * Role guard. Use after `adminAuth.isValidAuthToken`, which puts the signed-in
 * user on `req.admin`.
 *
 *   router.route('/team/list').get(hasRole('owner', 'admin'), catchErrors(...))
 *
 * `owner` always passes — the account holder must never be able to lock itself
 * out of its own instance by editing role lists.
 */
const hasRole =
  (...allowed) =>
  (req, res, next) => {
    const user = req.admin;

    if (!user) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Not authenticated.',
      });
    }

    if (user.role === 'owner' || allowed.includes(user.role)) return next();

    return res.status(403).json({
      success: false,
      result: null,
      message: `Your role (${user.role}) is not allowed to perform this action.`,
    });
  };

module.exports = hasRole;
