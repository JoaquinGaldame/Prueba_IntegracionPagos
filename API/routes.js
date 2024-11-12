const express = require('express');
const axios = require('axios');
const { authenticate, getAuthData } = require('./authService');
const router = express.Router();

// Configuración de Mercado Pago
const posID = "CASA01" // Necesario para QR Pago
const collectorID = 66674895 // Necesario para QR Pago
const sponsorID = 439873193 // Necesario para QR Pago 
const ACCESSTOKEN = 'APP_USR-5754912499463889-061215-bf93cfae1c8dc5e78eef9b04da2b042d-66674895'
const { MercadoPagoConfig, Preference  } = require('mercadopago');
const client = new MercadoPagoConfig(
  { 
    accessToken: 'APP_USR-5754912499463889-061215-bf93cfae1c8dc5e78eef9b04da2b042d-66674895', 
    options: { timeout: 5000, idempotencyKey: 'abc' } 
  });

/*
############ ROUTES ##################
 */

// Endpoint para simular API de productos
router.get('/getProductos', (req, res) => {
  res.json([
    { id: 1, nombre: 'Comida', precio: 15.00, cantidad: 1 },
    { id: 2, nombre: 'Bebida', precio: 10, cantidad: 1 }, // Merdado Pago Test
    { id: 3, nombre: 'Postre', precio: 60, cantidad: 1 }
  ]
  );
});

// Crear Orden de Pago para Checkout PRO - Mercado Pago
router.post('/create_preference', async (req,res) => {
  const preference = new Preference(client);
  preference.create({
    body: {
      items: [
        {
          title: req.body.name,
          quantity: req.body.quantity,
          unit_price: req.body.price
        }
      ],
    }
  })
  .then( (payment) =>{
    console.log('Preference created... ' ,payment)
    // Devolvemos preference creado para Checkout PRO
    res.json(payment)
  }
  )
  .catch(console.log);
})

// Crear Orden de Pago para QR - Mercado Pago
router.post('/create_preference-QR', async (req, res) => {
  try {
    const { name, quantity, price } = req.body; // Datos enviados desde el frontend
    const Data = {
      description:"",
      external_reference:"REF12345",
      items: [
          {
              sku_number: "",
              category: "",
              currency_id: "ARS",
              description: "Producto",
              title: name,
              quantity: quantity,
              unit_price: price,
              unit_measure: "unit",
              total_amount:price
          }
      ],
      sponsor:{
          id: sponsorID
      },
      title:name,
      total_amount:price
    }
    console.log('Este token  ' + ACCESSTOKEN)
    const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${collectorID}/pos/${posID}/qrs`
    const response = await axios.post(url, Data, {
      headers: { Authorization: `Bearer ${ACCESSTOKEN}` },
      });
    console.log(res)
    // Devolvemos URL para generar el QR
    res.json({ store_order_id: response.data.in_store_order_id, qr: response.data.qr_data });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear la preferencia');
  }
});

// Crear Intención de Pago para MODO - Flujo Desktop & Mobile
router.post('/crear-intencionpago', async (req, res) => {
  const id = Math.floor(Math.random() * 1000000).toString();
  // El storeId ingresado es de cuenta Test MODO - Se necesita de la Cuenta Propia
  const paymentData = {
    productName: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity,
    currency: "ARS",
    storeId: "2e10e1e2-1046-47a9-b5aa-12f0749940f8",
    externalIntentionId: id,
    message: "Mensaje desde la intención de pago"
  };
  console.log('Prooducto: ' + JSON.stringify(paymentData))
  // Api de MODO
  const url = 'https://merchants.preprod.playdigital.com.ar/merchants/ecommerce/payment-intention';
  
  try {
    const authData = await getAuthData(); // Obtiene el token y otros datos; renueva si ha expirado
    // paymentData.storeId = authData.user.stores[0].id;
    const token = authData.accessToken;
    
    const response = await axios.post(url, paymentData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { id, qr, deeplink } = response.data;
    // Devolvemos QR para Desktop y Deeplink para Mobile
    res.json({ id, qr, deeplink });
  } catch (error) {
    console.error('Error al crear intención de pago:', error.message);
    res.status(500).json({ error: 'Error al crear intención de pago' });
  }
});

module.exports = router;