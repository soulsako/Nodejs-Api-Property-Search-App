const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteDoc = Model => catchAsync( async (req, res, next) => {

    const id = req.params.id;
    const doc = await Model.findByIdAndDelete(id);
    if(!doc) return next(new AppError('No document found with this id. Please check id and try again!', 401));
    
    res.status(204).json({
      status: 'success', 
      message: 'Document deleted successfuly'
    })

  });

  exports.updateDoc = Model => catchAsync(async (req, res, next) => {
  
    const id = req.params.id;
    
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true, 
      runValidators: true
    });3
  
    if(!doc){
      return next(new AppError('Error. No doc found with this id. Please check ID and try again', 404));
    }
    res.status(201).json({
      status: 'success', 
      doc,
      message: 'Document updated successfuly!'
    });
  });

  exports.createDoc = Model => catchAsync(async (req, res, next) => {
 
    const newDoc = await Model.create(req.body); // Equivlent to saving a doc
    res.status(200).json({
      status: 'success', 
      doc: newDoc,
      message: 'Your document was added successfuly!'
  });
});

exports.getAllDocs = Model => catchAsync(async (req, res, next) => {

  const features = new APIFeatures(Model.find(), req.query)
    .filter()
    .sort()
    .fields()
    .pagination();
  //This is where the properties are actually saved in the properties varibale
  const documents = await features.query;
  res.status(201).json({
    status: 'success',
    results: documents.length, 
    documents,
    message: 'Fetched all documents successfuly!'
  });
});

exports.getADoc = (Model, popOptions) => catchAsync(async (req, res, next) => {

  const id = req.params.id;
  
  let queryObject = Model.findById(id);
  if(popOptions) queryObject = queryObject.populate(popOptions);

  const document = await queryObject;

  //Mongoose will return null if no docs are found, hence we create our own error message
  //PLEASE NOTE: We do not handle general mongoose errors like duplication or validation errors with the AppError class
  if(!document){
    return next(new AppError('Error. Please check ID and try again', 404));
  }
  res.status(201).json({
    status: 'success', 
    document
  });
});

exports.updateAll = Model => catchAsync(async (req, res, next) => {

  await Model.update({}, { $rename: { rent: 'price' } }, { multi: true });
  res.status(201).json({
    status: 'success',
    message: "Document fields updated successfuly!"
  });

});
