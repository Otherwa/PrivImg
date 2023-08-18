const express = require('express');
const router = express.Router();
const { connect } = require('../config/config')
const Auth = require('../config/auth');
const preAuth = require('../config/preauth');
const bcrypt = require('bcrypt');
const User = require('../config/model/user')
const jwt = require('jsonwebtoken');
const moment = require('moment');
const sharp = require('sharp');
const NodeCache = require("node-cache");
/* GET users listing. */
const multer = require('multer');

const cache = new NodeCache({ stdTTL: 14400 });
const upload = multer(); // Create a multer instance

connect();

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

      // Create a JWT token
      const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });

      // user details
      req.session.user = {
        userId: user._id,
        email: user.email, // You can store more user-related information as needed
        accountCreatedAt: moment(user.createdAt).format('LL')
      };

      // Set the token as a cookie or in the response header as needed
      res.cookie('token', token); // You can also use res.setHeader('Authorization', `Bearer ${token}`);

      res.redirect('/user/dashboard'); // Redirect to the dashboard after successful login
    } catch (error) {
      next(error); // Pass the error to the error handling middleware
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
  .get(Auth, async (req, res) => {
    const cacheKey = `userImages_${req.session.user.userId}`;

    // Check if the images are already cached
    const cachedImages = cache.get(cacheKey);
    if (cachedImages) {
      console.log("Using cached images");
      return res.render('user/dashboard', { User: req.session.user, images: cachedImages });
    }

    try {
      const user = await User.findOne({ _id: req.session.user.userId }).limit(1); // Use limit(1) to get a single document

      if (!user) {
        return res.status(404).send('User not found');
      }

      // Process timestamps
      const processedImages = user.images.map((image) => ({
        ...image.toObject(),
        uploadedAt: moment(image.uploadedAt).format("LL"),
      }));

      // Cache the processed images for 2 hours
      cache.set(cacheKey, processedImages);

      res.render('user/dashboard', { User: req.session.user, images: processedImages });
    } catch (error) {
      console.error('Error fetching user images:', error);
      res.status(500).send('Internal Server Error');
    }
  })
  .delete(Auth, async (req, res) => {
    try {
      const userId = req.session.user.userId;
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
    const userId = req.session.user.userId;
    const imageId = req.params.id;
    const cacheKey = `userImage_${userId}_${imageId}`;

    // Check if the image is already cached
    const cachedImage = cache.get(cacheKey);
    if (cachedImage) {
      console.log("Using cached image");
      return res.status(200).render('user/img', { User: req.session.user, image: cachedImage });
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

    res.status(200).render('user/img', { User: req.session.user, image: processedImage });
  } catch (error) {
    console.error('Image retrieval error:', error);
    res.status(500).json({ status: 500, error: 'Image retrieval error' });
  }
});

// delete
router.delete('/dashboard/image/:id', async (req, res, next) => {
  try {
    const userId = req.session.user.userId;
    const imageId = req.params.id;


    // First, remove the image from the cache if it's cached
    const cacheKey = `userImage_${userId}_${imageId}`;
    cache.del(cacheKey);


    const updatedUser = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { images: { _id: imageId } } },
      { new: true }
    );

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
    res.status(200).render('user/upload', { User: req.session.user });
  })

// ! Compression middleware
const postImageUpload = async (req, res, next) => {
  try {
    if (!req.body.compressedImage) {
      return res.status(400).json({ status: 400, error: 'No image file provided' });
    }

    // Decode the base64 image data into a Buffer
    const compressedImageBuffer = Buffer.from(req.body.compressedImage, 'base64');

    // Process the image using sharp
    const processedImageBuffer = await sharp(compressedImageBuffer)
      .jpeg({ quality: 60 }) // Adjust the compression quality as needed
      .toBuffer();

    // Convert the processed image buffer back to base64
    const processedImageBase64 = processedImageBuffer.toString('base64');


    const newImage = {
      imageUrl: processedImageBase64, // Use the compressed image buffer
      uploadedAt: new Date(),
    };

    // Find the user by ID and update the images sub-array
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.session.user.userId },
      { $push: { images: newImage } },
      { new: true } // Return the updated document
    );

    res.status(200).json({ status: 200 });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ status: 500, error: 'Image upload error' });
  }
};

router.post('/upload', Auth, upload.single('compressedImage'), postImageUpload);

// ? logout
router.get('/auth/logout', (req, res) => {
  // Clear the token from the client's browser by setting it to an expired value
  res.clearCookie('token');
  // Redirect to a desired location after logout
  res.redirect('/user/auth/login');
});

module.exports = router;
