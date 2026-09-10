require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccount.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log('Llegó:', req.method, req.url);
  next();
});


// GET / - listar todos los productos
app.get('/', async (req, res) => {
  try {
    const snap = await db.collection('productos').get();

    const productos = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    res.json(productos);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


// POST / - crear producto
app.post('/', async (req, res) => {
  try {
    const {
      nombre,
      precio,
      stock
    } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({
        error: 'nombre y precio son requeridos'
      });
    }

    const ref = await db.collection('productos').add({
      nombre,
      precio,
      stock: stock || 0,
      vendedorId: req.headers['x-user-id'],
      creadoAt: new Date()
    });

    res.status(201).json({
      id: ref.id,
      nombre,
      precio,
      stock
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
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
      mensaje: 'Producto actualizado'
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
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
      mensaje: 'Producto eliminado'
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


app.listen(process.env.PORT, () => {
  console.log(
    `ms-productos corriendo en puerto ${process.env.PORT}`
  );
});