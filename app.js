'use strict';
/**
 * Module dependencies.
 */
// const toobusy = require('toobusy-js');
const express = require('express');
require('dotenv').config();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const compress = require('compression');
const favicon = require('serve-favicon');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bodyParser = require('body-parser');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const methodOverride = require('method-override');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const Promise = require('bluebird');

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

//const MySQLStore = require('connect-mysql')({ session: session });
const flash = require('express-flash');
const path = require('path');
const passport = require('passport');
const expressValidator = require('express-validator');
const connectAssets = require('connect-assets');

dotenv.load({ path: '.env' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiUserController = require('./controllers/apiUser');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');

var userMiddleware = require('./config/user');


/**
 * API keys and Passport configuration.
 */
const secrets = require('./config/secrets');
const passportConf = require('./config/passport');

/**
 * Create Express server.
 */

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'us-east-1' 
});

const app = express();

const s3 = new aws.S3();

const fileFilter = (req, files, cb) => {
  if (files.mimetype === 'application/pdf' || files.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.locals.moment = require('moment');

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js')]
}));
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(favicon(path.join(__dirname, 'public/favicon.png')));

app.use(bodyParser.json());


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("access-control-allow-credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'upload-file-fisi',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (request, file, cb) {
      console.log(file);
      cb(null, file.originalname);
    }
  }),
  fileFilter: fileFilter
}).single('cv');

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(fileUpload(path.join(__dirname, 'uploads')));
app.use(expressValidator());
app.use(methodOverride());
app.use(cookieParser());

Promise.longStackTraces();

const db = require('./models/sequelize');

//MySQL Store
/*
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MySQLStore({
    config: secrets.mysql,
    table: secrets.mysql.sessionTable
  })
}));
*/
//PostgreSQL Store
app.use(session({
  store: new pgSession({
    conString: secrets.postgres,
    tableName: secrets.sessionTable
  }),
  secret: secrets.sessionSecret,
  saveUninitialized: true,
  resave: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true
    //, secure: true // only when on HTTPS
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.use(lusca({
//   csrf: { angular: true },
//   xframe: 'SAMEORIGIN',
//   xssProtection: true
// }));
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals.gaCode = secrets.googleAnalyticsCode;
  next();
});
app.use(function(req, res, next) {
  if (/api/i.test(req.path)) req.session.returnTo = req.path;
  next();
});
app.use(function(req, res, next) {
  res.cookie('XSRF-TOKEN', res.locals._csrf, {httpOnly: false});
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use('/static', express.static('uploads'));

/**
 * Primary app routes.
 */

app.get('/api/teachers', userController.allTeacher);

app.get('/perfil/docente/:id', userController.profileTeacher);

app.get('/', homeController.index);

app.get('/inicio/:id', homeController.perfilPreview);

app.get('/inicio', homeController.perfilPreview2);

app.get('/login', userController.getLogin);

app.post('/login', userController.postLogin);
//api login
// app.post('/api/login', apiUserController.apiPostLogin);

app.get('/logout', userController.logout);
// //api logout
// app.get('/api/logout', apiUserController.apiLogout);

app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/recuperar/password/:token', userController.getReset);
app.post('/recuperar/password/:token', userController.postReset);
app.get('/signup', userController.getSignup);

app.post('/signup', userController.postSignup);
app.get('/cuenta/verificar/:token', userController.getCheck)

// //api signup 
// app.post('/api/signup', apiUserController.apiPostSignup);

app.post('/upload/:id', upload, userController.postUpdateCv);

app.get('/buscar-docente', userController.findTeacher);

app.get('/contact', contactController.getContact);
app.post('/contact', contactController.postContact);

app.get('/account/:id',userController.getAccount);
// //api perfil
// app.get('/api/account', , apiUserController.getApiAccount);

app.post('/account/profile/:id', userController.postUpdateProfile);
// //api update profile
// app.put('/api/account/profile', , apiUserController.apiPutUpdateProfile);

app.post('/account/academic_profile/:id', userController.postUpdateAcademicProfile);
// //api update academic_profile
// app.put('/api/account/academic_profile', , apiUserController.apiPutUpdateAcademicProfile);

app.post('/account/teacher_information/:id', userController.postUpdateTeacherInformation);
// //api update teacher_information
// app.put('/api/account/teacher_information', , apiUserController.apiPutUpdateTeacherInformation);

app.post('/account/password', userController.postUpdatePassword);
app.delete('/account', userController.deleteAccount);
app.get('/account/unlink/:provider', userController.getOauthUnlink);

/**
 * API examples routes.
 */
// app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/facebook', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postTwitter);
app.get('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getVenmo);
app.post('/api/venmo', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.postVenmo);
app.get('/api/linkedin', passportConf.isAuthenticated, passportConf.isAuthorized, apiController.getLinkedin);
app.get('/api/yahoo', apiController.getYahoo);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
app.get('/api/bitgo', apiController.getBitGo);
app.post('/api/bitgo', apiController.postBitGo);

function safeRedirectToReturnTo(req, res) {
  const returnTo = req.session.returnTo || '/';
  delete req.session.returnTo;
  res.redirect(returnTo);
}

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/facebook', passport.authenticate('facebook', secrets.facebook.authOptions));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login', failureFlash: true }), safeRedirectToReturnTo);
app.get('/auth/github', passport.authenticate('github', secrets.github.authOptions));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login', failureFlash: true }), safeRedirectToReturnTo);
app.get('/auth/google', passport.authenticate('google', secrets.google.authOptions));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }), safeRedirectToReturnTo);
app.get('/auth/twitter', passport.authenticate('twitter', secrets.twitter.authOptions));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login', failureFlash: true }), safeRedirectToReturnTo);
app.get('/auth/linkedin', passport.authenticate('linkedin', secrets.linkedin.authOptions));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login', failureFlash: true }), safeRedirectToReturnTo);

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */

db
  .sequelize
  .sync({ force: false })
  .then(function() {
      app.listen(app.get('port'), function() {
        console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
      });
  });

module.exports = app;
