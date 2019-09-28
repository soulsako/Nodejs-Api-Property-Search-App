const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');
//Third party packgage middleware for uploading images
const multer = require('multer');
//Third party packgage middleware for resizing images
const sharp = require('sharp');

// const multerStorage = multer.diskStorage({

//   destination: (req, file, cb) =>  {
//     cb(null, 'public/img/users')
//   }, 
//   filename: (req, file, cb) => {
//     // user-userid-currentTimeStamp.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

//Us this method on multer if image resizing is required
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {

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

exports.uploadUserImage = upload.single('photo');
exports.resizeUserImage = catchAsync( async(req, res, next) => {

  if(!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
  
  await sharp(req.file.buffer)
  .resize(300, 300)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/users/${req.file.filename}`);
  
  next();
});

const _filterObj = (reqObj, ...allowedFields) => {
  const newObj = {};
  Object.keys(reqObj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = reqObj[el];
  });
  return newObj;
}

exports.updateMe = catchAsync( async (req, res, next) => {
  // 1) Create error if user posts password data
  const { password, confirmPassword } = req.body;
  if(password || confirmPassword) return next(new AppError('This route is not for password updates. Please use /updatepassword'));
  //Filter out unwanted fields from req.body
  let filteredBody = _filterObj(req.body, 'firstName', 'lastName', 'email', 'preferences', 'pushToken', 'appVersion', 'photo');

  //Append to preferences field and NOT replace it
  if(Object.keys(req.body).includes('preferences')){
    const user = await User.findOne({_id: req.user.id});
    const oldPreferences = {...user.preferences};
    filteredBody = {preferences: {...oldPreferences, ...filteredBody.preferences}}
  }
  if(req.file) filteredBody.photo = req.file.filename;
  // 2) Update user document // We can use findOneAndUpdate since we are not dealing with passwords
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, 
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success', 
    user: updatedUser
  });

});

exports.deleteMe = catchAsync( async (req, res, next) => {

  await User.findByIdAndUpdate(req.user.id, {isActive: false});
  res.status(204).json({
    status: 'success',
    message: 'User deleted successfuly.', 
    data: null
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.allUsers = factory.getAllDocs(User);
exports.user = factory.getADoc(User);
exports.updateUser = factory.updateDoc(User);
exports.deleteUser = factory.deleteDoc(User);
