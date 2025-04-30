const { MongoClient, ServerApiVersion } = require('mongodb');
// Replace <db_password> with the actual password
const uri = "mongodb+srv://zxh1266:DUhR2kSuhX5hx2Jo@cluster0.vjlmtk2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000, // Add connection timeout
  serverSelectionTimeoutMS: 30000 // Add server selection timeout
});

async function run() {
  try {
    console.log("Attempting to connect using MongoDB Node.js Driver...");
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    console.log("Connected to the server.");
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    // Ensures that the client will close when you finish/error
    console.log("Closing connection...");
    await client.close();
    console.log("Connection closed.");
  }
}

run().catch(console.dir);

