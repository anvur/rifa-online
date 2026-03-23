const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos (CSS, JS, imágenes) desde carpeta public
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal: sirve index.html desde carpeta public
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Lógica de la rifa ---
let boletos = require("./boletos.json");

// Usuarios válidos
const usuariosValidos = {
  "JPACHAS": "1234",
  "KPACHAS": "2222",
  "CPACHAS": "3333",
  "NBRAVO": "0000",
  "JTERR": "5555"
};

// Cuando un cliente se conecta
io.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Enviar estado inicial
  socket.emit("estado", boletos);

  // --- Lógica de login ---
  socket.on("login", ({ usuario, clave }) => {
    console.log("Intento de login:", usuario, clave);
    if (usuariosValidos[usuario] && usuariosValidos[usuario] === clave) {
      console.log("Login correcto:", usuario);
      socket.emit("login_ok", { usuario });
    } else {
      console.log("Login fallido:", usuario);
      socket.emit("login_error", "Usuario o clave incorrectos");
    }
  });

  // Reservar un número
  socket.on("seleccionar", ({ numero, nombre, usuario }) => {
    if (!boletos[numero]) {
      boletos[numero] = { nombre, usuario };
      fs.writeFileSync("boletos.json", JSON.stringify(boletos, null, 2));
      io.emit("estado", boletos);
    } else {
      socket.emit("seleccion_error", "Ese número ya está ocupado");
    }
  });

  // Forzar actualización
  socket.on("estado_request", () => {
    socket.emit("estado", boletos);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Iniciar servidor
http.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
