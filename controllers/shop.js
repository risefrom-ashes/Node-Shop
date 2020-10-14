const Product = require('../models/product');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');
const pdfkit = require('pdfkit');

const itemsPerPage = 2;

exports.getIndex = (req, res, next) => {
  let currPage = +req.query.page;
  if (!currPage) {
    currPage = 1;
  }

  Product.collectionCount('products')
    .then(count => {
      const totalPages = count / itemsPerPage + (count % itemsPerPage ? 1 : 0);
      const firstDisplay = Math.max(currPage-2, 1);
      const lastDisplay = Math.min(currPage+2, totalPages);
      Product.fetchAll()
        .skip((currPage - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .toArray()
        .then(products => {
          res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
            lastPage: totalPages,
            currPage: currPage,
            firstDisplay: firstDisplay,
            lastDisplay: lastDisplay,
          });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        })
    })
};

exports.getProducts = (req, res, next) => {
  let currPage = +req.query.page;
  if (!currPage) {
    currPage = 1;
  }
  Product.collectionCount('products')
    .then(count => {
      const totalPages = count / itemsPerPage + (count % itemsPerPage ? 1 : 0);
      const firstDisplay = Math.max(currPage-2, 1);
      const lastDisplay = Math.min(currPage+2, totalPages);
      Product.fetchAll()
        .skip((currPage - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .toArray()
        .then(products => {
          res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products',
            lastPage: totalPages,
            currPage: currPage,
            firstDisplay: firstDisplay,
            lastDisplay: lastDisplay,
          });
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        })
    })
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      return res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.getCartProducts = (req, res, next) => {
  return req.user.getCartProducts()
    .then(cartItems => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: cartItems
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.postCartProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect('/');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.postCartDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  req.user.deleteById(productId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.postOrders = (req, res, next) => {
  req.user.addOrder()
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.getOrders = (req, res, next) => {
  req.user.getOrders()
    .then((orders) => {
      res.render('shop/orders.ejs', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  User
    .findOrderById(orderId)
    .then(order => {
      console.log(order);
      if (!order) {
        return next(new Error('No order found'));
      }
      if (order.user._id.toString() !== req.user._id.toString()) {
        return next(new Error('You are accessing wrong orders'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('invoices', invoiceName);

      // Streaming the data instead of loading it in the memory
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')

      const pdfDoc = new pdfkit();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(26).text('Invoice', {
        align: 'center'
      });
      pdfDoc.fontSize(20).text('----------------------------------------------------------------------', {
        align: 'center'
      })
      let cnt = 1;
      let priceTotal = 0;
      order.items.forEach(item => {
        pdfDoc.fontSize(12).text(cnt + ') ' + 'Item Name: ' + item.title + '  -  ' + 'Item Quantity: ' + item.quantity + '  -  ' + 'Item Total: ' + item.quantity * item.price, {
          align: 'left'
        })
        cnt++;
        priceTotal += item.quantity * item.price;
      })
      pdfDoc.fontSize(20).text('----------------------------------------------------------------------', {
        align: 'center'
      })
      pdfDoc.fontSize(16).text('Total Price: $ ' + priceTotal.toFixed(2), {
        align: 'center'
      });
      pdfDoc.end();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}