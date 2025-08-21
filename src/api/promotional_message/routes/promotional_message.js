
// src/api/post/postRoutes.js
const router = require('express').Router();
const promotional_messageController = require('../controllers/promotional_message');
const { validateRequest } = require('../middlewares/promotional_message');

// Define routes for the "Post" resource
const permissions = [
    {
        api: "promotional-messages",
        endpoint: "/api/promotional-messages",
        method: "POST",
        handler: "Create Plan",
    },
    {
        api: "promotional-messages",
        endpoint: "/api/promotional-messages",
        method: "GET",
        handler: "List promotional-messages",
    },
    {
        api: "promotional-messages",
        endpoint: "/api/promotional-messages/:id",
        method: "GET",
        handler: "Find Plan",
    },
    {
        api: "promotional-messages",
        endpoint: "/api/promotional-messages/:id",
        method: "PUT",
        handler: "Update Plan",
    },
    {
        api: "promotional-messages",
        endpoint: "/api/promotional-messages/:id",
        method: "DELETE",
        handler: "Delete Plan",
    },
];
module.exports = (app) => {
    router.post('/', [validateRequest], promotional_messageController.create);
    router.get('/', promotional_messageController.find);
    router.get('/:id', promotional_messageController.findOne);
    router.put('/:id', [validateRequest], promotional_messageController.update);
    router.delete('/:id', [], promotional_messageController.delete);
    app.use('/api/promotional-messages', router)
}
