// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    images: [
        {
            imageUrl: String,
            uploadedAt: Date
        }
    ]
}, {
    timestamps: true // Add timestamps fields: createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);

module.exports = User;
