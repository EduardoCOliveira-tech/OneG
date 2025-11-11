// routes/profile.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Item = require('../models/Item');
const Category = require('../models/Category');
const Manga = require('../models/Manga');

// Protege todas as rotas
router.use(authMiddleware);

// @route   GET /api/profile
// @desc    Busca o perfil do usuário logado
router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// @route   PUT /api/profile
// @desc    Atualiza o perfil do usuário logado
router.put('/', async (req, res) => {
    const { username, email, listTitle, profilePicture, isPublic } = req.body;
    const profileFields = {};
    if (username) profileFields.username = username;
    if (email) profileFields.email = email;
    if (listTitle) profileFields.listTitle = listTitle;
    if (profilePicture) profileFields.profilePicture = profilePicture;
    if (isPublic !== undefined) profileFields.isPublic = isPublic;
    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
            }
        }
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ message: 'Este e-mail já está em uso.' });
            }
        }
        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password'); 
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// @route   PUT /api/profile/change-password
// @desc    Muda a senha do usuário
router.put('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha atual incorreta.' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Senha alterada com sucesso.' });
    } catch (err) {
        if (err.name === 'ValidationError') {
             return res.status(400).json({ message: err.message });
        }
        console.error(err.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// @route   DELETE /api/profile
// @desc    Exclui a conta do usuário e todos os seus dados
router.delete('/', async (req, res) => {
    try {
        // 1. Exclui o usuário
        await User.findByIdAndDelete(req.user.id);
        
        // 2. Exclui todos os dados associados a esse usuário
        await Item.deleteMany({ userId: req.user.id });
        await Category.deleteMany({ userId: req.user.id });
        await Manga.deleteMany({ userId: req.user.id });

        res.json({ message: 'Conta excluída com sucesso.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

module.exports = router;
