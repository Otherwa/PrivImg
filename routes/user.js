const express = require('express');
const router = express.Router();
const { connect } = require('../config/config')
const Auth = require('../config/auth');
const bcrypt = require('bcrypt');
const User = require('../config/model/user')
const jwt = require('jsonwebtoken');
const moment = require('moment');
const NodeCache = require("node-cache");
const mongoose = require('mongoose');
/* GET users listing. */
const multer = require('multer');

const cache = new NodeCache({ stdTTL: 14400 });
const upload = multer(); // Create a multer instance


// ! middlewares
const { postImageUpload, cacher } = require('./middleware/middleware');

// Await Connection
(async () => {
  await connect();
})();

router.route('/auth/login')
  .get((req, res, next) => {
    res.render('auth/login', { title: "Login" });
  })
  .post(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.render('auth/login', { title: "Login", error: "Invalid email or password" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.render('auth/login', { title: "Login", error: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });


      // Set the token as a cookie or in the response header as needed
      res.cookie('token', token, { maxAge: 3600000 });
      res.cookie('userId', user._id, { maxAge: 3600000 });
      res.cookie('email', user.email, { maxAge: 3600000 });
      res.cookie('accountCreatedAt', moment(user.createdAt).format('LL'), { maxAge: 3600000 });

      res.redirect('/user/dashboard');
    } catch (error) {
      next(error);
    }
  });


router.route('/auth/register')
  .get((req, res, next) => {
    res.render('auth/register', { title: "Register" });
  })
  .post(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();

      res.redirect('/user/auth/login'); // Redirect to the login page after successful registration
    } catch (error) {
      next(error); // Pass the error to the error handling middleware
    }
  });


router.route('/dashboard')
  .get(Auth, async (req, res, next) => {
    const curuser = {
      userId: req.cookies.userId,
      email: req.cookies.email,
      accountCreatedAt: req.cookies.accountCreatedAt
    };
    const cacheKey = `userImages_${curuser.userId}`;
    console.log(curuser);
    // Check if the dateDivs are already cached
    const cachedDateDivs = cache.get(cacheKey);

    if (cachedDateDivs) {
      console.log("Using cached dateDivs");
      return res.render('user/dashboard', { User: curuser, dateDivs: cachedDateDivs });
    }

    try {
      const user = await User.findOne({ _id: curuser.userId }).limit(1);

      if (!user) {
        return res.status(404).send('User not found');
      }

      const processedImages = user.images.map((image) => ({
        ...image.toObject(),
        uploadedAt: moment(image.uploadedAt).format("LL"),
      }));


      // ? Create an array to store the divs for each date return from cacher middleware
      const dateDivs = cacher(processedImages, req, res, next);

      // Cache the processed images for 2 hours
      cache.set(cacheKey, dateDivs);

      res.render('user/dashboard', { User: curuser, dateDivs: dateDivs });
    } catch (error) {
      console.error('Error fetching user images:', error);
      res.status(500).send('Internal Server Error');
    }
  })
  .delete(Auth, async (req, res) => {
    try {
      const userId = curuser.userId;
      const imageIdToDelete = req.body.imageId; // Assuming you pass the imageId in the request body

      const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $pull: { images: { _id: imageIdToDelete } } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ status: 404, message: 'User not found' });
      }

      // Format timestamps in images
      updatedUser.images.forEach((image) => {
        image.uploadedAtFormatted = moment(image.uploadedAt).format("MMM Do YYYY");
      });

      res.status(200).json({ status: 200, user: updatedUser });
    } catch (error) {
      console.error('Image deletion error:', error);
      res.status(500).json({ status: 500, error: 'Image deletion error' });
    }
  })

// view
router.get('/dashboard/image/:id', async (req, res, next) => {
  try {
    const curuser = {
      userId: req.cookies.userId,
      email: req.cookies.email,
      accountCreatedAt: req.cookies.accountCreatedAt
    };
    const userId = curuser.userId;
    const imageId = req.params.id;
    const cacheKey = `userImage_${userId}_${imageId}`;

    // Check if the image is already cached
    const cachedImage = cache.get(cacheKey);
    if (cachedImage) {
      console.log("Using cached image");
      return res.status(200).render('user/img', { User: curuser, image: cachedImage });
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    const image = user.images.find(img => img._id.toString() === imageId);
    if (!image) {
      return res.status(404).json({ status: 404, message: 'Image not found' });
    }

    // Process timestamp
    const processedImage = {
      ...image.toObject(),
      uploadedAt: moment(image.uploadedAt).format('LL')
    };

    // Cache the processed image for 2 hours
    cache.set(cacheKey, processedImage);

    res.status(200).render('user/img', { User: curuser, image: processedImage });
  } catch (error) {
    console.error('Image retrieval error:', error);
    res.status(500).json({ status: 500, error: 'Image retrieval error' });
  }
});

// delete
router.delete('/dashboard/image/:id', async (req, res, next) => {
  try {
    const curuser = {
      userId: req.cookies.userId,
      email: req.cookies.email,
      accountCreatedAt: req.cookies.accountCreatedAt
    };
    const userId = curuser.userId;
    const imageId = req.params.id;

    // Convert the imageId to a Mongoose ObjectId instance
    const imageObjectId = new mongoose.Types.ObjectId(imageId);


    // Find the user and update the images array
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { images: { _id: imageObjectId } } },
      { new: true }
    );

    // Cache the updated user's images
    // Cache the updated user's images
    const cacheKey = `userImages_${curuser.userId}`;
    const processedImages = updatedUser.images.map((image) => ({
      ...image.toObject(),
      uploadedAt: moment(image.uploadedAt).format("LL"),
    }));

    // ? Create an array to store the divs for each date return from cacher middleware
    const dateDivs = cacher(processedImages, req, res, next);

    // Cache the processed images for 2 hours
    cache.set(cacheKey, dateDivs);

    if (!updatedUser) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    res.status(200).json({ status: 200, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({ status: 500, error: 'Image deletion error' });
  }
});


router.route('/upload')
  .get(Auth, (req, res) => {
    const curuser = {
      userId: req.cookies.userId,
      email: req.cookies.email,
      accountCreatedAt: req.cookies.accountCreatedAt
    };
    res.status(200).render('user/upload', { User: curuser });
  })



router.post('/upload', Auth, upload.single('compressedImage'), postImageUpload);


// ? logout
router.get('/auth/logout', (req, res) => {
  // Clear the token from the client's browser by setting it to an expired value
  res.clearCookie('token');
  res.clearCookie('user');
  // Redirect to a desired location after logout
  res.redirect('/user/auth/login');
});


// ? AJAX CAll
router.get('/getimages', (req, res) => {
  // Check if the image exists and send it
  res.json({ 'status': 200 });

});

module.exports = router;
