'use strict';

var secrets = require('../config/secrets');
var mailer = require('sendgrid')(secrets.sendgrid.user, secrets.sendgrid.password);

var service = {};

var applicationName = 'SIGAP - Legajo Docente FISI';
var senderAddress = 'noreply@sigap.com';

service.sendRequestPasswordEmail = function(email, host, token, done) {
  var mailOptions = {
    to: email,
    from: senderAddress,
    subject: 'Restablece tu contraseña en ' + applicationName,
    text: 'Está recibiendo este correo electrónico porque usted ha solicitado que se restablezca la contraseña de su cuenta.\n\n' +
    'Haga clic en el siguiente enlace o pegue esto en su navegador para completar el proceso:\n\n' +
    'https://' + host + '/recuperar/password/' + token + '\n\n' +
    'Si no lo solicitó, ignore este correo electrónico y su contraseña no cambiará.\n'
  };

  mailer.send(mailOptions, done);
};

service.sendRequestVerifiedEmail = function(email, host, token, done) {
  var mailOptions = {
    to: email,
    from: senderAddress,
    subject: 'Confirma tu cuenta en ' + applicationName,
    text: `¡Gracias por registrarte con SIGAP - Legajo Docente FISI! Debes seguir este enlace para verificar tu cuenta:\n\n
              https://${host}/cuenta/verificar/${token}\n\n
              Gracias.\n`
    // text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
    // 'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
    // 'http://' + host + '/reset/' + token + '\n\n' +
    // 'If you did not request this, please ignore this email and your password will remain unchanged.\n'
  };

  mailer.send(mailOptions, done);
};

service.sendPasswordChangeNotificationEmail = function(email, done) {
  var mailOptions = {
    to: email,
    from: senderAddress,
    subject: 'Tu ' + applicationName + ' la contraseña ha sido cambiada',
    text: 'Hola,\n\n' +
    'Esta es una confirmación de que la contraseña de su cuenta ' + email + ' acaba de ser cambiado.\n'
  };

  mailer.send(mailOptions, done);
};

module.exports = service;
