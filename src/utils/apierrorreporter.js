const { validationResult } = require('express-validator');

/**
 * Handles reporting of all validate.js validation errors.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Object} next - Express object for next middleware in the chain.
 * @returns {Object} - result of calling the next function in the
 *  Express middleware chain.
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  return next();
};
