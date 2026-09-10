require('dotenv').config();

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

app.use(cors());

// Middleware de autenticación JWT
const verificarJWT = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token requerido',
    });
  }

  const token = auth.split(' ')[1];

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.headers['x-user-id'] = payload.uid;
    req.headers['x-user-email'] = payload.email;

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
    });
  }
};

// RUTAS PÚBLICAS

// POST /api/users/register
app.post(
  '/api/users/register',
  createProxyMiddleware({
    target: process.env.USUARIOS_URL,
    changeOrigin: true,

    pathRewrite: {
      '^/api/users': '',
    },

    on: {
      error: (err, req, res) => {
        console.error('Error ms-usuarios:', err.message);

        res.status(502).json({
          error: 'Error al conectar con ms-usuarios',
        });
      },
    },
  })
);

// POST /api/users/login
app.post(
  '/api/users/login',
  createProxyMiddleware({
    target: process.env.USUARIOS_URL,
    changeOrigin: true,

    pathRewrite: {
      '^/api/users': '',
    },

    on: {
      error: (err, req, res) => {
        console.error('Error ms-usuarios:', err.message);

        res.status(502).json({
          error: 'Error al conectar con ms-usuarios',
        });
      },
    },
  })
);

// RUTAS DE USUARIOS PROTEGIDAS

app.use(
  '/api/users',
  verificarJWT,

  createProxyMiddleware({
    target: process.env.USUARIOS_URL,
    changeOrigin: true,

    pathRewrite: {
      '^/api/users': '',
    },

    on: {
      error: (err, req, res) => {
        console.error('Error ms-usuarios:', err.message);

        res.status(502).json({
          error: 'Error al conectar con ms-usuarios',
        });
      },
    },
  })
);

// RUTAS DE PRODUCTOS PROTEGIDAS

app.use(
  '/api/products',
  verificarJWT,

  createProxyMiddleware({
    target: process.env.PRODUCTOS_URL,
    changeOrigin: true,

    pathRewrite: {
      '^/api/products': '',
    },

    on: {
      error: (err, req, res) => {
        console.error('Error ms-productos:', err.message);

        res.status(502).json({
          error: 'Error al conectar con ms-productos',
        });
      },
    },
  })
);

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Gateway corriendo en puerto ${PORT}`);
});