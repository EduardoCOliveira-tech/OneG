// routes/categories.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Category = require('../models/Category');
const Item = require('../models/Item'); // Precisamos disto para excluir itens

// Protege todas as rotas
router.use(authMiddleware);

// @route   GET /api/categories
// @desc    Busca todas as categorias do usuário logado
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id });
    res.json(categories);
  } catch (err) {
  console.error(err.message); 
  res.status(500).json({ message: 'Erro interno no servidor: ' + err.message });
}
});

// @route   POST /api/categories
// @desc    Cria uma nova categoria para o usuário logado
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
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
  console.error(err.message); 
  res.status(500).json({ message: 'Erro interno no servidor: ' + err.message });
}
});

// @route   DELETE /api/categories
// @desc    Exclui uma categoria E todos os itens nela
router.delete('/', async (req, res) => {
    const { name } = req.body; // Vamos excluir pelo nome, que é o que o front-end tem

    try {
        // 1. Encontra e exclui a categoria
        const category = await Category.findOneAndDelete({ name: name, userId: req.user.id });

        if (!category) {
            return res.status(404).json({ message: 'Categoria não encontrada.' });
        }

        // 2. Exclui todos os itens que pertenciam a essa categoria
        await Item.deleteMany({ category: name, userId: req.user.id });

        res.json({ message: 'Categoria e itens associados excluídos com sucesso.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

module.exports = router;
