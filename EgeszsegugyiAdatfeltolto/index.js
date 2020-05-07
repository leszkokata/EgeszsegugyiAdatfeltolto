const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const expressSession = require('express-session');
const mongoose = require('mongoose');
const config = require('./config/database');
const port = 8080;
const cors = require('cors');

const app = express();

// Kapcsolódás a MongoDB adatbázishoz
require('./models/patients.model');
require('./models/doctors.model');
require('./models/measurements.model');

const patientModel = mongoose.model('patient');
const doctorModel = mongoose.model('doctor');
const measurementModel = mongoose.model('measurement');


var whitelist = ['http://localhost:4200/','http://localhost:4200/login', 'http://localhost:4200/patient','http://localhost:4200/doctor'];
var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
};

mongoose.connect(config.database);
mongoose.connection.on('connected', () => { console.log("Sikeres kapcsolódás az adatbázishoz!"); })
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.connection.on('error', () => { console.log("Hiba a kapcsolódás folyamán!"); })

//app.use(cors());
app.use(cors(corsOptions));

/*
app.get('/', function(req,res,next) {
    res.json({msg: 'This is CORS-enabled for all origins!'})
})
app.get('/login', function(req,res,next) {
    res.json({msg: 'This is CORS-enabled for all origins!'})
})
app.get('/patient', function(req,res,next) {
    res.json({msg: 'This is CORS-enabled for all origins!'})
})
*/

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Ezekkel lépteti be a passport sessionbe a usert majd szedi ki onnan
passport.serializeUser((user, done) => {
    if(!user) return done("Felhasználó nem található!", undefined);
    return done(null, user);
});

passport.deserializeUser((user, done) => {
    if(!user) return done("Nincs felhasználó, akit kileptethetnenk!", undefined);
    return done(null, user);
});

passport.use('local', new localStrategy((username, password, done) => {

    patientModel.findOne({ email: username }, function(err, patient){
        if(err) return done('Hiba a beteg keresése során!', undefined)
        if(patient) {
            patient.comparePasswords(password, function(err, isMatch){
                if(err || !isMatch) return done('Helyelen jelszó vagy hiba az összehasonlitás során!', undefined)
                const state = 1;
                return done(null, patient);
            })
        } else {
            doctorModel.findOne({ email: username }, function(err, doctor){
                if(err) return done('Hiba az orvos keresése során!', undefined)
                if(doctor) {
                    doctor.comparePasswords(password, function(err, isMatch){
                        if(err || !isMatch) return done('Helyelen jelszó vagy hiba az összehasonlitás során!', undefined)
                        return done(null, doctor);
                    })
                } else { return done("Hibás vagy nem létező orvos felhasználónév!", undefined); }
            });
        };
    });

}));




app.use(expressSession({
    secret: 'ezegyujabbprfgyakorlatmarnemtudokujsecretetkitalalni',
    proxy: true,
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./routes'));


// Szerver inditasa
app.listen(port, () => { console.log('Fut a szerver a ' + port + ' porton!'); });