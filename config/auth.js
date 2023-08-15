const jwt = require('jsonwebtoken');
require('dotenv').config()
const verifyToken = (req, res, next) => {
    const token = req.cookies.token || ''; // Get the token from the cookie or header as needed

    if (!token) {
        return res.redirect('/user/auth/login'); // Redirect to login if no token is present
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY); // Verify the token
        req.userId = decoded.userId; // Store the user ID in the request object
        next(); // Continue to the next middleware or route handler
    } catch (error) {
        return res.redirect('/user/auth/login'); // Redirect to login if token verification fails
    }
};

module.exports = verifyToken;
