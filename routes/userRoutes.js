const express = require('express');
const userController = require('../controllers/userController');
const authController = require('./../controllers/authController');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

//All the routes below this middleware will only run successfuly if authenticated
router.use(authController.isAuthenticated);

//A Route to get the current logged in user
router.get('/me', userController.getMe, userController.user);
router.patch('/updatepassword', authController.updatePassword);

//Further details can be found on request object i.e. req.file
router.patch('/updateme', userController.uploadUserImage, userController.resizeUserImage, userController.updateMe);
router.delete('/deleteme', userController.deleteMe);

//All the routes below this middleware can only be accssed by an admin
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.allUsers);

router
  .route('/:id')
  .get(userController.user)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;