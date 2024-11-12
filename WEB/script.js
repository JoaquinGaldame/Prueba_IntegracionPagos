let arrayProducts = [];
let band = false;
let productBuy = null
// Comando para Server: http-server -a 192.168.1.40 -p 8080
// Configuración de Mercado Pago
const mp = new MercadoPago('APP_USR-bbbec4c0-38ed-4eb2-b990-9f31d66961e7', {
  locale: 'es-AR'
});


function showModal(option, product) {
    document.getElementById('modalProductName').innerText = product.nombre;
    document.getElementById('modalProductPrice').innerText = "$" + product.precio;
    document.getElementById('modalProductQuantity').innerText = product.cantidad;
    document.getElementById('modalProductTotal').innerText = "$" + product.precio * product.cantidad;
    document.getElementById('purchaseSummaryModal').style.display = 'flex';
    switch(option){
      case 1:
        //Pagamos con Modo
        document.getElementById('container-MercadoPago').style.display = 'none';
        document.getElementById('button-MODO').style.display = 'flex';
        break;
      case 2:
        // Pagamos con Mercado Pago 
        document.getElementById('button-MODO').style.display = 'none';
        if(isMobile()){
          //Checkout PRO
          handleMercadoPago()
        } else{
          // Pago por QR
          obtenerQR()
          document.getElementById('container-MercadoPago').style.display = 'flex';
        }
        break;
      default:
        break;
    }
}

function togglePaymentOptions(option) {
  const paymentOptions = document.getElementById('paymentOptions');
  console.log('Llega aqui')
  paymentOptions.classList.toggle('show');
  console.log('Toggle payment options:', paymentOptions.classList.contains('show'));
  if(option >= 0){
    console.log('Compra producto ', option)
    ComprarProducto(option)
  }
}


function showModalPayment(MedioDePago) {
  showModal(MedioDePago, productBuy);
  // document.getElementById("paymentOptions").style.display = 'none';
  document.getElementById("paymentOptions").classList.remove('show');
}

function closeModal() {
  document.getElementById('purchaseSummaryModal').style.display = 'none';
  // document.getElementById("paymentOptions").classList.add('show'); 
}

const obtenerProductos = async () => {
  const res = await fetch('http://192.168.1.40:4000/api/getProductos', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
    }  
  );
  const data = await res.json();
  data.forEach((item) => {
    arrayProducts.push(item);
  })
}

async function createPaymentIntention(Data){
  const res = await fetch('http://192.168.1.40:4000/api/crear-intencionpago', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
      body: JSON.stringify(Data)
    }  
  );
  const jsonRes = await res.json();
  return {
    checkoutId: jsonRes.id,
    qrString: jsonRes.qr,
    deeplink: jsonRes.deeplink,
  };
}

async function showModalModo() {
  if(productBuy !=null){
    try{
      const Data = {
        name: productBuy.nombre,
        price: productBuy.precio,
        quantity: productBuy.cantidad
      }
      const modalData = await createPaymentIntention(Data);
      var modalObject = {
        qrString: modalData.qrString,
        checkoutId: modalData.checkoutId,
        deeplink:  {
          url: modalData.deeplink,
          callbackURL: 'http://192.168.1.40:8080',
          callbackURLSuccess: 'http://192.168.1.40:8080'
        },
        callbackURL: 'http://192.168.1.40:8080',
        refreshData: createPaymentIntention,
        onSuccess: function () { console.log('onSuccess') },
        onFailure: function () { console.log('onFailure') },
        onCancel: function () { console.log('onCancel') },
        onClose: function () { console.log('onClose') },
      }
      ModoSDK.modoInitPayment(modalObject);
    } catch(error){
      console.error('Error ', error)
    }
  }
}

// Función para generar y mostrar el QR en el frontend
function generarQR(url) {
  // librería `qrcode.min.js` o cualquier generador de QR
  const qrCodeContainer = document.getElementById('qrCodeContainer');
  qrCodeContainer.innerHTML = ''; // Limpia el contenedor de QR previo

  const qr = new QRCode(qrCodeContainer, {
    text: url,
    width: 256,
    height: 256
  });
}

async function obtenerQR() {
  if(productBuy !== null){
    try{
      const Data = {
        name: productBuy.nombre,
        price: productBuy.precio,
        quantity: productBuy.cantidad
      }
      const response = await fetch('http://192.168.1.40:4000/api/create_preference-QR', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Data)
      });
      const dataResponse = await response.json();
      if (dataResponse.qr) {
        generarQR(dataResponse.qr);
      }
    } catch(error){
      console.error(error)
    }
  }
}



// Handle call to backend and generate preference.
function handleMercadoPago(){
  if(productBuy !== null)
  {
    const orderData = {
      quantity: productBuy.cantidad,
      name: productBuy.nombre,
      price: productBuy.precio
    };
  
    fetch("http://192.168.1.40:4000/api/create_preference", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })
    .then(function (response) {
      return response.json();
    })
    .then(function (preference) {
      console.log('esto tiene preference ' + preference)
      mp.bricks().create("wallet", "wallet_container", {
        initialization: {
            preferenceId: preference.id,
        }
      });
    })
    .catch(function () {
      alert("Unexpected error");
      $('#checkout-btn').attr("disabled", false);
    });
  }
}



const ComprarProducto = (numero) => {
  if(band === true){
    const product = arrayProducts[numero];
    productBuy = arrayProducts[numero];
  }
}

function isMobile() {
  return window.innerWidth <= 768; // 768px es un valor común para el límite de dispositivos móviles
}


console.log('Esto se ejecuta')
obtenerProductos().then((result) =>{
  console.log('Esto tiene arreglo Productos 1' + JSON.stringify(arrayProducts));
  if(arrayProducts.length > 0){
    band = true;
    document.getElementById('nombreComida').innerText = arrayProducts[0].nombre;
    document.getElementById('precioComida').innerText = "Precio: $" + arrayProducts[0].precio;
    document.getElementById('cantidadComida').innerText = "Cantidad: " + arrayProducts[0].cantidad;
    document.getElementById('nombreBebida').innerText = arrayProducts[1].nombre;
    document.getElementById('precioBebida').innerText = "Precio: $" + arrayProducts[1].precio;
    document.getElementById('cantidadBebida').innerText = "Cantidad: " + arrayProducts[1].cantidad;
    document.getElementById('nombrePostre').innerText = arrayProducts[2].nombre;
    document.getElementById('precioPostre').innerText = "Precio: $" + arrayProducts[2].precio;
    document.getElementById('cantidadPostre').innerText = "Cantidad: " + arrayProducts[2].cantidad;
  }
  if (isMobile()) {
    console.log("Estás usando un dispositivo móvil");
  } else {
    console.log("Estás usando un escritorio");
  }
})

