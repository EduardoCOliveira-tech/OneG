// routes/mangas.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Manga = require('../models/Manga');

// Protege todas as rotas
router.use(authMiddleware);

// @route   GET /api/mangas
// @desc    Busca todos os mangás do usuário logado
router.get('/', async (req, res) => {
  try {
    const mangas = await Manga.find({ userId: req.user.id });
    res.json(mangas);
  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

// @route   POST /api/mangas
// @desc    Cria um novo mangá para o usuário logado
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    let manga = await Manga.findOne({ name, userId: req.user.id });
    if (manga) {
      return res.status(400).json({ message: 'Mangá já existe.' });
    }

    manga = new Manga({
      name,
      userId: req.user.id,
    });
    
    await manga.save();
    res.json(manga);

  } catch (err) {
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;