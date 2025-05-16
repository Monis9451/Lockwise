const mongoose = require('mongoose');

const FaceDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    faceDescriptors: {
        type: [[Number]],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('FaceData', FaceDataSchema);
