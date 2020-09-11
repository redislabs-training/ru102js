const router = require('express').Router();
const { body, param, query } = require('express-validator');
const apiErrorReporter = require('../utils/apierrorreporter');
const controller = require('../controllers/meterreadings_controller');

/**
 * Get the numeric limit value, 100 if not specified, otherwise
 * use the number specified up to 1000 maximum.
 *
 * @param {number} n - the number of readings to get.
 * @returns {number} - the number of readings that the request will be capped at.
 * @private
 */
const getLimit = (n) => {
  if (Number.isNaN(n) || undefined === n) {
    return 100;
  }

  return (n > 1000 ? 1000 : n);
};

// POST /meterreadings
// Body is array of objects as described below.
router.post(
  '/meterreadings',
  [
    body().isArray(),
    body('*.siteId').isInt(),
    body('*.dateTime').isInt({ min: 0 }),
    body('*.whUsed').isFloat({ min: 0 }),
    body('*.whGenerated').isFloat({ min: 0 }),
    body('*.tempC').isFloat(),
    apiErrorReporter,
  ],
  async (req, res, next) => {
    try {
      await controller.createMeterReadings(req.body);
      return res.status(201).send('OK');
    } catch (err) {
      return next(err);
    }
  },
);

// GET /meterreadings?n=99
router.get(
  '/meterreadings',
  [
    query('n').optional().isInt({ min: 1 }).toInt(),
    apiErrorReporter,
  ],
  async (req, res, next) => {
    try {
      const readings = await controller.getMeterReadings(getLimit(req.query.n));
      return res.status(200).json(readings);
    } catch (err) {
      return next(err);
    }
  },
);

// GET /meterreadings/123?n=99
router.get(
  '/meterreadings/:siteId',
  [
    param('siteId').isInt().toInt(),
    query('n').optional().isInt({ min: 1 }).toInt(),
    apiErrorReporter,
  ],
  async (req, res, next) => {
    try {
      const readings = await controller.getMeterReadingsForSite(
        req.params.siteId,
        getLimit(req.query.n),
      );

      return res.status(200).json(readings);
    } catch (err) {
      return next(err);
    }
  },
);

module.exports = router;
