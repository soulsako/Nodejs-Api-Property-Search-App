const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const router = express.Router({ mergeParams: true });

//POST requets to /propeties/:propetyId/reviews
//POST requets to /reviews => will hit the bottom endpoint
//Get request to /propeties/:propertyId/reviews
//merge params will allow access to the params

router.use(authController.isAuthenticated);

router
.route('/')
.get(authController.restrictTo('admin'), reviewController.allReviews)
.post(authController.restrictTo('user', 'admin'), reviewController.createReview);

router.use(authController.restrictTo('admin'));

router
.route('/:id')
.get(reviewController.review)
.patch(reviewController.updateReview)
.delete(reviewController.deleteReview)

module.exports = router