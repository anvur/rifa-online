// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Ruta del archivo donde se guardan los boletos
const DATA_FILE = path.join(__dirname, "boletos.json");

// Cargar boletos desde archivo si existe
let boletos = {};
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    boletos = JSON.parse(data);
    console.log("Boletos cargados desde archivo.");
  } catch (err) {
    console.error("Error leyendo boletos.json:", err);
  }
}

// Usuarios válidos
const usuarios = {
  "JPACHAS": "ERICK2026",
  "KPACHAS": "ERICK2026",
  "CPACHAS": "ERICK2026",
  "NBRAVO": "ERICK2026"
};

// Guardar boletos en archivo
function guardarBoletos() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(boletos, null, 2), "utf8");
    console.log("Boletos guardados en archivo.");
  } catch (err) {
    console.error("Error guardando boletos.json:", err);
  }
}

// Endpoint para exportar CSV
app.get("/exportar", (req, res) => {
  let csvContent = "Número;Nombre;Usuario\n";
  for (let i = 1; i <= 250; i++) {
    if (boletos[i]) {
      csvContent += `${i};${boletos[i].nombre};${boletos[i].usuario}\n`;
    } else {
      csvContent += `${i};;\n`;
    }
  }
  res.setHeader("Content-disposition", "attachment; filename=rifa_1_250.csv");
  res.set("Content-Type", "text/csv");
  res.send(csvContent);
});

// Conexión de clientes
io.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Enviar estado inicial
  socket.emit("estado", boletos);

  // Validación de login desde frontend
  socket.on("login", ({ usuario, clave }) => {
    console.log("Intento de login:", usuario, clave);
    if (usuarios[usuario] && usuarios[usuario] === clave) {
      socket.emit("login_ok", { usuario });
      console.log("Login correcto:", usuario);
    } else {
      socket.emit("login_error", "Usuario o contraseña incorrectos");
      console.log("Login fallido");
    }
  });

  // Escuchar selección de boleto
  socket.on("seleccionar", ({ numero, nombre, usuario }) => {
    if (boletos[numero]) {
      // Ya ocupado, no permitir sobreescribir
      socket.emit("seleccion_error", `El número ${numero} ya está ocupado por ${boletos[numero].usuario}`);
      console.log(`Intento inválido: ${usuario} quiso ocupar ${numero}, pero ya está ocupado.`);
    } else {
      boletos[numero] = { nombre, usuario };
      console.log(`Boleto ${numero} ocupado por ${usuario} (${nombre})`);
      guardarBoletos();
      io.emit("estado", boletos); // Actualizar a todos
    }
  });

  // Escuchar liberación de boleto
  socket.on("liberar", (numero) => {
    if (boletos[numero]) {
      delete boletos[numero];
      console.log(`Boleto ${numero} liberado`);
      guardarBoletos();
      io.emit("estado", boletos);
    }
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
