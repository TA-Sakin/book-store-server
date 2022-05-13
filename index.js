const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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

function verfiyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
  });
  next();
}

async function run() {
  try {
    await client.connect();
    const booksCollection = client.db("bookStore").collection("books");

    //jwt auth
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    //load data for inventory
    app.get("/books", async (req, res) => {
      const query = {};
      const cursor = booksCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //load data for homepage
    app.get("/homebooks", async (req, res) => {
      const query = {};
      const cursor = booksCollection.find(query);
      const count = await booksCollection.estimatedDocumentCount();
      let result;
      if (count < 6) {
        result = await cursor.toArray();
      } else {
        result = await cursor.limit(6).toArray();
      }
      res.send(result);
    });

    //get filtered data by email
    app.get("/mybooks", verfiyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const query = { email };
        const cursor = booksCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });

    //load single data by id
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const book = await booksCollection.findOne(query);
      res.send(book);
    });

    //update data
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

    //add new data
    app.post("/addbook", async (req, res) => {
      const bookInfo = req.body;

      const result = await booksCollection.insertOne(bookInfo);
      res.send({ success: "Book added successfully" });
    });

    //delete data
    app.delete("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Book store server running");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
