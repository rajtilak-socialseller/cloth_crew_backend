
// src/api/post/postRoutes.js
const router = require('express').Router();
const product_reviewController = require('../controllers/product_review');

// Define routes for the "Post" resource
module.exports = (app) => {
    router.post('/', product_reviewController.create);
    router.get('/', product_reviewController.find);
    router.get('/products/:id', product_reviewController.findByProduct);
    router.put('/:id', product_reviewController.update);
    router.delete('/:id', product_reviewController.delete);
    app.use('/api/product-reviews', router)
}
