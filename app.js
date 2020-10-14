const express             =       require('express');
const app                 =       express();
const bodyParser          =       require('body-parser');
const path                =       require('path'); // Used to find absolute path in any OS
const adminRoutes         =       require('./routes/admin'); // Requiring routes and controllers
const shopRoutes          =       require('./routes/shop');
const authRoutes          =       require('./routes/auth');
const errorController     =       require('./controllers/error');
const User                =       require('./models/user'); // Requiring users
const session             =       require('express-session'); // This is for sessions
const csrf                =       require('csurf'); // Securing Cross-Site-Request-Forgery
const csrfProtection      =       csrf(); // For Cross-Site-Forgery-Request Protection
const flash               =       require('connect-flash'); // For flashing errors
const db                  =       require('./util/database'); // Database connection
const dbURL               =       db.getConnectionString();
const multer              =       require('multer');
const randomId            =       require('./util/randomId');
const helmet              =       require('helmet');
const compression         =       require('compression');

app.set('view engine', 'ejs'); // Setting the templating engine

app.set('views', 'views'); // Not required to set if named views

app.use(express.static(path.join(__dirname, 'public'))); // For using files in public folder
app.use('/images', express.static(path.join(__dirname, 'images'))); // For serving images and stuff

app.use(bodyParser.urlencoded({ // Used for text-only data, Cannot be used to parse binary data like image
  extended: false
}));

app.use(helmet());  // for deployment
app.use(compression());   // for deployment

// Configuring Multer
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, randomId() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(multer({
  storage: fileStorage,
  fileFilter: fileFilter
}).single('image')); // Then name of the input field

// Session
const sessionHash = "785H3G61681eh95p3gAV3jFbVCP43Go6K7Owr11I1aUNf6zb3Y0N9s0sTpt61AY7ijIg7zX1kbNN10h14q0lLM88lth5z5244XuZ35RWi30i7v04wb41G3c71f10i8131C2PKG48TIMiC8M120c803hLPa45DV3v91JL973c7Au4yK3942CU0a1XO49V0g18KQ97q513J6A9o9ZeU88c6I4RMzx8ISTyk39I9ew1tB674NC81jmU1i45o5v631cP";
const MongoDBStore = require('connect-mongodb-session')(session); // MongoDB Store for sessions
const store = new MongoDBStore({
  uri: dbURL,
  collection: 'sessions'
});

app.use(session({
  secret: sessionHash,
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.use(csrfProtection); // Should be placed after session initialisation
app.use(flash()); // Should be placed after session initialisation

app.use((req, res, next) => { // Injecting user into our request for further access
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = new User({ // You have to initialise it like this else you won't be able to use User methods
        name: user.name,
        email: user.email,
        password: user.password,
        cart: user.cart,
        id: user._id
      });
      next();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  res.locals.errorMessage = req.flash('error');
  next();
})

app.use('/admin', adminRoutes); // app.use('/something', someroutes) this prepends /something before every route in someroutes
app.use(shopRoutes);
app.use(authRoutes);
app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.redirect('/500');
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Server Started');
  db.mongoConnect(() => {
    console.log('Connected to database');
  })
})


// if you ever come acrross situation where you have closed your server improperly and wants to reboot it use: - 
// => lsof -i tcp:portYouUsed
// kill -9 PID