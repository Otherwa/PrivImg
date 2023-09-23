// // Function to fetch and append new images
// function fetchAndAppendImages() {
//     // Make a request to your Node.js server to get new images
//     fetch('/user/getimages')
//         .then(response => response.json())
//         .then(data => {
//             console.log(data)
//         });
// }

// // Set up the Intersection Observer
// const imagePlaceholder = document.getElementById('image-placeholder');
// const observer = new IntersectionObserver(entries => {
//     entries.forEach(entry => {
//         if (entry.isIntersecting) {
//             // Load new images when the placeholder is in the viewport
//             fetchAndAppendImages();
//         }
//     });
// });

// // Start observing the placeholder
// observer.observe(imagePlaceholder);



