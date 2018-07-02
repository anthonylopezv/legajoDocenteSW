"use strict";

/**
 * GET /
 * Home page.
 */

var UserRepo = require('../repositories/UserRepository.js');

var db = require('../models/sequelize');


exports.index = function(req, res) {
  var idQuery = req.query.id
  console.log('String: ', idQuery)
  var id = Number(idQuery)
  console.log('Number', id)
  db.User.findById(id)
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
};