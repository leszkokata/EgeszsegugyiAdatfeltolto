const router = require('express').Router();
const passport = require('passport');
const fs = require('fs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const patientModel = mongoose.model('patient');
const doctorModel = mongoose.model('doctor');
const measurementModel = mongoose.model('measurement');

// Bejelentkezői felület - Főoldal
router.route('/login').post((req, res) => {
    if(req.body.username && req.body.password) {
        passport.authenticate('local', (error, user) => {
            if(error) { return res.json( { success: false, message: 'Hiba a bejelentkezes kozben! ' + error } ); }
            else {
                // Ez hívja meg a serializeUser-t és hozza létre a sessiont
                req.logIn(user, (error) => {
                    if(error) return res.json( { success: false, message: 'Hiba a bejelentkezes kozben! ' + error } );
                    else if(user.doctor){ return res.json( { success: true, message: 'A beteg bejelentkezese sikeres!', name: user.name, username: user.email } ); }
                    else if(user.profession){ return res.json( { success: true, message: 'Az orvos bejelentkezese sikeres!', name: user.name ,username: user.email } ); }
                    else { return res.json( { success: false, message: 'Hiba a bejelentkezes kozben!' } ); }
                });
            }
        })(req, res);
    } else { return res.json( { success: false, message: 'Hiányzó email vagy jelszó!' } ); }
});

// Regisztrálási felület betegek számára
router.route('/registerPatient').get((req, res) => {
    return res.json( { success: true, message: 'Itt lehet regisztrálni betegek számára!' } );
});

// Regisztrálási felület betegek számára
router.route('/registerPatient').post((req, res) => {

    if(req.body.email && req.body.age && req.body.gender && req.body.email && req.body.password && req.body.doctor) {

        const patient = new patientModel({
            name: req.body.name,
            age: req.body.age,
            gender: req.body.gender,
            email: req.body.email,
            password: req.body.password,
            doctor: req.body.doctor
        });

        patient.save(function(error) {
            if(error) return res.json( { success: false, message: 'Sikertelen regisztracio! Hiba: '+ error } );
            return res.json( { success: true, message: 'Sikeres regisztráció!!' } );
        });
        
    } else { return res.json( { success: false, message: 'Sikertelen regisztráció! Valamely adat hiányzik!' } ); }
});

// Regisztrálási felület orvosok számára
router.route('/registerDoctor').get((req, res) => {
    return res.json( { success: true, message: 'Itt lehet regisztrálni orvosok számára!' } );
});

// Regisztrálási felület orvosok számára
router.route('/registerDoctor').post((req, res) => {

    if(req.body.email && req.body.age && req.body.gender && req.body.email && req.body.password && req.body.profession) {

        const doctor = new doctorModel({
            name: req.body.name,
            age: req.body.age,
            gender: req.body.gender,
            email: req.body.email,
            password: req.body.password,
            profession: req.body.profession
        });

        doctor.save(function(error) {
            if(error) return res.json( { success: false, message: 'Sikertelen regisztracio! Hiba: ' + error } );
            return res.json( { success: true, message: 'Sikeres regisztráció!' } );
        });
        
    } else { return res.json( { success: false, message: 'Sikertelen regisztráció! Valamely adat hiányzik!' } ); }
});

// Kijelentkezes
router.route('/logout').post((req, res) => {
    if(req.isAuthenticated()) {
        req.logout();
        return res.json( { success: true, message: 'Sikeres kijelentkezes!' } );
    } else { return res.json( { success: false, message: 'Elobb be kell jelentkezni, hogy utana kijelentkezhess!' } ); }
});

// Betegek listázása (csak orvos szamara)
router.route('/doctor/patientsList').get((req, res) => {
    if(req.isAuthenticated()) {
        // Ha orvos
        if(req.user.profession){
            patientModel.find({ doctor: req.user.name }, function(err, patients) {
                if(err) return res.json( { success: false, message: 'Hiba a listazas folyaman!' + err } );
                return res.json( { success: true, message: patients } );
            });
        } else { return res.json( { success: false, message: 'Nincs jogosultsaga az oldalhoz! Ehhez be kell jelentkeznie!' } ); }
    } else { return res.json( { success: false, message: 'Ehhez be kell jelentkeznie!' } ); }
});

// Kivalasztott beteg mereseinek listazasa
router.route('/doctor/:patient').get((req, res) => {
    if(req.isAuthenticated()) {
        // Ha orvos
        if(req.user.profession){
            // Paciens neve, amiszerint kiolvassuk a mereseket es kilistazzuk
            var patient = req.params.patient;

            measurementModel.find({ patient: patient }, function(err, measurements) {
                if(err) return res.json( { success: false, message: 'Hiba a meresek listazasa folyaman!' + err } );
                return res.json( { success: true, message: measurements } );
            });
        } else { return res.json( { success: false, message: 'Nincs jogosultsaga az oldalhoz! Ehhez be kell jelentkeznie!' } ); }
    } else { return res.json( { success: false, message: 'Ehhez be kell jelentkeznie!' } ); }
});

// Beteg mereseinek listázása (csak beteg szamara)
router.route('/patient/measurementsList').get((req, res) => {
    if(req.isAuthenticated()) {
        // Ha beteg
        if(req.user.doctor){
            measurementModel.find({ patient: req.user.name }, function(err, measurements) {
                if(err) return res.json( { success: false, message: 'Hiba a listazas folyaman!' + err } );
                return res.json( { success: true, message: measurements } );
            });
        } else { return res.json( { success: false, message: 'Nincs jogosultsaga az oldalhoz! Ehhez be kell jelentkeznie!' } ); }
    } else { return res.json( { success: false, message: 'Ehhez be kell jelentkeznie!' } ); }
});

// Beteg meresenek hozzaadasa
router.route('/patient/addMeasurement').post((req, res) => {
    if(req.isAuthenticated()) {
        // Ha beteg
        if(req.user.doctor){

            if(req.user.name && req.body.bloodPressure && req.body.bloodSugar && req.body.date && req.body.weight && req.body.comment) {

                const measurement = new measurementModel({
                    patient: req.user.name,
                    bloodPressure: req.body.bloodPressure,
                    bloodSugar: req.body.bloodSugar,
                    weight: req.body.weight,
                    date: req.body.date,
                    comment: req.body.comment
                });
        
                measurement.save(function(error) {
                    if(error) { return res.json( { success: false, message: 'Sikertelen mentes! Hiba: ' + error } ); }
                    else {
                        // Email elkuldesehez ki kell vadaszni a beteg orvosanak email cimet
                        doctorModel.findOne({ name: req.user.doctor }, function(err, doctor){
                            if(err) return done('Hiba az orvos keresése során!', undefined)
                            if(doctor) {

                                return res.json({ success: true, message:'Sikeres hozzadas'});
                                /*
                                // Email kuldese
                                const transporter = nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                        user: 'youremail@gmail.com',
                                        pass: 'yourpassword'
                                    }
                                });

                                const mailOptions = {
                                    from: 'youremail@gmail.com',
                                    to: doctor.email,
                                    subject: 'Uj meres feltoletese',
                                    text: 'Uj merest toltott fel a ' + req.user.name + ' nevu felhasznalo!'
                                };

                                transporter.sendMail(mailOptions, function(error, info){
                                    if (error) { console.log(error); }
                                    else { 
                                        return res.json( { success: true, message: 'Sikeres mentes!' } );
                                        console.log('Email elküldve: ' + info.response); }
                                });
                                */
                            } else  { return res.json( { success: false, message: 'Hibás vagy nem létező felhasználónév!' } ); }
                        });
                        
                    }
                    
                });
                
            } else { return res.json( { success: false, message: 'Sikertelen mentes! Valamely adat hiányzik!' } ); }

        } else { return res.json( { success: false, message: 'Nincs jogosultsaga az oldalhoz! Ehhez be kell jelentkeznie!' } ); }
    } else { return res.json( { success: false, message: 'Ehhez be kell jelentkeznie!' } ); }
});

module.exports = router;