const Product = require('../models/product');
const validator = require('express-validator');
const deleteFile = require('../util/deleteFile');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: `${process.env.cloud_name}`,
  api_key: `${process.env.cloud_api_key}`,
  api_secret: `${process.env.cloud_api_secret}`
})

exports.getAddProduct = (req, res, next) => {  // The page for products upload
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    product: {
      title: "Add title",
      description: "Add description",
      price: "Add price",
      imageUrl: "Add url"
    },
    errorMessage: req.flash('error'),
    validationErrors: [],
  });
};

exports.getProducts = (req, res, next) => {  // The page for all admin products
  Product.fetchAllFromUserId(req.user._id)
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.postAddProduct = (req, res, next) => {  // When form is submitted for posting the product
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const userId = req.user._id;
  const errors = validator.validationResult(req);

  // Some general error
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  // error with image
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errorMessage: 'Attached image not of png, jpg, or jpeg format',
      validationErrors: [],
    });
  }
  const product = {
    title: title,
    price: price,
    description: description,
    imageUrl: image.path,
    userId: userId,
  }

  cloudinary.uploader.upload(image.path, (err, result) => {
    if (err) {
      throw 'cant upload to cloudinary';
    } else {
      deleteFile(image.path, next);
      product.imageUrl = result.url;
      product.public_id = result.public_id;
      const newProduct = new Product(product);
      newProduct.save()
        .then(() => {
          res.redirect('/admin/products');
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        })
    }
  })
};


exports.getEditProduct = (req, res, next) => {
  const editMode = (req.query.edit === "true");
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: req.flash('error'),
        validationErrors: [],
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedProduct = {
    title: req.body.title,
    price: req.body.price,
    description: req.body.description
  }
  const errors = validator.validationResult(req);
  const image = req.file;

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing: true,
      hasError: true,
      product: {
        ...updatedProduct,
        _id: productId
      },
      errorMessage: 'Attached image not of png, jpg, or jpeg format',
      validationErrors: [],
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing: true,
      hasError: true,
      product: {
        ...updatedProduct,
        _id: productId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  cloudinary.uploader.upload(image.path, (err, result) => { // uploading local asset
    if (err) {
      throw 'cant upload to cloudinary';
    } else {
      deleteFile(image.path, next); // delete local asset
      updatedProduct.imageUrl = result.url; // updating the product image url
      updatedProduct.public_id = result.public_id; // updating the result public_id
      Product.findById(productId)
        .then((product) => {
          cloudinary.uploader.destroy(product.public_id, (err, result) => {
            if (result.result === 'ok') {
              Product.updateOneById(productId, updatedProduct, req.user._id)
                .then(() => {
                  res.redirect('/admin/products');
                })
            } else {
              throw 'unable to edit please try again';
            }
          });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        })
    }
  })
}

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found'));
      }
      cloudinary.uploader.destroy(product.public_id, (err, result) => {
        if (result.result === 'ok') {
          Product.deleteOneById(productId, req.user._id)
            .then(() => {
              res.status(200).json({
                message: 'Product Deleted'
              });
            })
        } else {
          throw 'unable to delete, please try again';
        }
      });
    })
    .catch(err => {
      res.status(500).json({
        message: 'Deletion Failed'
      });
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}