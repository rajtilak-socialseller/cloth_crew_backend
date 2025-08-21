
// src/api/post/postRoutes.js
const router = require('express').Router();
const testimonialController = require('../controllers/testimonial');
const { validateRequest } = require('../middlewares/testimonial');

// Define routes for the "Post" resource
const permissions = [
    {
        api: "testimonials",
        endpoint: "/api/testimonials",
        method: "POST",
        handler: "Create testimonial",
    },
    {
        api: "testimonials",
        endpoint: "/api/testimonials",
        method: "GET",
        handler: "List testimonials",
    },
    {
        api: "testimonials",
        endpoint: "/api/testimonials/:id",
        method: "GET",
        handler: "Find One testimonial",
    },
    {
        api: "testimonials",
        endpoint: "/api/testimonials/:id",
        method: "PUT",
        handler: "Update testimonial",
    },
    {
        api: "testimonials",
        endpoint: "/api/testimonials/:id",
        method: "DELETE",
        handler: "Delete testimonial",
    },
];
module.exports = (app) => {
    router.post('/', [validateRequest], testimonialController.create);
    router.get('/', testimonialController.find);
    router.get('/:id', testimonialController.findOne);
    router.put('/:id', [validateRequest], testimonialController.update);
    router.delete('/:id', testimonialController.delete);
    app.use('/api/testimonials', router)
}
module.exports.permissions = permissions;
