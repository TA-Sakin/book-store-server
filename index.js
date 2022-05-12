const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jtmx8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const booksCollection = client.db("bookStore").collection("books");
    app.get("/books", async (req, res) => {
      const query = {};
      const cursor = booksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/homebooks", async (req, res) => {
      const query = {};
      const cursor = booksCollection.find(query);
      const result = await cursor.limit(6).toArray();
      res.send(result);
    });
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const book = await booksCollection.findOne(query);
      res.send(book);
    });
    app.put("/books/:id", async (req, res) => {
      const id = req.params.id;
      const updateBook = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: updateBook.quantity,
          sold: updateBook.sold,
        },
      };
      const result = await booksCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    app.post("/addbook", async (req, res) => {
      const bookInfo = req.body;

      const result = await booksCollection.insertOne(bookInfo);
      res.send({ success: "Book added successfully" });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Book store server");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
