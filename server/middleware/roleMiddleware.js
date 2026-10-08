/**
 * Role-Based Access Control Middleware
 * Supports Base Member, Premium Member, Fitness Trainer, and Administrator
 */

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (allowedRoles.includes(req.user.role) || req.user.role === 'ADMIN') {
      return next();
    }

    return res.status(403).json({
      error: `Access restricted. This feature requires role(s): ${allowedRoles.join(', ')}. Current role: ${req.user.role}`
    });
  };
}

function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Premium Members, Trainers, and Admins have access to premium features
  if (req.user.role === 'PREMIUM_MEMBER' || req.user.role === 'TRAINER' || req.user.role === 'ADMIN') {
    return next();
  }

  return res.status(403).json({
    error: 'Premium subscription required. Upgrade to Premium to unlock smart equipment tracking, personal trainer allocation, and supplement discounts.',
    requiresUpgrade: true
  });
}

module.exports = {
  requireRole,
  requirePremium
};
