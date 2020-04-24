const router = require('express').Router();
const { param, query } = require('express-validator');
const apiErrorReporter = require('../utils/apierrorreporter');
const controller = require('../controllers/sites_controller.js');

/**
 * Custom validate.js validator.  Validates a set of parameters to
 * make sure enough data was passed in to complete a geo search.
 *
 * @param {*} value - unused but required by validate.js.
 * @param {Object} param1 - object containins request parameters to check.
 * @returns {boolean} - true if the provided geo params are complete.
 * @private
 */
const geoParamsValidator = (value, { req }) => {
  const {
    lat, lng, radius, radiusUnit,
  } = req.query;

  if (lat && lng && radius && radiusUnit) {
    return true;
  }

  throw new Error('When using geo lookup, params lat, lng, radius, radiusUnit are required.');
};

// GET /sites
router.get(
  '/sites',
  [
    /* eslint-disable newline-per-chained-call */
    query('lat').optional().custom(geoParamsValidator).isFloat().toFloat(),
    query('lng').optional().custom(geoParamsValidator).isFloat().toFloat(),
    query('radius').optional().custom(geoParamsValidator).isFloat({ min: 0.1 }).toFloat(),
    query('radiusUnit').optional().custom(geoParamsValidator).isIn(['MI', 'KM']),
    query('onlyExcessCapacity').optional().isBoolean().toBoolean(),
    /* eslint-enable */
    apiErrorReporter,
  ],
  async (req, res, next) => {
    try {
      const {
        lat, lng, radius, radiusUnit, onlyExcessCapacity,
      } = req.query;

      const sites = (
        lat
          ? await controller.getSitesNearby(
            lat,
            lng,
            radius,
            radiusUnit,
            onlyExcessCapacity,
          )
          : await controller.getSites()
      );

      return res.status(200).json(sites);
    } catch (err) {
      return next(err);
    }
  },
);

// GET /sites/999
router.get(
  '/sites/:siteId',
  [
    param('siteId').isInt().toInt(),
    apiErrorReporter,
  ],
  async (req, res, next) => {
    try {
      const site = await controller.getSite(req.params.siteId);
      return (site ? res.status(200).json(site) : res.sendStatus(404));
    } catch (err) {
      return next(err);
    }
  },
);

module.exports = router;
