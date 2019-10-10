const mongoose = require('mongoose');
// const Company = require('./companyModel');
const propertySchema = new mongoose.Schema({

  price: { type: Number, required: [true, 'Property rent is required']},
  bedrooms: { type: Number, required: [true, 'Number of bedrooms required']},
  propertyType: { type: String, required: [true, 'Property type in required'],enum: ['Flat', 'House', 'Bungalow', 'Commercial', 'Studio', 'Annex']},
  address: { type: String,  required: [true, 'Property address is required'], unique: true },
  bathrooms: { type: Number,required: [true, 'Property bathroom is required']},
  furnished: { type: Boolean,required: [true, 'Please sepecify property is furnished or unfurnished']},
  contractLength: { type: Number, default: 365 },
  rentDiscount: { type: Number, validate: {
      //PLEASE NOTE: validation function will not run when the doc is UPDATED 
      validator: function(val){
        return val < this.rent;
      }, 
      message: 'Rent discount must be less than rent'
    }
  },
  location: { type: { type: String, default: 'Point', enum: ['Point'], required: [true, "Property location is required"]}, coordinates: [Number], address: String, description: String}, 
  type: { type: String }, 
  dateAvailable: { type: String, default: 'TBC'},
  company: { type: mongoose.Schema.ObjectId, ref: 'Company'},
  deposit: { type: Number },
  keyFeatures: { type: Array },
  description: { type: String },
  fullDescription: { type: String },
  companyLogo: { type: String }, //This should linked to company model
  energyCertificate: { type: Boolean, default: true }, 
  ratingsAverage: {
    type: Number, 
    default: 4.5,
    min: [0, 'Rating must be above 1'], 
    max: [5, 'Rating must be below 5'], 
    set: value => Math.round(value * 10) / 10
  }, 
  ratingsQuantity: {
    type: Number, 
    default: 0
  }, 
  imageCover: {
    type: String, 
    required: [true, 'A property must have a cover image']
  }, 
  images: [String],
  town: String
}, 
{
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  },
  toJSON: {virtuals: true}, 
  toObject: {virtuals: true}
});

propertySchema.index({price: 1, bedrooms: 1});
propertySchema.index({location: '2dsphere'});
propertySchema.index({type: 1});

// //Virtual properties -- Not saved in the database -- created on the fly when getting docs from collection
// propertySchema.virtual('lettingDurationWeeks').get(function(){
//   return Math.floor(this.lettingDuration / 7);
// });
//Virtual property created on property model called reviews 
propertySchema.virtual('reviews', {
  ref: 'Review', // We link the Property model with Review model -- NOTE: This is the name given to the review model
  foreignField: 'property', // Field in the Review model that contains the ids (If ANY!)
  localField: '_id' // Property model field to check against
});

//DOCUMENT MIDDLEWARE - runs before a save() and create() but not insertMany() 
// propertySchema.pre('save', function(next){
//   //this -- refers to the current document 
//   //We can addd property like this
//   // this.someProp = value
//   next();
// });

// Use this approach to embed documents - PLEASE NOTE: This will only hold updated embeded documents on new properties. All the current properties 
// will manually have to be updated.
// propertySchema.pre('save', async function(next){
//   const company = await Company.findById(this.company);
//   this.company = company;
//   next();
// });
 
// //Document middleware - runs after a document is saved in the collection
// propertySchema.post('save', function(doc, next) {
//   // console.log(doc);
//   next();
// });

//QUERY middleware
// propertySchema.pre('find', function(next){
//   //this referes to the query object, hence we can chain methods to it
//   this.find({secretProperty: {$ne: true}});
//   next();
// });

//Before we make a find query, we can populate the company field with corresponding companies this property belongs to
propertySchema.pre(/^find/, function(next){
  this.populate({path: 'company', select: '-__v'});
  next();
});

//Query middleware - runs after the query has finsihed - we have access to all the docs
// propertySchema.post('find', function(docs, next){
//   console.log(docs);
//   next();
// });

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;

// First lets understand how populate funnction can be used to populate a field with data

// 1) You must reference the field in the property model to be populated with Company model.
// 2) This is usually done by adding a mongoose.Schema.ObjectId and ref: "Company" in the field
// 3) Now when we make a query to get all or certain property we we will chain .populate({path: 'company',{select: ''}}
// 4) this will populate the comapny field in properties docs with subsequest companies with ids.

// Document vs Query middleware

// Document pre middleware runs before save
// Document post middelware runs after save

// Query pre middleware runs before find
// Query post middleware runs after find

// Now lets look at pre query middleware

// 1) Pre query middleware runs before a query is made
// 2) The this variable in middleware refers to the current Model hence we can chain any methods to the query object         like populate() or aggregate
// 3) We can also attach properties to the query object which can be then be accessed in post middleware
// 4) Dont forget to execite next() function 

// Now lets look at post query middleware

// 1) Post query middleware runs after a query is made.
// 3) This can be useful to perform tasks after docs have been updated or deleted i.e. to get statistics.
// 2) It does not recieve the next function 

// Now lets understand Model methods 

// 1) we can attach methods to Model object 
// 2) These are NOT middlewares but simple functions in which this variable referes to the document
// 3) We can execute these functions 


// Now lets look at virtual propeties 

// A virtual poropety can be created using
// propertySchema.virtual('name of property',{
// ref: 'Reference to other model', 
// foreignField: 'field in the other model that containes ids'
// localField: 'name of field in current model'
//})

// Inside the propety model, we want to calculate number of ratings and ratings average
// We will first create these properties in the scehma model

// ratingsAverage, ratingsQuantity

//When a new review is added for a particular property 
//reviewSchema.statics.calcAverageRating = function(propertyId){
  // this refers to the model
  // const stats = this.aggregate([
    //{
      //$match: { property: propetyId} // all reviews for property with property id
    //}, 
    // {
      //$group: {'$property'}
    // },
    // { 
    //   nRatings: { $sum: 1}
    // }
  //])
//}


// propetySchema

