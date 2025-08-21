
// src/api/post/postRoutes.js
const router = require('express').Router();
const storyController = require('../controllers/story');

// Define routes for the "Post" resource
module.exports = (app) => {
    router.post('/', storyController.create);
    router.get('/', storyController.find);
    router.get('/:id', storyController.findOne);
    router.put('/:id', storyController.update);
    router.delete('/:id', storyController.delete);
    app.use('/api/stories', router)
}
