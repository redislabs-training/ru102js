const router = require('express').Router();
const { param, query } = require('express-validator');
const apiErrorReporter = require('../utils/apierrorreporter');
const controller = require('../controllers/metrics_controller.js');

// GET /metrics/999?n=50
router.get(
  '/metrics/:siteId',
  [
    param('siteId').isInt().toInt(),
    query('n').optional().isInt({ min: 1 }).toInt(),
    apiErrorReporter,
  ],
  async (req, res, next) => {
    try {
      const limit = (req.query.n == null || Number.isNaN(req.query.n)
                     || undefined === req.query.n) ? 120 : req.query.n;

      const siteMetricsReport = await controller.getMetricsForSite(req.params.siteId, limit);
      return res.status(200).json(siteMetricsReport);
    } catch (err) {
      if (err.name && err.name === 'TooManyMetricsError') {
        return res.status(400).send(err.message);
      }

      return next(err);
    }
  },
);

module.exports = router;
