
'use strict';

var crypto;
var async = require('neo-async');
var passport = require('passport');

var UserRepo = require('../repositories/UserRepository.js');
var emailService = require('../services/emailService.js');

exports.apiPostLogin = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    console.log(errors);
    
    req.flash('errors', errors);
    return res.status(401).json({
      message: "Ha fallado el login"
    });
  }

  passport.authenticate('local', function(err, user, info) {
    if (!user || err) {
      req.flash('errors', info );
      return res.status(401).json({
        message: "Ha fallado el loginx2"
      });
    }
    req.logIn(user, function(loginErr) {
      if (loginErr) return next(loginErr);
      req.flash('success', info );
      res.status(200).json({
        message: "Inicio de sesión correcto"
      });
      // delete req.session.returnTo;
      // console.log(req.session);
      // res.redirect(req.session.returnTo);
    });
  })(req, res, next);
};

exports.apiLogout = function(req, res, next) {
  req.logout();
  res.locals.user = null;
  res.status(200).json({
    message: "Cerró la sesión exitosamente"
  });
};

exports.apiPostSignup = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.status(401).json({
      message: "Ha fallado la creación de la cuenta"
    });
  }

  UserRepo.createUser({
      email: req.body.email,
      password: req.body.password,
      profile: {},
      tokens: {}
    })
    .then(function(user) {
      req.logIn(user, function(err) {
        if (err) return next(err);
        console.log(user);
        res.status(201).json({
          message: "Se creo la cuenta correctamente"
        });
      });
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
};

exports.getApiAccount = function(req, res, next) {
  UserRepo.getProfileData(req.user.id)
    .then(function(data) {
      console.log(data);
      res.status(201).json({
        error: false,
        data: data
      });
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).json({
        error: true,
        data: [],
        error: error
      });
    })
};

exports.apiPutUpdateProfile = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  UserRepo.apiChangeProfileData(req.user.id, req.body)
    .then(function(data) {
      console.log(data);
      res.status(201).json({
        error: false,
        data: data
      });
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).json({
        error: true,
        data: [],
        error: error
      });
    })
};

exports.apiPutUpdateAcademicProfile = function(req, res, next) {
  UserRepo.apiChangeAcademicProfileData(req.user.id, req.body)
    .then(function(data) {
      console.log(data);
      res.status(201).json({
        error: false,
        data: data
      });
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).json({
        error: true,
        data: [],
        error: error
      });
    })
};

exports.apiPutUpdateTeacherInformation = function(req, res, next) {
  req.assert('email', 'Email is not valid').isEmail();
  UserRepo.apiChangeTeacherInformationData(req.user.id, req.body)
    .then(function(data) {
      console.log(data);
      res.status(201).json({
        error: false,
        data: data
      });
    })
    .catch(function(err) {
      console.log(err);
      res.status(500).json({
        error: true,
        data: [],
        error: error
      });
    })
};