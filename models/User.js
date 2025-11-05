// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  isPublic: { 
    type: Boolean,
    default: true,
  },
  listTitle: { 
    type: String,
    default: 'Minha Lista de Presentes',
  },
  profilePicture: { 
    type: String,
    // --- MUDANÇA AQUI ---
    // Em vez de um link do Imgur, usamos uma string de dados (base64)
    // de um ícone de perfil SVG. É mais rápido e nunca será bloqueado.
    default: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDEyYy0yLjc2IDAtNSA-Mi4yNCAtNSA-NXMvMi4yNCAtNSA1IC01IDUgMi4yNCA1IDUgLTIuMjQgNSAtNSA1em0wIDJjMi42NyAwIDggMS4zNCA4IDR2Mkg0di0yYzAtMi42NiA1LjMzIC00IDggLTR6Ii8+PC9zdmc+',
  },
  // --- FIM DA MUDANÇA ---
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);