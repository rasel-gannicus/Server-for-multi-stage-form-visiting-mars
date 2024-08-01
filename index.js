const express = require("express");
const app = express();
const port = process.env.PORT || 2600;
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userDb = client.db("MultiStage_form_Mars_visit").collection("users");

    // --- adding new user
    app.post("/addUser", async (req, res) => {
      // const userData = req.body;
      const userData = { name: "rasel", email: "rasel@gmail.com" };
      const { email, name } = userData;

      try {
        const user = await userDb.findOne({ email: email });
        // Check if email already exists
        if (user) {
          res.status(409).send("User already exists");
        } else {
          // Add new user
          const result = await userDb.insertOne({ name, email });
          res.status(201).send("User added successfully");
        }
      } catch (err) {
        console.error("Error occurred while adding user:", err);
        res.status(500).send("Internal server error");
      }
    });
    // const result = await userDb.insertOne(userData);
    // res.send('user added successfully');

    // --- getting all the blogs
    app.get("/getAllBlogs", async (req, res) => {
      const query = {};
      const cursor = portfolioBlogsDb.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // --- edit a blog
    app.patch("/blogs/edit/:id", async (req, res) => {
      const params = req.params;
      const { id } = params;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const update = { $set: data };

      const result = await portfolioBlogsDb.updateOne(filter, update);
      res.send(result);
    });

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await userDb.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exist!!!",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into the database
      await userDb.insertOne({
        name,
        email,
        password: hashedPassword,
        role: "user",
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully!",
      });
    });

        // User Login
        app.post("/api/v1/login", async (req, res) => {
          const { email, password } = req.body;
    
          // Find user by email
          const user = await userDb.findOne({ email });
          if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
          }
    
          // Compare hashed password
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
          }
    
          // Generate JWT token
          const token = jwt.sign(
            { email: user.email, role: user.role },
            process.env.JWT_SECRET,
            {
              expiresIn: process.env.EXPIRES_IN,
            }
          );
    
          res.json({
            success: true,
            message: "User successfully logged in!",
            user,
            accessToken: token,
          });
        });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server running successfully !");
});

app.listen(process.env.PORT, () => {
  console.log(`Listening from ${port}`);
  console.log(process.env.PORT);
});
