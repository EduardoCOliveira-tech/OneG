// routes/items.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Item = require('../models/Item');

// Aplicamos o middleware de autenticação a TODAS as rotas neste arquivo.
// Ninguém pode acessar /api/items sem um token válido.
router.use(authMiddleware);

// @route   GET /api/items
// @desc    Busca TODOS os itens DO USUÁRIO LOGADO
router.get('/', async (req, res) => {
  try {
    // req.user.id foi adicionado pelo authMiddleware
    // A mágica da privacidade acontece aqui:
    const items = await Item.find({ userId: req.user.id }).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// @route   POST /api/items
// @desc    Cria um novo item PARA O USUÁRIO LOGADO
router.post('/', async (req, res) => {
  const { name, price, category, work, platform, link, image, notes } = req.body;

  try {
    const newItem = new Item({
      name,
      price,
      category,
      work,
      platform,
      link,
      image,
      notes,
      userId: req.user.id, // Liga o item ao usuário logado
    });

    const item = await newItem.save();
    res.json(item); // Retorna o item criado (com o ID do banco)
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// Função auxiliar para verificar se o usuário é dono do item
async function checkOwnership(req, res) {
  let item = await Item.findById(req.params.id);
  if (!item) {
    res.status(404).json({ message: 'Item não encontrado.' });
    return null;
  }
  // Verifica se o ID do dono do item é o mesmo do usuário logado
  if (item.userId.toString() !== req.user.id) {
    res.status(401).json({ message: 'Não autorizado a modificar este item.' });
    return null;
  }
  return item;
}


// @route   PUT /api/items/:id
// @desc    Atualiza um item (edição completa)
router.put('/:id', async (req, res) => {
  try {
    let item = await checkOwnership(req, res);
    if (!item) return; // Se não for dono ou o item não existir, para aqui.

    // Atualiza o item
    item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // $set atualiza os campos enviados no body
      { new: true } // Retorna o documento atualizado
    );
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// @route   PATCH /api/items/:id
// @desc    Atualiza parcialmente um item (ex: só o 'purchased')
router.patch('/:id', async (req, res) => {
  try {
    let item = await checkOwnership(req, res);
    if (!item) return;

    // Atualiza apenas o campo 'purchased' (ou qualquer outro enviado)
    item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

// @route   DELETE /api/items/:id
// @desc    Deleta um item
router.delete('/:id', async (req, res) => {
  try {
    let item = await checkOwnership(req, res);
    if (!item) return;

    await Item.findByIdAndDelete(req.params.id);
    res.status(204).send(); // 204 = No Content (Sucesso, sem corpo)

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no servidor');
  }
});

module.exports = router;