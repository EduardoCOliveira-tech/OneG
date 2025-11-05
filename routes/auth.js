// Arquivo: gift-registry-backend/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Registra um novo usuário
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body; 

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Usuário já existe com este e-mail.' });
    }
    
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
    }

    user = new User({ username, email, password }); 
    await user.save(); 

    const payload = {
      user: {
        id: user.id, 
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, 
      (err, token) => {
        if (err) throw err;
        
        // --- RESPOSTA ATUALIZADA ---
        // Envia o token E os dados do usuário
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            listTitle: user.listTitle,
            profilePicture: user.profilePicture
          }
        }); 
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erro interno no servidor: ' + err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Autentica (loga) o usuário e retorna o token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;

        // --- RESPOSTA ATUALIZADA ---
        // Envia o token E os dados do usuário
        res.json({ 
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            listTitle: user.listTitle,
            profilePicture: user.profilePicture
          }
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erro interno no servidor: ' + err.message });
  }
});

module.exports = router;