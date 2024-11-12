const axios = require('axios');

let authData = null;
let tokenExpiration = null; // Almacenar fecha de expiración del TOKEN

async function authenticate() {
  const url ="https://merchants.preprod.playdigital.com.ar/merchants/middleman/token"
  const credentials = {
    username: 'sdkmodostage',
    password: 'sdkmodostage'
  };

  try{
    const response = await axios.post(url, credentials);
    authData = response.data; // Guardamos datos de Acceso y Access Token

    // Calculamos la expiración del Token a partir de 7 días
    tokenExpiration = new Date();
    tokenExpiration.setDate(tokenExpiration.getDate() + 7);

    return authData.accessToken; // Devolvemos Token

  } catch (error){
    console.error(`Error de autenticación: `,error.message);
    throw new Error("Error al autenticar");
    
  }
}

async function getAuthData() {
  // Verifica si el token ha expirado o si no existe (primera vez)
  if(!authData || new Date() >= tokenExpiration){
    if(new Date() >= tokenExpiration){
      console.log("Token expirado")
      await authenticate(); // Renueva el token si ha expirado o no exis
    } else{
      console.log("Token no disponible.");
      await authenticate(); // Renueva el token si ha expirado o no exis
    }
    
    
  }
  return authData;
}

module.exports = { authenticate, getAuthData};