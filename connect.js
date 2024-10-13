const { MongoClient, ServerApiVersion } = require('mongodb');

// load .env variables
require('dotenv').config(); 

const env = process.env.NODE_ENV;
const uri = env === 'production' ? process.env.MONGO_PROD_URI : process.env.MONGO_DEV_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    return client.db(); // return the database object
  } catch (error) {
    console.error('Failed to connect to MongoDB Altas', error);
    process.exist(1); // exist process with failure
  }
}

module.exports = connectToMongoDB;
