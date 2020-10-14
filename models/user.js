const mongodb = require('mongodb');

const mongo = require('../util/database');

class User {
  constructor(userDetails) {
    this.name = userDetails.name;
    this.email = userDetails.email;
    this.cart = userDetails.cart;
    this.password = userDetails.password;
    if (userDetails.id) this._id = userDetails.id;
  }

  save() {
    const db = mongo.getDB();
    return db
      .collection('users')
      .insertOne(this)
      .then(result => {
        this._id = result.ops[0]._id;
        return result;
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  static findById(userId) {
    const db = mongo.getDB();
    return db
      .collection('users')
      .findOne({
        _id: new mongodb.ObjectId(userId)
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  static findByName(userName) {
    const db = mongo.getDB();
    return db
      .collection('users')
      .findOne({
        name: userName
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  static findOrderById(orderId) {
    const db = mongo.getDB();
    return db
      .collection('orders')
      .findOne({
        _id: new mongodb.ObjectId(orderId)
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  addToCart(product) {
    const db = mongo.getDB();
    if (!this.cart) {
      const cart = {
        items: [{
          productId: product._id,
          quantity: 1
        }]
      }
      return db
        .collection('users')
        .updateOne({
          _id: new mongodb.ObjectId(this._id)
        }, {
          $set: {
            cart: cart
          }
        })
        .catch(err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        })
    }
    const updatedCart = {
      ...this.cart
    };
    const cartProductIndex = updatedCart.items.findIndex(cp => cp.productId.equals(product._id));
    if (cartProductIndex === -1) {
      updatedCart.items.push({
        productId: new mongodb.ObjectId(product._id),
        quantity: 1
      })
    } else {
      updatedCart.items[cartProductIndex].quantity++;
    }
    return db
      .collection('users')
      .updateOne({
        _id: new mongodb.ObjectId(this._id)
      }, {
        $set: {
          cart: updatedCart
        }
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  getCartProducts() {
    const db = mongo.getDB();
    const productIds = this.cart.items.map(item => new mongodb.ObjectId(item.productId));
    return db
      .collection('products')
      .find({
        _id: {
          $in: productIds
        }
      })
      .toArray()
      .then(cartItems => {
        // Mapping and returning cart products
        return cartItems.map(item => {
          return {
            ...item,
            quantity: this.cart.items.find(i => {
              return i.productId.equals(item._id);
            }).quantity
          }
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  deleteById(productId) {
    const updatedCartItems = this.cart.items.filter(item => !item.productId.equals(productId));
    const db = mongo.getDB();
    return db
      .collection('users')
      .updateOne({
        _id: new mongodb.ObjectId(this._id)
      }, {
        $set: {
          cart: {
            items: updatedCartItems
          }
        }
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  addOrder() {
    const db = mongo.getDB();
    return this.getCartProducts()   // get the products in the cart and
      .then(products => {
        const order = {
          items: products,
          user: {
            _id: new mongodb.ObjectId(this._id),
            name: this.name
          },
          orderDate: new Date()
        }
        return db
          .collection('orders')
          .insertOne(order);
      })
      .then(() => {   // empty the cart after the order is placed
        return db
          .collection('users')
          .updateOne({
            _id: this._id
          }, {
            $set: {
              cart: {
                items: []
              }
            }
          })
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }

  getOrders() {
    const db = mongo.getDB();
    return db
      .collection('orders')
      .find({
        'user._id': new mongodb.ObjectId(this._id)
      })
      .toArray()
      .then(orders => {
        return orders;
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      })
  }
}

module.exports = User;