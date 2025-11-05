// routes/categories.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Category = require('../models/Category');

// Protege todas as rotas
router.use(authMiddleware);

// @route   GET /api/categories
// @desc    Busca todas as categorias do usuário logado
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id });
    res.json(categories);
  } catch (err) {
  console.error(err.message); // Isso imprime o erro real no seu terminal
  res.status(500).json({ message: 'Erro interno no servidor: ' + err.message });
}
});

// @route   POST /api/categories
// @desc    Cria uma nova categoria para o usuário logado
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    // Verifica se já existe (opcional, mas bom)
    let category = await Category.findOne({ name, userId: req.user.id });
    if (category) {
      return res.status(400).json({ message: 'Categoria já existe.' });
    }

    category = new Category({
      name,
      userId: req.user.id,
    });
    
    await category.save();
    res.json(category);

  } catch (err) {
  console.error(err.message); // Isso imprime o erro real no seu terminal
  res.status(500).json({ message: 'Erro interno no servidor: ' + err.message });
}
});

module.exports = router;