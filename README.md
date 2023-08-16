# Privimage - Self Hosted Image Storage Solution

Privimage is a self-hosted image storage solution built using Node.js and MongoDB. It allows you to securely store and retrieve images in a base64 compressed format, making them easy to access and transmit. This README provides an overview of the installation process and basic usage instructions.

## Features

- Securely store images on your own server.
- Images are stored in a base64 compressed format for efficient storage and transmission.
- Easy-to-use API for uploading, retrieving, and deleting images.
- Utilizes MongoDB for efficient image management and retrieval.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/privimage.git
   cd privimage
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure MongoDB:**

   Update the `config.js` file with your MongoDB connection settings.

4. **Start the Server:**

   ```bash
   npm start
   ```

   The server will start and listen on the specified port (default: 3000).

## API Endpoints

- **POST /upload**

  Upload a new image. Provide the image data in the request body.

- **GET /image/:id**

  Retrieve an image by its ID.

- **DELETE /image/:id**

  Delete an image by its ID.

## Usage

### Uploading an Image

```bash
curl -X POST -H "Content-Type: application/json" -d '{"imageData": "base64ImageData"}' http://localhost:3000/upload
```

Replace `base64ImageData` with the actual base64-encoded image data.

### Retrieving an Image

Open the following URL in your browser or use a tool like `curl`:

```
http://localhost:3000/image/imageId
```

Replace `imageId` with the ID of the image you want to retrieve.

### Deleting an Image

```bash
curl -X DELETE http://localhost:3000/image/imageId
```

Replace `imageId` with the ID of the image you want to delete.

## Security

- **Authentication and Authorization:** Implement proper authentication and authorization mechanisms to secure your Privimage instance.
- **Secure MongoDB:** Ensure that your MongoDB instance is properly secured with authentication and access control.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project was inspired by the need for a simple, self-hosted image storage solution.
- Thanks to the Node.js and MongoDB communities for their amazing tools and resources.

---

Feel free to contribute to this project by submitting issues or pull requests. If you have any questions or need assistance, please reach out to us!

[GitHub Repository](https://github.com/Otherwa/PrivImg)
