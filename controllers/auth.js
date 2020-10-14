const User = require('../models/user');
const mongo = require('../util/database');
const mongodb = require('mongodb');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const validator = require('express-validator');

const bcryptHashRounds = 12;

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: "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"
  }
}));

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    oldInput: {
      name: "",
      password: "",
    },
    validationErrors: [],
  })
}

exports.postLogin = (req, res, next) => {
  const errors = validator.validationResult(req);
  User
    .findByName(req.body.name)
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Please signup',
          oldInput: {
            name: req.body.name,
            password: req.body.password,
          },
          validationErrors: errors.array(),
        });
      }
      const enteredPassword = req.body.password;
      const cryptedUserPassword = user.password;
      bcrypt.compare(enteredPassword, cryptedUserPassword)
        .then(matchSuccessful => {
          if (matchSuccessful) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save(err => { // to make sure that we redirect only when write is completed on mongodb
              res.redirect('/');
            });
          } else {
            return res.status(422).render('auth/login', {
              path: '/login',
              pageTitle: 'Login',
              errorMessage: 'Invalid or Incorrect Password',
              oldInput: {
                name: req.body.name,
                password: req.body.password,
              },
              validationErrors: [{param: 'password'}],
            });
          }
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        })
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err)
      console.log('logout err ', err);
    res.redirect('/');
  });
}

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'SignUp',
    oldInput: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    validationErrors: [],
  })
}

exports.postSignup = (req, res, next) => {
  const errors = validator.validationResult(req);
  // console.log(errors);
  if (!errors.isEmpty()) {
    // console.log(req.body.email);
    return res.status(422)
      .render('auth/signup', {
        path: '/signup',
        pageTitle: 'SignUp',
        errorMessage: errors.array()[0].msg,
        oldInput: {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          confirmPassword: req.body.confirmPassword
        },
        validationErrors: errors.array(),
      })
  }
  const password = req.body.password;
  bcrypt.hash(password, bcryptHashRounds)
    .then(hashedPassword => {
      const userDetails = {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        cart: {
          items: []
        }
      }
      user = new User(userDetails);
      return user.save();
    })
    .then(() => {
      res.redirect('/login');
      return transporter.sendMail({
        to: req.body.email,
        from: 'theinfinitymail13@gmail.com',
        subject: 'SignUp Succeeded',
        html: '<h1>You successfully signed up!</h1>'
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password'
  })
}

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect('/resert');
    }
    const token = buffer.toString('hex');
    const db = mongo.getDB();
    let mailId = null;
    db.collection('users')
      .findOne({
        name: req.body.name
      })
      .then(user => {
        if (!user) {
          req.flash('error', 'UserName Do Not Exist');
          return res.redirect('/reset');
        }
        mailId = user.email;
        return db.collection('users')
          .updateOne({
            _id: user._id
          }, {
            $set: {
              resetToken: token,
              resetTokenExpiration: Date.now() + 3600000
            }
          })
          .then(() => {
            res.redirect('/login');
            return transporter.sendMail({
              to: mailId,
              from: 'theinfinitymail13@gmail.com',
              subject: 'Reset Password',
              html: `
              <p>Password Change Requested</p>
              <p>Clik this <a href="http://localhost:3000/new-password/${token}">Link</a> to set a new password</p>
              `
            })
          })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          })
      })
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  const db = mongo.getDB();
  db.collection('users')
    .findOne({
      resetToken: token,
      resetTokenExpiration: {
        $gt: Date.now()
      }
    })
    .then(user => {
      if (!user) {
        req.flash('error', 'Click Reset Password Again Token Expired');
        return res.redirect('/login');
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        userId: user._id.toString(),
        passwordToken: token
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.postNewPassword = (req, res, next) => {
  const userId = new mongodb.ObjectId(req.body.userId);
  const passwordToken = req.body.passwordToken;
  const newPassword = req.body.password;
  const db = mongo.getDB();
  db.collection('users')
    .findOne({
      _id: userId,
      resetToken: passwordToken,
      resetTokenExpiration: {
        $gt: Date.now()
      }
    })
    .then(user => {
      if (!user) {
        return res.redirect('/');
      }
      bcrypt.hash(newPassword, bcryptHashRounds)
        .then(hashedPassword => {
          return db
            .collection('users')
            .updateOne({
              _id: user._id
            }, {
              $set: {
                password: hashedPassword,
                resetToken: undefined,
                resetTokenExpiration: undefined
              }
            })
        })
        .then(() => {
          return res.redirect('/login');
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}