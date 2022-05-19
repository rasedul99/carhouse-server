const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT | 5000;
const ObjectId = require("mongodb").ObjectId;
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

app.use(cors());
app.use(express.json());

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
    app.get("/carhouse/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      // console.log(query);
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
