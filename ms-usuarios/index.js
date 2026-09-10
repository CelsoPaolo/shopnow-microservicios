require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase Admin
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.json());

// POST /register
app.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son requeridos' });

    // Verificar si el email ya existe
    const existe = await db.collection('usuarios')
      .where('email', '==', email).get();

    if (!existe.empty)
      return res.status(409).json({ error: 'El email ya está registrado' });

    // Hashear la contraseña
    const hash = await bcrypt.hash(password, 10);

    // Guardar en Firestore
    const ref = await db.collection('usuarios').add({
      nombre,
      email,
      password: hash,
      creadoAt: new Date()
    });

    // Generar JWT
    const token = jwt.sign(
      { uid: ref.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      usuario: { id: ref.id, nombre, email }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const snap = await db.collection('usuarios')
      .where('email', '==', email).get();

    if (snap.empty)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const usuario = {
      id: snap.docs[0].id,
      ...snap.docs[0].data()
    };

    const ok = await bcrypt.compare(password, usuario.password);

    if (!ok)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { uid: usuario.id, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /me — perfil del usuario autenticado
app.get('/me', async (req, res) => {
  try {
    const uid = req.headers['x-user-id'];

    const doc = await db.collection('usuarios').doc(uid).get();

    if (!doc.exists)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    const { password, ...datos } = doc.data();

    res.json({
      id: doc.id,
      ...datos
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`ms-usuarios corriendo en puerto ${process.env.PORT}`)
);