const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-company";

require("./db/config");

const User = require("./db/User");
const Product = require("./db/Product");

const app = express();

app.use(express.json());
app.use(cors());

app.post("/register", async (req, resp) => {
  // hash password
  let user = new User({
    ...req.body,
    password: await bcrypt.hash(req.body.password, 12),
  });

  let result = await user.save();
  //remove password from returned object
  result = result.toObject();
  delete result.password;

  //jwt signing
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      resp.send("Something went wrong with authentication");
    }
    resp.send({ result, auth: token });
  });

  // resp.send(result);
});

// this returns prebious req.body without password + auth
app.post("/login", async (req, resp) => {
  // validate correct authentication
  if (!req.body.password || !req.body.email)
    return resp.send({ result: "No User found" });

  let result = await User.findOne({ email: req.body.email });

  if (await bcrypt.compare(req.body.password, result.password)) {
    // now we can remove password from object
    delete result.password;

    //jwt sign
    Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
      if (err) {
        resp.send("Something went wrong with authentication");
      }
      resp.send({ result, auth: token });
    });

    // resp.send(user);
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

app.get("/search-product/:key", verifyToken, async (req, resp) => {
  // it is searching for either of the properties described by key,
  // if I add another property within the JS object then it is AND within
  let result = await Product.find({
    $or: [
      {
        name: { $regex: req.params.key },
        // company: { $regex: req.params.key },
      },
      {
        company: { $regex: req.params.key },
      },
    ],
  });
  resp.send(result);
});

//middleware
function verifyToken(req, resp, next) {
  console.warn(req.header["authorization"]);
  let token = req.headers["authorization"];

  // this just checks if we have token present
  // how about having correct token?
  if (token) {
    // get part after bearer
    token = token.split(" ")[1];
    console.warn(token);
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        resp.status(401).send({ result: "Please provide a valid token" });
      } else {
        //if fine it redirects the response
        next();
      }
    });
  } else {
    resp.send("Please provide a token");
  }
  //if fine it redirects the response IF now JWT
  // next();
}

// which port to use
app.listen(5005);
