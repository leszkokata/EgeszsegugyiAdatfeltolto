const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Séma definiálása
const PatientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    doctor: {
        type: String,
        required: true
    }
})

// Mentés előtt a páciens jelszavának titkositasa
PatientSchema.pre('save', function(next) {
    const patient = this;
    if(patient.isModified('password')) {
        bcrypt.genSalt(10, function(error, salt) {
            if(error) return next('Hiba a bcrypt generálás közben!')
            bcrypt.hash(patient.password, salt, function(error, hash) {
                if(error) return next('Hiba a jelszó hashelése során!')
                patient.password = hash;
                return next();
            })
        })
    } else {
        console.log('A jelszó nem változott, nem kellett hashelni!');
        return next();
    }
}) 

// Ket jelszó ellenőrzese
PatientSchema.methods.comparePasswords = function(password, next) {
    bcrypt.compare(password, this.password, function(error, isMatch) {
        return next(error, isMatch);
    })
}

mongoose.model('patient', PatientSchema);