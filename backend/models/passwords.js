const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    site: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    URL: { type: String, required: false },
    category: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Password', passwordSchema);
