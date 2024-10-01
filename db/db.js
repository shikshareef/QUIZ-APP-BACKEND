const mongoose = require('mongoose');
const DB_URL = process.env.DB_URL;
const  connectDb = async()=>{
      try {
        await mongoose.connect(DB_URL);
        console.log('MongoDB Connected...');
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
}

module.exports = connectDb;