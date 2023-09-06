const express = require("express");
const cors = require("cors");

require("./db/config");

const User = require("./db/User");
const Product = require("./db/Product");

const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  let user = new User(req.body);
  let result = await user.save();
  //remove password from returned object
  result = result.toObject();
  delete result.password;
  resp.send(result);
});

app.post("/login", async (req, resp) => {
  // validate correct authentication
  if (!req.body.password || !req.body.email)
    return resp.send({ result: "No User found" });

  // remove password from object
  let user = await User.findOne(req.body).select("-password");
  if (user) {
    resp.send(user);
  } else {
    resp.send({ result: "No User found" });
  }
});

app.post("/add-product", async (req, resp) => {
  let product = new Product(req.body);
  let result = await product.save();
  resp.send(result);
});

app.get("/get-products", async (req, resp) => {
  let products = await Product.find();
  if (products.length > 0) {
    resp.send(products);
  } else {
    resp.send({ result: "No products" });
  }
});

// what about product list update? +
app.delete("/delete-product/:id", async (req, resp) => {
  let result = await Product.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.put("/update-product/:id", async (req, resp) => {
  let result = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(result);
});

app.get("/get-product/:id", async (req, resp) => {
  let product = await Product.findOne({ _id: req.params.id });
  if (product) {
    resp.send(product);
  } else {
    resp.send({ result: "No product exists" });
  }
});

app.get("/search-product/:key", async (req, resp) => {});

// which port to use
app.listen(5005);
