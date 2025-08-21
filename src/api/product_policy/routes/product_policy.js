
const router = require('express').Router();
const { create, find, findOne, update, destroy } = require('../controllers/product_policy');
const { validateRequest } = require('../middlewares/product_policy');

const permissions = [
    {
        api: "product-policies",
        endpoint: "/api/product-policies",
        method: "POST",
        handler: "Create Product Policy",
    },
    {
        api: "product-policies",
        endpoint: "/api/product-policies",
        method: "GET",
        handler: "List Product Policies",
    },
    {
        api: "product-policies",
        endpoint: "/api/product-policies/:id",
        method: "GET",
        handler: "List Single Product Policies",
    },
    {
        api: "product-policies",
        endpoint: "/api/product-policies/:id",
        method: "PUT",
        handler: "Update Product Policies",
    },
    {
        api: "product-policies",
        endpoint: "/api/product-policies/:id",
        method: "DELETE",
        handler: "Delete Product Policies",
    },
];
module.exports = (app) => {
    router.post('/', [validateRequest], create);
    router.get('/', find);
    router.get('/:id', findOne);
    router.put('/:id', [validateRequest], update);
    router.delete('/:id', destroy);
    app.use('/api/product-policies', router)
}
module.exports.permissions = permissions