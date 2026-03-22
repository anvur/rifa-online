const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname)));

// Ruta principal: sirve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- Lógica de la rifa ---
let boletos = require("./boletos.json");

// Cuando un cliente se conecta
io.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Enviar estado inicial
  socket.emit("estado", boletos);

  // Reservar un número
  socket.on("reservar", (numero) => {
    if (!boletos[numero]) {
      boletos[numero] = true;
      fs.writeFileSync("boletos.json", JSON.stringify(boletos, null, 2));
      io.emit("estado", boletos);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Iniciar servidor
http.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
