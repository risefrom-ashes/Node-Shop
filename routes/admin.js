const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

const validator = require('express-validator');

const authorizedPersonnelOnly = require('../security/authorizedPersonnelOnly');

// /admin/add-product => GET
router.get('/add-product', authorizedPersonnelOnly, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', authorizedPersonnelOnly, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    validator
    .check('title', 'Title should be atleast 3 character long')
    .isLength({
      min: 3
    })
    .isString()
    .trim(),

    validator
    .check('price', 'Price should be float')
    .notEmpty()
    .isFloat()
    .trim(),

    validator
    .check('description', 'Description should be atleast 10 character long')
    .isLength({
      min: 10
    })
    .isString()
    .trim()
  ],
  authorizedPersonnelOnly,
  adminController.postAddProduct
);

// /admin/edit-product => GET
router.get('/edit-product/:productId', authorizedPersonnelOnly, adminController.getEditProduct);

// /admin/edit-product => POST
router.post('/edit-product', [
    validator
    .check('title', 'Title should be atleast 3 character long')
    .isLength({
      min: 3
    })
    .isString()
    .trim(),

    validator
    .check('price', 'Price should be float')
    .notEmpty()
    .isFloat()
    .trim(),

    validator
    .check('description', 'Description should be atleast 10 character long')
    .isLength({
      min: 10
    })
    .isString()
    .trim()
  ],
  authorizedPersonnelOnly,
  adminController.postEditProduct
);

// /admin/delete-product => POST
router.delete('/delete/:productId', authorizedPersonnelOnly, adminController.deleteProduct);

module.exports = router;