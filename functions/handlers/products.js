const { db } = require('../util/admin');

exports.getAllProducts = (request, response) => {
    db.collection('products').get()
        .then(data => {
            const products = [];
            data.forEach(product => {
                products.push({
                    productId: product.id,
                    price: product.data().price,
                    title: product.data().title,
                    description: product.data().description,
                    quantity: product.data().quantity,
                    openingTime: product.data().openingTime
                })
            });
            return response.json(products)
        })
        .catch(error => console.error(error))
};

exports.postProduct = (request, response) => {
    const newProduct = {
        price: request.body.price,
        title: request.body.title,
        description: request.body.description,
        quantity: request.body.quantity,
        openingTime: request.body.openingTime
    };
    //TODO check if the date is valid before adding to the database
    db.collection('products').add(newProduct)
        .then(doc => {
            return response.status(201).json({message :`${doc.id} was successfully created`});
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({error: 'Something went wrong'})
        });
};

exports.getProduct = (request, response) => {
    let product = {};
    db.doc(`/products/${request.params.productId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return response.status(404).json({error: "Product not found"})
            }
            product = doc.data();
            product.id = doc.id;
            return response.json(product)
        })
        .catch(error => {
            console.error(error);
            return response.status(500).json({error: 'Something went wrong'});
        })
};