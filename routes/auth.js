const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

const validator = require('express-validator');

const User = require('../models/user');

router.get('/login', authController.getLogin);

router.post('/login', [
    validator
    .check('password', 'Invalid or Incorrect Password')
    .isAlphanumeric()
    .isLength({min: 8})
    .trim()
  ],
  authController.postLogin
);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup', [
    validator
    .check('name', 'UserName exist try logging in')
    .custom(name => {
      return User
        .findByName(name)
        .then(user => {
          if (user) {
            return Promise.reject();
          }
        })
    })
    .trim(),

    validator
    .check('email', 'Invalid email')
    .isEmail()
    .normalizeEmail(),

    validator
    .check('password', 'Password should be alpha Numeric and atleast of length 8')
    .trim()
    .isAlphanumeric()
    .isLength({
      min: 8
    }),

    validator
    .check('confirmPassword')
    .trim()
    .custom((value, {
      req
    }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  authController.postSignup
);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/new-password/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;