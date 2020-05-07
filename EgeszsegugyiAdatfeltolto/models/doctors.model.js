const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Séma definiálása
const DoctorSchema = new mongoose.Schema({
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
    profession: {
        type: String,
        required: false
    }
})

// Mentés előtt az orvos jelszavának titkositasa
DoctorSchema.pre('save', function(next) {

    const doctor = this;

    if(doctor.isModified('password')) {
        bcrypt.genSalt(10, function(error, salt) {
            if(error) return next('Hiba a bcrypt generálás közben!')
            bcrypt.hash(doctor.password, salt, function(error, hash) {
                if(error) return next('Hiba a jelszó hashelése során!')
                doctor.password = hash;
                return next();
            })
        })
    } else {
        console.log('A jelszó nem változott, nem kellett hashelni!');
        return next();
    }
}) 

// Ket jelszó ellenőrzese
DoctorSchema.methods.comparePasswords = function(password, next) {
    bcrypt.compare(password, this.password, function(error, isMatch) {
        return next(error, isMatch);
    })
}

mongoose.model('doctor', DoctorSchema);