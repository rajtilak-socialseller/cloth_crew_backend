
// src/api/post/postRoutes.js
const router = require('express').Router();
const StoreRBAC = require('../../../middlewares/StoreRBAC');
const marqueeController = require('../controllers/marquee');
const { validateRequest } = require('../middlewares/marquee');


const permissions = [
    {
        api: "marquees",
        endpoint: "/api/marquees",
        method: "POST",
        handler: "Create marquee",
    },
    {
        api: "marquees",
        endpoint: "/api/marquees",
        method: "GET",
        handler: "List marquees",
    },
    {
        api: "marquees",
        endpoint: "/api/marquees/:id",
        method: "GET",
        handler: "Find marquee",
    },
    {
        api: "marquees",
        endpoint: "/api/marquees/:id",
        method: "PUT",
        handler: "Update marquee",
    },
    {
        api: "marquees",
        endpoint: "/api/marquees/:id",
        method: "DELETE",
        handler: "Delete marquee",
    },
];

module.exports = (app) => {
    router.post('/', [StoreRBAC, validateRequest], marqueeController.create);
    router.get('/', marqueeController.find);
    router.get('/:id', marqueeController.findOne);
    router.put('/:id', [StoreRBAC, validateRequest], marqueeController.update);
    router.delete('/:id', [StoreRBAC], marqueeController.delete);
    app.use('/api/marquees', router)
}
module.exports.permissions = permissions
