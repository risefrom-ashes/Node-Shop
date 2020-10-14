const express = require('express');

const shopController = require('../controllers/shop');

const authorizedPersonnelOnly = require('../security/authorizedPersonnelOnly');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct)

router.get('/cart', authorizedPersonnelOnly, shopController.getCartProducts);

router.post('/cart', authorizedPersonnelOnly, shopController.postCartProduct)

router.post('/cart-delete-item', authorizedPersonnelOnly, shopController.postCartDeleteProduct);

router.post('/order-cart', authorizedPersonnelOnly, shopController.postOrders);

router.get('/orders', authorizedPersonnelOnly, shopController.getOrders);

router.get('/orders/:orderId', authorizedPersonnelOnly, shopController.getInvoice);

module.exports = router;