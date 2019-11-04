const Property = require('../models/propertyModel');
const factory = require('./../controllers/handlerFactory');
const catchAsync = require('./../utils/catchAsync');
const multer = require('multer');
const sharp = require('sharp');
// const APIFeatures = require('../utils/apiFeatures');

//Us this method on multer if image resizing is required
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  console.log('====================================');
  console.log(file);
  console.log('====================================');
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  }else {
    cb(new AppError('Not an image. Please upload an image file.', 400), false);
  }
}

//Initialise multer and pass in path for saving images and filter function to make sure only images are uploaded 
const upload = multer({
  storage: multerStorage, 
  fileFilter: multerFilter
});

//upload.single('image') found on req.file
//upload.array('images', 5) found on req.files
//upload.fields([{}]) found on req.fields

exports.uploadPropertyImages = upload.fields([
  {
    name: 'imageCover', 
    maxCount: 1
  }, 
  {
    name: 'images', 
    maxCount: 3
  }
]);

exports.resizePropertyImages = catchAsync( async(req, res, next) => {

  if(!req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
  .resize(2000, 1333)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/properties/${req.body.imageCover}`);

  //Other images
  req.body.images = [];
  await Promise.all(req.files.images.map( async (file, i) => {

    const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    await sharp(file.buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 80})
    .toFile(`public/img/properties/${fileName}`);

    req.body.images.push(fileName);
  }));

  next();
});

exports.bestProperties = (req, res, next) => {

  const popularQuery = {
    bedrooms: {gte: 2},
    price: {lte: 1000}
  }
  req.query = {...req.query, ...popularQuery, }
  next();
}

exports.allProperties = factory.getAllDocs(Property);
exports.property = factory.getADoc(Property, {path: 'reviews'});
exports.newProperty = factory.createDoc(Property);
exports.updateProperty = factory.updateDoc(Property);
exports.updateAllProperties= factory.updateAll(Property);
exports.deleteProperty = factory.deleteDoc(Property);

exports.propertiesWithin = catchAsync(async(req, res, next) => {
  // PLEASE NOTE: Check to make sure property coordinates are saved as (lng,lat) and not (lat,lng) in the database.
  // 1) Get info of params
  const { distance, latlng, unit, type } = req.params;
  const [lat, lng] = latlng.split(',');
  // const radius = unit === 'mil' ? Number(distance / 3963.2) : Number(distance / 6378.1);
  const maxDistance = unit === 'mil' ? Number(distance * 1609.34) : Number(distance * 1000);
  const multiplier = unit === 'mil' ? 0.000621371 : 0.001;
  const { bedrooms, price, sort } = req.query;

  if(!lat || !lng){
    return next(new AppError('Latitude and longitude is required.', 400));
  }

  const properties = await Property.aggregate([
    {
      //PLEASE NOTE: GeoNear must always be the first stage in the pipeline
      $geoNear: {
        near: {
          type: 'Point', 
          coordinates: [lng * 1, lat * 1]
        },
        maxDistance,
        distanceField: 'distance', 
        distanceMultiplier: multiplier
      }
    }, 
    {
      $match: {
        type, 
        bedrooms: { $gte: bedrooms.gte * 1, $lte: bedrooms.lte * 1}, 
        price: {$gte: price.gte * 1 , $lte: price.lte * 1}
      }
    }, 
    {
      $sort: {
        price: sort * 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success', 
    results: properties.length,
    documents: properties
  });

  // const queryObject = Property.find({type});
  // queryObject.find({
  //   location: { $geoWithin: { $centerSphere: [[lng * 1, lat * 1], radius]} }
  // })
});

exports.getDistances = catchAsync(async(req, res, next) => {

  // 1) Get info of params
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mil' ? 0.000621371 : 0.001;

  if(!lat || !lng){
    return next(new AppError('Latitude and langitude is required.', 400));
  }

  const distances = await Property.aggregate([
    {
      //PLEASE NOTE: GeoNear must always be the first stage in the pipeline
      $geoNear: {
        near: {
          type: 'Point', 
          coordinates: [lng * 1, lat * 1]
        }, 
        distanceField: 'distance', 
        distanceMultiplier: multiplier
      }
    }, {
      $project: {
        _id: 1,
        address: 1, 
        distance: 1
      }
    }
  ]);

  //Round distances values
  const roundDistances = distances.map(curr => {
    return {
      _id: curr._id,
      address: curr.address, 
      distance: curr.distance.toFixed(2)
    }
  });

  res.status(200).json({
    status: 'success', 
    results: distances.length,
    distances: roundDistances
  });


});

exports.propertiesByTown = catchAsync(async(req, res, next) => {
 
  let { type, lat, lng, townone, towntwo, townthree, townfour, townfive, unit } = req.params;
  townone = townone ? townone : "";
  towntwo = towntwo ? towntwo : "";
  townthree = townthree ? townthree : "";
  townfour = townfour ? townfour : "";
  townfive = townfive ? townfive : "";
  console.log('====================================');
  console.log(lat, lng);
  console.log('====================================');
  const multiplier = unit === 'mil' ? 0.000621371 : 0.001;
  const { bedrooms, price, sort } = req.query;
  // const properties = await Property.find({ town: { $in: [townone, towntwo, townthree, townfour, townfive] } });
  const properties = await Property.aggregate([

    {
      //PLEASE NOTE: GeoNear must always be the first stage in the pipeline
      $geoNear: {
        near: {
          type: 'Point', 
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance', 
        distanceMultiplier: multiplier
      }
    }, 
    {
      $match: {
        type,
        bedrooms: { $gte: bedrooms.gte * 1, $lte: bedrooms.lte * 1}, 
        price: {$gte: price.gte * 1 , $lte: price.lte * 1},
        town: {$in: [townone, towntwo, townthree, townfour, townfive]}
      }
    }, 
    {
      $sort: {
        price: sort * 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success', 
    documents: properties
  });

});
