const mongoose = require('mongoose');

// Séma definiálása
const MeasurementSchema = new mongoose.Schema({
    patient: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    bloodPressure: {
        type: Number,
        required: true
    },
    bloodSugar: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
        required: true
    }
})

mongoose.model('measurement', MeasurementSchema);