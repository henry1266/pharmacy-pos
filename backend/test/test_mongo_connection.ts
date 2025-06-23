import { MongoClient } from 'mongodb';

// Using local MongoDB server
const uri = "mongodb://192.168.68.73:27017";

// Create a MongoClient for local MongoDB connection
const client = new MongoClient(uri, {
  connectTimeoutMS: 30000, // Add connection timeout
  serverSelectionTimeoutMS: 30000 // Add server selection timeout
});

async function run(): Promise<void> {
  try {
    console.log("🔄 Attempting to connect to local MongoDB using Node.js Driver...");
    
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    console.log("✅ Connected to the server.");
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("🏓 Pinged your local MongoDB. You successfully connected to MongoDB!");
    
    // Additional connection info
    const admin = client.db("admin");
    const serverStatus = await admin.command({ serverStatus: 1 });
    console.log(`📊 MongoDB Version: ${serverStatus.version}`);
    console.log(`🖥️  Host: ${serverStatus.host}`);
    console.log(`⏰ Server Time: ${new Date(serverStatus.localTime).toISOString()}`);
    
  } catch (err) {
    const error = err as Error;
    console.error("❌ Connection failed:", error.message);
    
    // Provide more specific error information
    if (error.message.includes('ENOTFOUND')) {
      console.error("🌐 Network Error: Unable to resolve hostname. Check your internet connection.");
    } else if (error.message.includes('authentication')) {
      console.error("🔐 Authentication Error: Check your username and password.");
    } else if (error.message.includes('timeout')) {
      console.error("⏱️  Timeout Error: Connection took too long. Check network or server status.");
    }
    
  } finally {
    // Ensures that the client will close when you finish/error
    console.log("🔄 Closing connection...");
    await client.close();
    console.log("✅ Connection closed.");
  }
}

// Run the connection test
console.log("🚀 Starting MongoDB Connection Test...");
run().catch((error: Error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});