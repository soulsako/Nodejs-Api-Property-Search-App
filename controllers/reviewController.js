const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const factory = require('./../controllers/handlerFactory');

exports.allReviews = catchAsync(async (req, res, next) => {

  let reviews;
  //If a request to made fetch all reviews for a particular property
  //Id is available on req.params.id
  if(req.params.tourId) reviews = await Review.find({property: id})
  reviews = await Review.find({});

  //Sending an array of all reviews
  res.status(200).json({
    status: 'success', 
    results: reviews.length, 
    reviews
  });

});

exports.review = factory.getADoc(Review);

exports.addPropertyAndUserId = (req, res, next) => {
  //Allow nested routes - When a review is written for a property -request is made to :propertyId/reviews
  if(!req.body.property) req.body.property = req.params.propertyId;
  //We have access to user info because of isAuthenticated middleware 
  if(!req.body.user) req.body.user = req.user.id;
  next();
}

exports.createReview = factory.createDoc(Review);
exports.deleteReview = factory.deleteDoc(Review);
exports.updateReview = factory.updateDoc(Review);


