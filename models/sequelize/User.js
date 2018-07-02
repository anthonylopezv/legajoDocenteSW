'use strict';

var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

//HMAC version
// var secrets = require('../config/secrets');
// function createHash(string) {
//   if(!string)
//     return null;

//   var hashKey = secrets.localAuth.hashKey;
//   var hmac = crypto.createHmac(secrets.localAuth.hashMethod, new Buffer(hashKey, 'utf-8'));
//   return hmac.update(new Buffer(string, 'utf-8')).digest('hex');
// }

var instanceMethods = {
  getGravatarUrl: function(size) {
    if (!size) size = 200;

    if (!this.email) {
      return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
    }

    var md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
  },
  getProfilePicture: function(size) {
    if(this.profile && this.profile.picture != null)
      return this.profile.picture;

    return this.getGravatarUrl(size);
  },
  hasSetPassword: function() {
    return this.password != null && this.password.length > 0;
  }
};

var beforeSaveHook = function(user, options, fn) {
  if(user.changed('password')) {
    this.encryptPassword(user.password, function(hash, err) {
      user.password = hash;
      fn(null, user);
    });
    return;
  }
  fn(null, user);
};

module.exports = function(db, DataTypes) {
  var User = db.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    // verificado: {
    //   type: DataTypes.INTEGER,
    //   defaultValue: 0
    // },
    //Informacion Personal
    nombres: DataTypes.STRING,
    apell_pat: DataTypes.STRING,
    apell_mat: DataTypes.STRING,
    pais: DataTypes.STRING,
    tipo_document: DataTypes.STRING,
    nro_document: DataTypes.INTEGER,
    codigo: DataTypes.STRING,
    telefono: DataTypes.INTEGER,
    celular: DataTypes.INTEGER,
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      isEmail: true
    },
    linkedInId: {
      type: DataTypes.STRING,
      unique: true
    },
    // password: DataTypes.STRING,
    genero: DataTypes.STRING(1),
    pag_web: DataTypes.STRING,
    foto: {
      type: DataTypes.STRING,
      defaultValue: 'http://res.cloudinary.com/dft8lq2m7/image/upload/v1524686469/user2.png'
    },  
    fecha_nac: DataTypes.DATE,
    direccion: DataTypes.STRING,
    //fin informacion personal

    //Perfil academico
    mayor_grado: DataTypes.STRING,
    menc_grado: DataTypes.STRING,
    universidad: DataTypes.STRING,
    pais_grado: DataTypes.STRING,
    cv: DataTypes.STRING,
    //fin perfil academico

    //Informacion del docente
    fech_ingreso: DataTypes.DATE,
    sunedu_ley: DataTypes.STRING(2),
    nivel_programa: DataTypes.STRING,
    pregrado: DataTypes.STRING(2),
    maestria: DataTypes.STRING(2),
    doctorado: DataTypes.STRING(2),
    categoria: DataTypes.STRING,
    regimen_dedicacion: DataTypes.STRING,
    horas_semanales: DataTypes.INTEGER,
    investigador: DataTypes.STRING(2),
    dina: DataTypes.STRING(2),
    per_academico: DataTypes.STRING,
    //fin informacion del docente

    //observaciones
    observacion: DataTypes.STRING,

    resetPasswordExpires: DataTypes.DATE,
    resetPasswordToken: DataTypes.STRING,

    // verifiedToken: DataTypes.STRING,

    //timestamps
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,

    logins: DataTypes.INTEGER,
    profile: DataTypes.JSON,
    tokens: DataTypes.JSON
  }, {
    // timestamps: false,
    // paranoid: false,
    // underscored: false,
    freezeTableName: true,
    tableName: 'docente',
    instanceMethods: instanceMethods,
    classMethods: {
      associate: function(models) {
        //User.hasMany(models.Role);
      },
      encryptPassword: function(password, cb) {
        if (!password) {
          cb('', null);
          return;
        }

        bcrypt.genSalt(10, function(err, salt) {
          if (err) { cb(null, err); return; }
          bcrypt.hash(password, salt, null, function(hErr, hash) {
            if (hErr) { cb(null, hErr); return; }
            cb(hash, null);
          });
        });
      },
      findUser: function(email, password, cb) {
        User.findOne({
          where: { email: email }
        })
        .then(function(user) {
          if(user == null || user.password == null || user.password.length === 0) {
            cb('User / Password combination is not correct', null);
            return;
          }
          bcrypt.compare(password, user.password, function(err, res) {
            if(res)
              cb(null, user);
            else
              cb(err, null);
          });
        })
        .catch(function(serr) { cb(serr, null); });
      }
    },
    hooks: {
      beforeUpdate: beforeSaveHook,
      beforeCreate: beforeSaveHook
    },
    indexes: [
      {
        name: 'linkedInIdIndex',
        method: 'BTREE',
        fields: ['linkedInId']
      }
    ]
  });

  return User;
};