// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Category = require('../models/Category');
const Manga = require('../models/Manga');

// @route   GET /api/users/search
// @desc    Busca por usuários públicos (pelo username ou email)
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q; 
    if (!query || query.length < 3) {
      return res.status(400).json({ message: 'A busca requer ao menos 3 caracteres.' });
    }

    const searchQuery = new RegExp(query, 'i');

    const users = await User.find({
      isPublic: true, 
      $or: [ 
        { username: searchQuery },
        { email: searchQuery }
      ]
    })
    .select('-password -email'); 

    res.json(users);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// @route   GET /api/users/public-list/:username
// @desc    Busca a lista de presentes pública de um usuário
router.get('/public-list/:username', async (req, res) => {
    try {
        // 1. Encontra o usuário pelo nome de usuário
        const user = await User.findOne({ 
            username: req.params.username, 
            isPublic: true 
        }).select('-password -email'); // Agora o select não importa, pois vamos construir o objeto

        if (!user) {
            return res.status(404).json({ message: 'Perfil público não encontrado.' });
        }

        // 2. Busca todos os dados associados a esse usuário
        const [items, categories, mangas] = await Promise.all([
            Item.find({ userId: user._id }),
            Category.find({ userId: user._id }),
            Manga.find({ userId: user._id })
        ]);

        // 3. Retorna os dados para o front-end
        res.json({
            // --- INÍCIO DA CORREÇÃO ---
            // Agora estamos a enviar o objeto 'user' completo (com username e profilePicture)
            user: { 
                username: user.username,
                profilePicture: user.profilePicture // Esta linha estava em falta
            },
            // --- FIM DA CORREÇÃO ---
            items: items,
            categories: categories.map(c => c.name), // Envia apenas os nomes
            mangas: mangas.map(m => m.name)         // Envia apenas os nomes
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

module.exports = router;