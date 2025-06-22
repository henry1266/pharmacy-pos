import mongoose from "mongoose";

// Replace <db_password> with the actual password
const uri = "mongodb+srv://zxh1266:DUhR2kSuhX5hx2Jo@cluster0.vjlmtk2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

interface ClientOptions {
  serverApi: {
    version: string;
    strict: boolean;
    deprecationErrors: boolean;
  };
  connectTimeoutMS: number;
  serverSelectionTimeoutMS: number;
}

const clientOptions: ClientOptions = {
  serverApi: { 
    version: "1", 
    strict: true, 
    deprecationErrors: true 
  },
  connectTimeoutMS: 30000, // Keep increased timeout
  serverSelectionTimeoutMS: 30000 // Keep increased timeout
};

async function run(): Promise<void> {
  try {
    console.log("🔄 Attempting to connect using Mongoose with serverApi options...");
    
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    console.log("✅ Connected to the server via Mongoose.");
    
    // Send a ping to confirm a successful connection
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("🏓 Pinged your deployment. You successfully connected to MongoDB via Mongoose!");
    
    // Additional connection info
    const connectionState = mongoose.connection.readyState;
    const connectionStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log(`📊 Connection State: ${connectionStates[connectionState as keyof typeof connectionStates] || 'unknown'}`);
    console.log(`🗄️  Database Name: ${mongoose.connection.db.databaseName}`);
    console.log(`🖥️  Host: ${mongoose.connection.host}`);
    console.log(`🔌 Port: ${mongoose.connection.port}`);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Available Collections: ${collections.length}`);
    if (collections.length > 0) {
      console.log(`📋 Collection Names: ${collections.map(c => c.name).join(', ')}`);
    }
    
  } catch (err) {
    const error = err as Error;
    console.error("❌ Mongoose connection failed:", error.message);
    
    // Provide more specific error information
    if (error.message.includes('ENOTFOUND')) {
      console.error("🌐 Network Error: Unable to resolve hostname. Check your internet connection.");
    } else if (error.message.includes('authentication')) {
      console.error("🔐 Authentication Error: Check your username and password.");
    } else if (error.message.includes('timeout')) {
      console.error("⏱️  Timeout Error: Connection took too long. Check network or server status.");
    } else if (error.message.includes('serverSelectionTimeoutMS')) {
      console.error("🎯 Server Selection Error: Unable to select a server. Check cluster status.");
    }
    
  } finally {
    // Ensures that the client will close when you finish/error
    console.log("🔄 Closing Mongoose connection...");
    await mongoose.disconnect();
    console.log("✅ Mongoose connection closed.");
  }
}

// Run the connection test
console.log("🚀 Starting Mongoose Connection Test...");
run().catch((error: Error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});