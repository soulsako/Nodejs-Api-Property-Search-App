const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')

const userSchema = new mongoose.Schema({

  firstName: {
    type: String, 
    required: [true, 'Please tell us your name.'], 
    minlength: 2,
    maxLength: 40
  },
  lastName: {
    type: String, 
    required: [true, 'Please tell us your name.'], 
    minlength: 2,
    maxLength: 40
  },
  email: {
    type: String, 
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true, 
    validate: {
      validator: validator.isEmail, 
      message: 'Inavlid email address. Please check and try again.'
    },
  }, 
  photo: {
    type: String, 
    default: 'default-user-icon.jpg'
  },
  role: {
    type: String,
    enum: ['user','admin'],
    default: 'user'
  },
  password: {
    required: [true, 'Please create a password.'],
    type: String, 
    minlength: 8, 
    select: false
  }, 
  // confirmPassword: {
  //   type: String, 
  //   required: [true, 'Please confirm your password'],
  //   validate: {
  //     //This only works on Save and create ie User.save() or create() and NOT on update!!! 
  //     validator: function(currEl){
  //       return currEl === this.password;
  //     }, 
  //     message: 'Confirm password does not match password. Please check and try again.'
  //   }
  // }, 
  passwordChangedAt: {
    type: Date, 
    select: false
  }, 
  passwordResetToken: {
    type: String, 
    select: false
  }, 
  passwordResetExpires: {
    type: Date, 
    select: false
  }, 
  isActive: {
    type: Boolean, 
    default: true, 
    select: false
  }, 
  preferences: {
    type: Object
  }, 
  pushToken: {
    type: Object
  }, 
  appVersion: {
    type: Object
  }

});

userSchema.pre('save', function(){

  if(!this.isModified('password') || this.isNew) return next();
  //JSONWebToken sometime takes a while to be created hence we add a second 
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function(next){
  //DO NOT hash password if password field is not modified
  if(!this.isModified('password')) return next();

  //Hash the password with force of 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete confirm password
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
  return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimeStamp){
  //If user ever requested a password: this property will be true
  if(this.passwordChangedAt){
    const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
}

userSchema.methods.createPasswordResetToken = function(){
  
  //Create token 
  const resetToken = crypto.randomBytes(32).toString('hex');
  //Encrypt token and set to the current user
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  //Set time limit for expiration
  this.passwordResetExpires = Date.now() + 10 //* 60 * 1000;
  //Return un-encrypted token 
  return resetToken;
}

userSchema.pre(/^find/, function(next){
  //this points to current query
  this.find({isActive: {$ne: false}});
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;