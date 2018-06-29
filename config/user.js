'user strict'
var db = require('../models/sequelize');

//Si el usuario esta verificado
exports.isVerified = (req, res, next) => {
  db.User.findOne({
    where: {
      id: req.user.id,
      verificado: 1,
    }
  })
  .then((user) => {
    if (user) {
      console.log('*****************************************************************+******')
      return next()
    } else {
      req.flash('errors', { msg: `Su cuenta aun no ha sido verificada, verifique su correo electrónico () para confirmar su cuenta.` })
      res.redirect('/')
    }
  })
}