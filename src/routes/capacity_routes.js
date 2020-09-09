const router = require('express').Router();
const { query } = require('express-validator');
const apiErrorReporter = require('../utils/apierrorreporter');
const controller = require('../controllers/capacity_controller');

/**
 * Returns the actual limit to be used, depending on whether or
 * not the optional value n is specified.
 *
 * @param {number} n - the desired limit
 * @returns {number} - the actual number used, n if a number was
 *  passed in, otherwise 10 as a default.
 * @private
 */
const getLimit = n => (Number.isNaN(n) || undefined === n ? 10 : n);

// GET /capacity?limit=99
router.get(
  '/capacity',
  [
    query('limit').optional().isInt({ min: 1 }).toInt(),
    apiErrorReporter,
  ],
  async (req, res, next) => {
    try {
      const capacityReport = await controller.getCapacityReport(getLimit(req.query.limit));

      return res.status(200).json(capacityReport);
    } catch (err) {
      return next(err);
    }
  },
);

module.exports = router;
