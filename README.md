# Privimage - Self Hosted Image Storage Solution

Privimage is a self-hosted image storage solution built using Node.js and MongoDB. It allows you to securely store and retrieve images in a base64 compressed format, making them easy to access and transmit. This README provides an overview of the installation process and basic usage instructions.

# SnapShots

![Screenshot 2023-08-26 203426](https://github.com/Otherwa/PrivImg/assets/67428572/7f33df3c-abf9-4699-bcfb-332d449004d5)

![Screenshot 2023-08-26 203227](https://github.com/Otherwa/PrivImg/assets/67428572/cc0838dc-9705-43ca-b72b-4eb5515149bb)


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

   ### Configuration

   MongoDB Configuration
1. Create a MongoDB Atlas account or log in to your existing account.
2. Create a new cluster or select an existing cluster.
3. In your cluster's dashboard, click on "Connect" to get your connection string.

Replace <username>, <password>, and <cluster_name> in the following connection string with your MongoDB Atlas credentials and cluster name:

```
MONGO=mongodb+srv://<username>:<password>@<cluster_name>.mongodb.net/?retryWrites=true&w=majority
Copy the updated connection string and paste it into your project's configuration, replacing the existing MONGO value.
```
### Application Secret Key
   Generate a strong and secure secret key for your application. This key will be used for encryption and security purposes.

   Replace <your_secret_key> with your generated secret key:

```
   SECRET_KEY=<your_secret_key>
   Copy the updated secret key and paste it into your project's configuration, replacing the existing SECRET_KEY value.
```

### Final Configuration
   After completing the MongoDB and secret key configurations, your configuration file (config.env or similar) should look like this:
```
   MONGO=mongodb+srv://<username>:<password>@<cluster_name>.mongodb.net/?retryWrites=true&w=majority
   SECRET_KEY=<your_secret_key>
SECRET_KEY=<your_secret_key>
   ```

5. **Start the Server:**

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
