const mongoose = require('mongoose');
const Property = require('../models/propertyModel');

const reviewSchema = new mongoose.Schema({
  
  review: {
    type: String, 
    required: [true, 'Review is required']
  },
  rating: {
    type: Number,
    required: true,
    min: 1, 
    max: 5
  }, 
  createdAt: {
    type: Date, 
    default: Date.now
  }, 
  property: {
    type: mongoose.Schema.ObjectId, 
    ref: 'Property', 
    required: [true, 'Review must belong to a tour']
  }, 
  user: {
    type: mongoose.Schema.ObjectId, 
    ref: 'User', 
    required: [true, 'Review must belong to a user']
  }
}, {
  toJSON: {virtuals: true}, 
  toObject: {virtuals: true}
});

reviewSchema.index({property: 1, user: 1}, { unique: true});

reviewSchema.pre(/^find/, function(next){

  // This refers to the query Object
  // this.populate({ path: 'property', select: 'address' })
  this.populate({ path: 'user', select: 'firstName lastName photo' });
  next();
});

//Statics method created on model because aggregate function only available on model
reviewSchema.statics.calcAverageRatings = async function(propertyId){
  //Aggregate takes in an array of stages
  const stats = await this.aggregate([
    {
      $match: {property: propertyId}
    }, 
    {
      $group: {
        _id: '$property', 
        nRatings: {$sum: 1}, 
        avgRating: {$avg: '$rating'}
      }
    }
  ]);

  if(stats.length > 0){
    await Property.findByIdAndUpdate(propertyId, {
      ratingsAverage: stats[0].avgRating.toFixed(1), 
      ratingsQuantity: stats[0].nRatings
    });
  }else {
    await Property.findByIdAndUpdate(propertyId, {
      ratingsAverage: 4.5, 
      ratingsQuantity: 0
    });
  }

}

//calculate reviews average and update property upon creation of a new review
//document middleware hence this refers to the current document being saved
reviewSchema.post('save', function(){
  //this referes to doc and function is called upon saving a document
  //this.property is the id of property to which this newly created review belongs to
  this.constructor.calcAverageRatings(this.property);
});

//calculate reviews stats upon updating/deleting a review

//First we will get info about the current review being updated or deleted and attach to the query object
reviewSchema.pre(/^findOneAnd/, async function(next){
  //Query middleware hence this refers to query object
  this.currReview = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function(){
  await this.currReview.constructor.calcAverageRatings(this.currReview.property);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;