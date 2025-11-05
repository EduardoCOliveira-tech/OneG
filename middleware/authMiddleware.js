// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // 1. Pega o token do cabeçalho
  const token = req.header('Authorization');

  // 2. Verifica se o token não existe
  if (!token) {
    return res.status(401).json({ message: 'Nenhum token, autorização negada.' });
  }

  // 3. Verifica se o token está no formato correto (Bearer TOKEN)
  if (!token.startsWith('Bearer ')) {
     return res.status(401).json({ message: 'Token em formato inválido.' });
  }

  // 4. Extrai o token
  const tokenString = token.split(' ')[1];
  
  // 5. Verifica o token
  try {
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
    
    // 6. Adiciona o usuário (que estava dentro do token) ao objeto 'req'
    // Agora, todas as rotas após este middleware terão acesso a 'req.user'
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};