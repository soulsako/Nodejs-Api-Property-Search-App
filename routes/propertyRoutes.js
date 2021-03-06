const express = require('express');
const propertyController = require('../controllers/propertyController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');
 
const router = express.Router();

router
  //Alias route i.e a route that is often used and therefore the queries can be hardcoded
  //This route is for properties without location
  .route('/top-properties')
  .get(propertyController.bestProperties, propertyController.allProperties);

router
  .route('/propertiesbytown/:type/:lat/:lng/:townone?/:towntwo?/:townthree?/:townfour?/:townfive?/unit/:unit')
  .get(propertyController.propertiesByTown);

//Middleware only runs if param id exists // val contains the param value
// router.param('id', checkID);

//Nested routes to create a review or get a review
router.use('/:propertyId/reviews', reviewRouter);

//GEO SPATIAL Routes

// Get all properties within latitude and lagitude (center) given a distance in radius
router
  .route('/type/:type/within/:distance/center/:latlng/unit/:unit')
  .get(propertyController.propertiesWithin);

// Get distances of properties from lat lng (center) 

router
  .route('/distances/:latlng/unit/:unit')
  .get(propertyController.getDistances);

router
  .route('/')
  .get(propertyController.allProperties)
  .post(propertyController.newProperty);
  //authController.isAuthenticated, 
  //authController.restrictTo('admin'),

  //Update document fields
router
.route('/updateall')
.post(authController.isAuthenticated, 
      authController.restrictTo('admin'),
      propertyController.updateAllProperties);
 
router
  .route('/:id')
  .get(propertyController.property)
  .patch(
    // authController.isAuthenticated, 
    // authController.restrictTo('admin'),
    // propertyController.uploadPropertyImages, 
    // propertyController.resizePropertyImages,
    propertyController.updateProperty)
  .delete(authController.isAuthenticated, 
          authController.restrictTo('admin'), 
          propertyController.deleteProperty);

module.exports = router;

