require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase Admin usando variables de entorno
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

// Log de peticiones
app.use((req, res, next) => {
  console.log('Llegó:', req.method, req.url);
  next();
});

// GET / - listar todos los productos
app.get('/', async (req, res) => {
  try {
    const snap = await db.collection('productos').get();

    const productos = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(productos);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// POST / - crear producto
app.post('/', async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({
        error: 'nombre y precio son requeridos',
      });
    }

    const ref = await db.collection('productos').add({
      nombre,
      precio,
      stock: stock ?? 0,
      vendedorId: req.headers['x-user-id'] || null,
      creadoAt: new Date(),
    });

    res.status(201).json({
      id: ref.id,
      nombre,
      precio,
      stock: stock ?? 0,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// PUT /:id - actualizar producto
app.put('/:id', async (req, res) => {
  try {
    await db
      .collection('productos')
      .doc(req.params.id)
      .update(req.body);

    res.json({
      mensaje: 'Producto actualizado',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// DELETE /:id - eliminar producto
app.delete('/:id', async (req, res) => {
  try {
    await db
      .collection('productos')
      .doc(req.params.id)
      .delete();

    res.json({
      mensaje: 'Producto eliminado',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// Puerto
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`ms-productos corriendo en puerto ${PORT}`);
});