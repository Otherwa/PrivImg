const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 14400 });
const moment = require('moment');
const User = require('../../config/model/user')
const sharp = require('sharp');

// * cache key
// ! Compression middleware
const postImageUpload = async (req, res, next) => {
    try {
        // * cache key
        const curuser = {
            userId: req.cookies.userId,
            email: req.cookies.email,
            accountCreatedAt: req.cookies.accountCreatedAt
        };

        const cacheKey = `userImages_${curuser.userId}`;
        // *

        const compressedImageArray = JSON.parse(req.body.compressedImages);
        if (compressedImageArray.length === 0) {
            return res.status(400).json({ status: 400, error: 'No image files provided' });
        }

        const newImages = [];

        for (const compressedImageBase64 of compressedImageArray) {
            const compressedImageBuffer = Buffer.from(compressedImageBase64, 'base64');

            const processedImageBuffer = await sharp(compressedImageBuffer)
                .jpeg({ quality: 49 }) // Adjust the compression quality as needed
                .toBuffer();

            const processedImageBase64 = processedImageBuffer.toString('base64');

            newImages.push({
                imageUrl: processedImageBase64,
                uploadedAt: new Date(),
            });
        }

        // Find the user by ID and update the images sub-array using $push
        const updatedUser = await User.findOneAndUpdate(
            { _id: curuser.userId },
            { $push: { images: { $each: newImages } } },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(404).json({ status: 404, error: 'User not found' });
        }

        const processedImages = updatedUser.images.map((image) => ({
            ...image.toObject(),
            uploadedAt: moment(image.uploadedAt).format("LL"),
        }));

        const groupedImages = {};

        processedImages.forEach((image) => {
            if (!groupedImages[image.uploadedAt]) {
                groupedImages[image.uploadedAt] = [];
            }
            groupedImages[image.uploadedAt].push(image);
        });

        // Create an array to store the divs for each date
        const dateDivs = [];

        // Sort the dates in descending order (most recent first)
        const sortedDates = Object.keys(groupedImages).sort((a, b) => {
            const dateA = moment(a, "LL");
            const dateB = moment(b, "LL");
            return dateB - dateA;
        });

        // Render images grouped by date
        sortedDates.forEach((date) => {
            const imagesForDate = groupedImages[date];

            // Create a div for each date
            const dateDiv = {
                date: date,
                images: imagesForDate,
            };

            dateDivs.push(dateDiv);
        });

        // Cache the processed images for 2 hours
        cache.set(cacheKey, dateDivs);


        res.status(200).json({ status: 200 });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ status: 500, error: 'Image upload error' });
    }

};

const cacher = (processedImages, req, res, next) => {
    // * cache key
    const curuser = {
        userId: req.cookies.userId,
        email: req.cookies.email,
        accountCreatedAt: req.cookies.accountCreatedAt
    };

    const cacheKey = `userImages_${curuser.userId}`;
    // *

    const groupedImages = {};
    processedImages.forEach((image) => {
        if (!groupedImages[image.uploadedAt]) {
            groupedImages[image.uploadedAt] = [];
        }
        groupedImages[image.uploadedAt].push(image);
    });

    // Create an array to store the divs for each date
    const dateDivs = [];

    // Sort the dates in descending order (most recent first)
    const sortedDates = Object.keys(groupedImages).sort((a, b) => {
        const dateA = moment(a, "LL");
        const dateB = moment(b, "LL");
        return dateB - dateA;
    });

    // Render images grouped by date
    sortedDates.forEach((date) => {
        const imagesForDate = groupedImages[date];

        // Create a div for each date
        const dateDiv = {
            date: date,
            images: imagesForDate,
        };

        dateDivs.push(dateDiv);
    });

    // Cache the processed images for 2 hours
    cache.set(cacheKey, dateDivs);

    return dateDivs;
}

module.exports = { postImageUpload, cacher };