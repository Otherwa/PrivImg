const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token || ''; // Get the token from the cookie or header as needed

    if (token) {
        try {
            const decoded = jwt.verify(token, 'Tatakae'); // Verify the token
            req.userId = decoded.userId; // Store the user ID in the request object
            return res.redirect('/user/dashboard');
        } catch (error) {
            return res.redirect('/user/auth/login'); // Redirect to login if token verification fails
        } // Redirect to login if no token is present
    }
    next()
};

module.exports = verifyToken;
