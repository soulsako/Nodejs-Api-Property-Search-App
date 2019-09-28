const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const _signToken = id => {
  return jwt.sign({id}, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

const createSendToken = (user, statusCode, res) => {
  const token = _signToken(user._id);
  res.status(statusCode).json({
    status: 'success', 
    token, 
    user
  });
}

exports.signup = catchAsync(async (req, res, next) => {

  const { firstName, lastName, email, password } =  req.body;
  
  const newUser = await User.create({
    firstName,
    lastName, 
    email, 
    password
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync( async (req, res, next) => {

  const { email, password } = req.body;

  // 1) Check if email and password exists
  if(!email && !password){
    return next(new AppError('Please provide an email and password', 400));
  }else if(!email){
    return next(new AppError('Please provide an email', 400));
  }else if(!password){
    return next(new AppError('Please provide a password', 400));
  }

  // 2) check if user exists and password is correct
  const user = await User.findOne({email}).select('+password');

  // 3) If everything is ok, send the token to client

  if(!user || !await user.correctPassword(password, user.password)){
    return next(new AppError('Invalid credentials. Please check and try again.', 401));
  }

  createSendToken(user, 200, res);
});

exports.isAuthenticated = catchAsync(async (req, res, next) => {
   
    let token;
    const { authorization } = req.headers;
  // 1) Check if token exists 
    if(authorization && authorization.startsWith('Bearer')){
      token = authorization.split(' ')[1];
    }
    if(!token){
      return next(new AppError('Please login to see properties available to rent near you', 401));
    }
  // 2) Validate the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
  // 3) Check if user still exists 
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
      return next(new AppError('The user belonging to this token does not exist anymore. Please register again or contact customer support.', 401));
    }
  // 4) Check if user changed password after the token was issued
  //Can be checked by checking if the token created timestamp is older than password created timestamp
    if(freshUser.changedPasswordAfter(decoded.iat)){
      return next(new AppError('User recently changed password. Please log in again with new password.', 401));
    };

    //Grant access to granted route
    req.user = freshUser;
    next();
});

 exports.restrictTo = (...roles) => {
   return (req, res, next) => {
     // roles ['admin', 'lead-guide']
     if(!roles.includes(req.user.role)){
       return next(new AppError('You do not have permission to peform this action', 403));
     }
     next();
   }
 }

 exports.forgotPassword = catchAsync(async (req, res, next) => {
   
    const { email, deepLinkUrl } = req.body;
   // 1) Check if the user reseting password exists   
    const user = await User.findOne({ email });
    if(!user) return next(new AppError('You have entered an invalid email address. Please try agian.', 401));
   // 2) Generate a random reset token and set the prop for the user to database
   const resetToken = user.createPasswordResetToken();
   //Save the user becasue setting props on user does not mean it will be saved to the database
   await user.save({ validateBeforeSave: false });
   // 3) Create a reset url with token 
  //  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;
   const resetURL = `${deepLinkUrl}/${resetToken}`;
   //Add  a message for instructions
   const html = `<p>Forgot your password? Click the following link to reset your password: <a href="${resetURL}">Reset Password</a>. If you did not request a pasword reset. Please ignore this email.</p>`;
  
   try {

    await sendEmail({
      email: user.email, 
      subject: 'Password Reset. Only valid for 10 mins', 
      html
    });
    //If email us successfuly mailed 
    res.status(200).json({
      status: 'success',
      message: 'Please check your email for reset instructions.'
    });

   }catch(err){
    //If email is not sent due to error 
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('We apologise. There was an error sending the email. Please try again later.', 500));
   }
   
 });

 exports.resetPassword = catchAsync( async (req, res, next) => {

    // 1) Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}})

    // 2) If token is not expired and there is user, set the new password
    if(!user){
      return next(new AppError('Password reset link has expired. Please reset the password again.', 400));
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) update changed passwordAt property for the user
    //method created on userSchema (check file userModel) which automatically takes care of this step
    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
 });

 exports.updatePassword = catchAsync(async (req, res, next) => {

  // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the password is correct
    if(!(await user.correctPassword(req.body.currentPassword, user.password))){
      return next(new AppError('Your current password is wrong.', 401));
    }
  // 3) If so, update the password
      user.password = req.body.password;
      user.confirmPassword = req.body.confirmPassword;
      await user.save();
    
  // 4) Log user in, send the JWT
    createSendToken(user, 200, res);
});