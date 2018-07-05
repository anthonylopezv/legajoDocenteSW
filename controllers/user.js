
'use strict';

var crypto;
var async = require('neo-async');
var passport = require('passport');

var UserRepo = require('../repositories/UserRepository.js');
var emailService = require('../services/emailService.js');
var db = require('../models/sequelize');
const fileUpload = require('express-fileupload')


exports.getLogin = function(req, res) {
  if (req.user)
    return res.redirect('/account');

  res.render('account/login', {
    title: 'Iniciar Sesión'
  });
};

exports.postLogin = function(req, res, next) {
  req.assert('email', 'Correo institucional no valido').isEmail();
  req.assert('password', 'La contraseña no puede estar en blanco').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    console.log(errors)
    return res.redirect('/login');
  }

  passport.authenticate('local', function(err, user, info) {
    if (!user || err) {
      req.flash('errors', { msg: err });
      return res.redirect('/login');
    }
    req.logIn(user, function(loginErr) {
      if (loginErr) return next(loginErr);
      req.flash('success', { msg: 'Genial! usted ha iniciado sesión.' }); 
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
};

exports.logout = function(req, res, next) {
  req.logout();
  res.locals.user = null;
  res.redirect('/');
};

exports.getSignup = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/signup', {
    title: 'Registrarse'
  });
};

exports.postSignup = function(req, res, next) {
  crypto = require('crypto');

  req.assert('email', 'El email no es válido.').isEmail();
  req.assert('password', 'La contraseña debe tener al menos 8 caracteres de largo.').len(8);
  req.assert('confirmPassword', 'Las contraseñas no coinciden.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/signup');
  }

  UserRepo.createUser({
      email: req.body.email,
      password: req.body.password,
      profile: {},
      tokens: {}
    })
    .then(function(user) {
      req.logIn(user, function(err) {
        if (err) {
          return next(err);
        }

        async.waterfall([
          function(done) {
            crypto.randomBytes(24, function(err, buf) {
              var token = buf.toString('hex');
              done(err, token);
            });
          },
          function(token, done) {
            var email = req.body.email.toLowerCase();
            UserRepo.assignVerifiedToken(email, token)
              .then(function(user){
                done(null, token, user);
              })
              .catch(function(err) {
                req.flash('errors', { msg: err });
                return res.redirect('/signup');
              });
          },
          function(token, user, done) {
            emailService.sendRequestVerifiedEmail(user.email, req.headers.host, token, function(err) {
              req.flash('info', { msg: `¡Hola! Verifique su correo electrónico (${user.email}) para confirmar su cuenta.` });
              done(err, 'done');
            });
          }
        ],function(err) {
          if (err) return next(err);
          return res.redirect('/');
        });
        // req.flash('success', { msg: 'Su cuenta ha sido creada y ha iniciado sesión exitosamente.' });
        // res.redirect('/');
      });
    })
    .catch(function(err) {
      console.log(err)
      req.flash('errors', { msg: err });
      return res.redirect('/login');
    });
};

exports.getAccount = function(req, res) {
  db.User.findById(req.params.id)
  .then((user) => {
    res.render('account/profile', {
      title: 'Mi Perfil',
      usuario: user
    });
  })
  .catch((err) => {
    console.log(err)
  })
};

exports.profileTeacher = (req, res) => {
  db.User.findById(req.params.id)
  .then((user) => {
    res.render('account/viewProfile', {
      title: 'Ver Perfil',
      docente: user
    });
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.allTeacher = (req, res) => {
  db.User.findAll()
  .then((user) => {
    return res.status(200).json(user)
  })
  .catch((err) => {
    return res.status(500).json({
      error: "No hay registros en la tabla Docente.",
      err
    });
  })
}

exports.findTeacher = (req, res) => {
  db.User.findAll()
  .then((users) => {
    res.render('account/buscarProfesores', {
      title: 'Buscar Profesor',
      usuarios: users
    });
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.postUpdateProfile = function(req, res) {
  req.assert('email', 'Correo institucional no válido').isEmail();

  UserRepo.changeProfileData(req.params.id, req.body)
  .then(function(data) {
    console.log('Ver uno: ', req.body)
    req.flash('success', { msg: 'Información personal actualizada.' });
    res.redirect('/account/'+data.id);
  })
  .catch(function(err) {
    console.log(err);
    
    req.flash('errors', { msg: err });
    res.redirect('/account/'+data.id);
  });
};

exports.postUpdateAcademicProfile = function(req, res) {
  req.assert('email', 'Correo institucional no valido').isEmail();
  UserRepo.changeAcademicProfileData(req.params.id, req.body)
  .then(function(data) {
    req.flash('success', { msg: 'Perfil acádemico actualizado.' });
    res.redirect('/account/'+data.id);
  })
  .catch(function(err) {
    console.log(err);
    
    req.flash('errors', { msg: err });
    res.redirect('/account/'+data.id);
  });
};

exports.postUpdateCv = function(req, res) {
  db.User.findById(req.params.id)
  UserRepo.changeCvData(req.params.id, req.file)
  .then(function(data) {
    req.flash('success', { msg: 'Currículum vitae actualizado.' });
    res.redirect('/account/'+data.id);
  })
  .catch(function(err) {    
    req.flash('errors', { msg: 'Hubo un error al subir el C.V.(solo se acepta archivo PDF o WORD)' });
    res.redirect('back');
  });
};

exports.postUpdateTeacherInformation = function(req, res) {
  req.assert('email', 'Correo institucional no válido').isEmail();
  UserRepo.changeTeacherInformationData(req.params.id, req.body)
  .then(function(data) {
    console.log(data);
    
    req.flash('success', { msg: 'Información del docente actualizada.' });
    res.redirect('/account/'+data.id);
  })
  .catch(function(err) {
    console.log(err);
    
    req.flash('errors', { msg: err });
    res.redirect('/account/'+data.id);
  });
};

exports.postUpdatePassword = function(req, res) {
  req.assert('password', 'La contraseña debe tener al menos 8 caracteres de largo').len(8);
  req.assert('confirmPassword', 'Contraseñas no coinciden').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  UserRepo.changeUserPassword(req.params.id, req.body.password)
    .then(function() {
      req.flash('success', { msg: 'la contraseña ha sido cambiada.' });
      res.redirect('/account');
    })
    .catch(function(err) {
      req.flash('errors', { msg: err });
      res.redirect('/account');
    });
};

exports.deleteAccount = function(req, res) {
  UserRepo.removeUserById(req.params.id)
    .then(function() {
      req.logout();
      req.flash('info', { msg: 'Your account has been deleted.' });
      res.json({ success: true });
    });
};

exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;

  UserRepo.unlinkProviderFromAccount(provider, req.params.id)
    .then(function() {
      req.flash('info', { msg: provider + ' cuenta ha sido desvinculada.' });
      res.redirect('/account');
    })
    .catch(function(err) {
      return next(err);
    });
};

exports.getCheck = function(req, res) {
  UserRepo.findUserByVerifiedToken(req.params.token)
    .then(function(user) {
      req.flash('success', { msg: `¡Felicidades! Su cuenta ha sido verificada exitosamente.` });
      return res.redirect('/')
    })
    .catch(function(err) {
      req.flash('errors', { msg: `Su cuenta ya ha sido verificada.` });
      return res.redirect('/')
    });
};

exports.getReset = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  UserRepo.findUserByResetPswToken(req.params.token)
    .then(function(user) {
      if(!user)
        throw 'La solicitud de restablecimiento de contraseña no es válida o ha expirado.';

      res.render('account/reset', {
        title: 'Recuperar contraseña'
      });
    })
    .catch(function(err) {
      req.flash('errors', { msg: err });
      return res.redirect('/forgot');
    });
};

exports.postReset = function(req, res, next) {
  req.assert('password', 'La contraseña debe tener al menos 8 caracteres de largo.').len(8);
  req.assert('confirm', 'Las contraseñas deben coincidir.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  async.waterfall([
    function(done) {
      UserRepo.changeUserPswAndResetToken(req.params.token, req.body.password)
        .then(function(user){
          req.logIn(user, function(err2) {
            done(err2, user);
          });
        })
        .catch(function(err) { done(err, null); });
    },
    function(user, done) {
      emailService.sendPasswordChangeNotificationEmail(user.email, function(err) {
        req.flash('info', {
          msg: 'La contraseña ha sido modificada con éxito. El correo electrónico de notificación ha sido enviado a ' + user.email + ' para informar sobre este hecho.'
        });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
};

exports.getForgot = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Recuperar contraseña'
  });
};

exports.postForgot = function(req, res, next) {
  crypto = require('crypto');

  req.assert('email', 'Por favor, introduce una dirección de correo electrónico válida.').isEmail();
  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(24, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      var email = req.body.email.toLowerCase();
      UserRepo.assignResetPswToken(email, token)
        .then(function(user){
          done(null, token, user);
        })
        .catch(function(err) {
          req.flash('errors', { msg: err });
          return res.redirect('/forgot');
        });
    },
    function(token, user, done) {
      emailService.sendRequestPasswordEmail(user.email, req.headers.host, token, function(err) {
        req.flash('info', { msg: 'Se ha enviado un correo electrónico a ' + user.email + ' con  mas instrucciones.' });
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
};
