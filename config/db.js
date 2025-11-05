// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Conectado com Sucesso.');
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err.message);
    // Sai do processo com falha
    process.exit(1);
  }
};

module.exports = connectDB;