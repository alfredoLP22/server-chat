const mongoose = require("mongoose");

const connectionDB = async () => {
    try {    
    const connection = await mongoose.connect(process.env.DB_CONECTION)
    
    const url = `Host ${connection.connection.host}: port: ${connection.connection.port}`
    console.log(`Connection correct in ${url}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectionDB;