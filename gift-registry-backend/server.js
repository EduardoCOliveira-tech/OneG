// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Carrega as variáveis de ambiente (do arquivo .env)
dotenv.config();

// Conecta ao MongoDB
connectDB();

const app = express();

// Middlewares

// Configuração explícita do CORS
const corsOptions = {
  // Permite que APENAS o seu site do GitHub Pages faça pedidos
  origin: 'https://eduardocoliveira-tech.github.io', 
  optionsSuccessStatus: 200 // Para browsers mais antigos
};
app.use(cors(corsOptions)); // Usa as opções de CORS

// --- ESTA É A LINHA CORRIGIDA ---
// ... (O resto do seu código server.js continua igual) ...
// Aumenta o limite do payload para aceitar as strings base64 das imagens
// Aumentado de 10mb para 15mb
app.use(express.json({ limit: '15mb' }));
// Adicionado também para urlencoded para garantir
app.use(express.urlencoded({ limit: '15mb', extended: true }));
// --- FIM DA CORREÇÃO ---

// Rotas da API
// Qualquer rota que comece com /api/auth será gerenciada pelo arquivo './routes/auth'
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/mangas', require('./routes/mangas'));
app.use('/api/users', require('./routes/users'));
app.use('/api/profile', require('./routes/profile'));

// Inicia o servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
