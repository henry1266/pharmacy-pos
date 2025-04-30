const mongoose = require("mongoose");

// Replace <db_password> with the actual password
const uri = "mongodb+srv://zxh1266:DUhR2kSuhX5hx2Jo@cluster0.vjlmtk2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const clientOptions = {
  serverApi: { 
    version: "1", 
    strict: true, 
    deprecationErrors: true 
  },
  connectTimeoutMS: 30000, // Keep increased timeout
  serverSelectionTimeoutMS: 30000 // Keep increased timeout
};

async function run() {
  try {
    console.log("Attempting to connect using Mongoose with serverApi options...");
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to the server via Mongoose.");
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB via Mongoose!");
  } catch (err) {
    console.error("Mongoose connection failed:", err);
  } finally {
    // Ensures that the client will close when you finish/error
    console.log("Closing Mongoose connection...");
    await mongoose.disconnect();
    console.log("Mongoose connection closed.");
  }
}

run().catch(console.dir);

