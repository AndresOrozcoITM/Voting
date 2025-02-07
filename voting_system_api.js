import express from 'express';
import { Sequelize, DataTypes, Op } from 'sequelize';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'secret';

// Configuración de la base de datos
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false
});

// Modelos
const Voter = sequelize.define('Voter', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  has_voted: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Candidate = sequelize.define('Candidate', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  // Se agrega unique para facilitar la validación de que una persona no se registre en ambos roles.
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  party: { type: DataTypes.STRING },
  votes: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const Vote = sequelize.define('Vote', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  voter_id: { type: DataTypes.INTEGER, references: { model: Voter, key: 'id' } },
  candidate_id: { type: DataTypes.INTEGER, references: { model: Candidate, key: 'id' } }
});

// Relaciones
Voter.hasOne(Vote, { foreignKey: 'voter_id' });
Candidate.hasMany(Vote, { foreignKey: 'candidate_id' });
Vote.belongsTo(Voter, { foreignKey: 'voter_id' });
Vote.belongsTo(Candidate, { foreignKey: 'candidate_id' });

// Middleware
app.use(bodyParser.json());

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    // Se asume el formato: "Bearer <token>"
    const verified = jwt.verify(token.split(' ')[1], SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Rutas de autenticación y votantes

// Registro de votante
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Validación: si la persona ya está registrada como candidato, no puede ser votante.
    const existingCandidate = await Candidate.findOne({ where: { name } });
    if (existingCandidate) {
      return res.status(400).json({ error: 'This person is already registered as a candidate and cannot be registered as voter' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newVoter = await Voter.create({ name, email, password: hashedPassword });
    res.status(201).json(newVoter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Inicio de sesión
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const voter = await Voter.findOne({ where: { email } });
    if (!voter || !(await bcrypt.compare(password, voter.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: voter.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoints para Votantes

// Obtener lista de votantes (con paginación)
app.get('/voters', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const voters = await Voter.findAndCountAll({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json({ total: voters.count, page: parseInt(page), voters: voters.rows });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener detalles de un votante por ID
app.get('/voters/:id', async (req, res) => {
  try {
    const voter = await Voter.findByPk(req.params.id);
    if (!voter) return res.status(404).json({ error: 'Voter not found' });
    res.json(voter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar un votante
app.delete('/voters/:id', async (req, res) => {
  try {
    const voter = await Voter.findByPk(req.params.id);
    if (!voter) return res.status(404).json({ error: 'Voter not found' });
    await voter.destroy();
    res.json({ message: 'Voter deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoints para Candidatos

// Registrar un nuevo candidato
app.post('/candidates', async (req, res) => {
  try {
    const { name, party } = req.body;
    // Validación: si la persona ya está registrada como votante, no puede ser candidato.
    const existingVoter = await Voter.findOne({ where: { name } });
    if (existingVoter) {
      return res.status(400).json({ error: 'This person is already registered as a voter and cannot be registered as candidate' });
    }
    // Verificar si ya existe un candidato con el mismo nombre
    const existingCandidate = await Candidate.findOne({ where: { name } });
    if (existingCandidate) {
      return res.status(400).json({ error: 'Candidate with this name already exists' });
    }
    const newCandidate = await Candidate.create({ name, party });
    res.status(201).json(newCandidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener lista de candidatos (con paginación)
app.get('/candidates', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const candidates = await Candidate.findAndCountAll({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json({ total: candidates.count, page: parseInt(page), candidates: candidates.rows });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener detalles de un candidato por ID
app.get('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar un candidato
app.delete('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    await candidate.destroy();
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoints para Votos

// Emitir un voto (requiere autenticación)
app.post('/votes', authenticate, async (req, res) => {
  try {
    const { candidate_id } = req.body;
    const voter = await Voter.findByPk(req.user.id);
    if (!voter || voter.has_voted) return res.status(400).json({ error: 'Voter not eligible' });
    
    const candidate = await Candidate.findByPk(candidate_id);
    if (!candidate) return res.status(400).json({ error: 'Candidate not found' });
    
    await Vote.create({ voter_id: voter.id, candidate_id });
    await voter.update({ has_voted: true });
    await candidate.update({ votes: candidate.votes + 1 });
    
    res.status(201).json({ message: 'Vote cast successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener lista de todos los votos (con paginación)
app.get('/votes', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const votes = await Vote.findAndCountAll({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json({ total: votes.count, page: parseInt(page), votes: votes.rows });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Obtener estadísticas de votación
app.get('/votes/statistics', async (req, res) => {
  try {
    const candidates = await Candidate.findAll();
    const totalVotes = await Vote.count();
    const statistics = candidates.map(candidate => ({
      name: candidate.name,
      party: candidate.party,
      votes: candidate.votes,
      percentage: totalVotes ? ((candidate.votes / totalVotes) * 100).toFixed(2) : 0
    }));
    res.json({ totalVotes, statistics });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sincronizar base de datos y levantar servidor
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log('Database sync error:', err));
