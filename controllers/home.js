"use strict";

/**
 * GET /
 * Home page.
 */

var UserRepo = require('../repositories/UserRepository.js');

var db = require('../models/sequelize');


exports.index = function(req, res) {
  var data = req.query
  if (data.tipo == 'docente'){
    db.User.findById(data.id)
    .then((user) => {
      console.log(user)
      req.flash('success', {msg: `¡Hola ${user.nombres} ${user.apell_pat}! Bienvenido al modulo Legajo Docente - FISI`})
      res.render('home', {
        title: 'Inicio',
        usuario: user
      });
    })
    .catch((err) => {
      console.log(err)
    })
  }
  else if (data.tipo == 'Administrador') {
    req.flash('success', {msg: `Bienvenido al modulo Legajo Docente - FISI`})
    res.render('home', {
      title: 'Inicio'
    });
  }
};