"use strict";

/**
 * GET /
 * Home page.
 */

var UserRepo = require('../repositories/UserRepository.js');

var db = require('../models/sequelize');


exports.index = function(req, res) {
  var data = req.query
  console.log(req.query)
  if (data.tipo == 'Docente' || data.tipo == 'docente' || data.tipo == 'DOCENTE'){
    db.User.findById(data.id)
    .then((user) => {
      req.flash('success', {msg: `¡Hola ${user.nombres} ${user.apell_pat}! Bienvenido al módulo Legajo Docente - FISI`})
      res.render('home', {
        title: 'Inicio',
        usuario: user
      });
    })
    .catch((err) => {
      console.log(err)
    })
  }
  else if (data.tipo == 'Administrador' || data.tipo == 'administrador' || data.tipo == 'ADMINISTRADOR') {
    db.User.findAll()
    .then((users) => {
      req.flash('success', {msg: `Bienvenido al módulo Legajo Docente - FISI`})
      res.render('home', {
        title: 'Inicio',
        docente: users
      });
    })
    .catch((err) => {
      console.log(err)
    })
  }
};

exports.perfilPreview = function(req, res) {
  const id = req.params.id
  db.User.findById(id)
  .then((user) => {
    res.render('home2', {
      title: 'Inicio',
      usuario: user
    });
  })
  .catch((err) => {
    console.log(err)
  })
};

exports.perfilPreview2 = function(req, res) {
  db.User.findAll()
  .then((users) => {
    res.render('home', {
      title: 'Inicio',
      docente: users
    });
  })
  .catch((err) => {
    console.log(err)
  })
};