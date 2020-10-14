# Node-Shopping-Website

This is a shopping website built using node js as server side language on MVC pattern. It lets you register, login, create products, edit them and upload their images. Server responses with server-side rendered html files using ejs templating engines. MongoDB is used as database.

---

## Tools and Technologies:

* **Technology** : MVC pattern, Javascript, NodeJS, EJS templating engine for server-side rendering
* **Cloud Service Provider**: Heroku
* **Database** : MongoDB
* **CDN for Image Data** : Cloudinary

---

## Functionalities:

1. User can register himself

2. **CRUD Operations**:

* User can add product to his cart
* User can delete the products in his cart
* User can order the products in his cart
* User can generate invoice pdfs for the orders he created and download them

* User can add product to the global product list
* User can upload image for the product
* User can edit the product details for the ones he added
* User can delete the product from the list

3. **Security**:

* Website is immune to Cross Site Forgery Request
* One user cannot create, update or delete data on behalf of other user
* User can change their password through e-mail

4. **Error**:
* 404 page is served if user tries to load unrecognized route
* 500 page is served if something wrong happens on the server side

---

#### Project will be updated in future to have a ReactJS frontend