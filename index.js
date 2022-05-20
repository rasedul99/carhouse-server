const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const ObjectId = require("mongodb").ObjectId;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  // console.log("inside", authHeader);
  if (!authHeader) {
    return res
      .status(401)
      .send({ status: 401, message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .send({ status: 403, message: "forbidden  access" });
    }
    // console.log(decoded);
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.tqsec.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const run = async () => {
  try {
    await client.connect();
    const carsCollection = client.db("carInventory").collection("allcars");

    // Auth
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      // console.log(accessToken);
      res.send({ accessToken });
    });
    // services api
    app.post("/carHouse", async (req, res) => {
      const cars = req.body;
      if (!cars.productname | !cars.image | !cars.price) {
        return res.send({ success: false, error: "Please provide all info" });
      }
      const result = await carsCollection.insertOne(cars);
      res.send({
        success: true,
        message: `inserted succesfully ${cars.productname}`,
      });
    });

    app.get("/allcars", async (req, res) => {
      const cursor = carsCollection.find();
      const cars = await cursor.toArray();

      if (!cars?.length) {
        return res.send({ success: false, message: "No cars found" });
      }
      res.send({ success: true, data: cars });
    });
    app.get("/carhouse/mycar", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;

      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = carsCollection.find(query);
        const mycar = await cursor.toArray();
        res.send({ success: true, mycar });
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });
    app.get("/carhouse/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await carsCollection.findOne(query);
      res.send({ success: true, result: result });
    });

    app.put("/carupdate/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const updateStock = req.body;
      console.log(updateStock);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: updateStock.newquantity,
        },
      };
      const result = await carsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    app.put("/carhouse/solditemupdate/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const updateSoldItem = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          soldItem: updateSoldItem.newSoldItem,
          quantity: updateSoldItem.newStock,
        },
      };
      const result = await carsCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete("/car/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await carsCollection.deleteOne(query);
      res.send(result);
    });
  } catch (error) {
    console.log(error);
  }
};
run();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
