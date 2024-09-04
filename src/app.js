const express = require("express");
const bodyParser = require("body-parser");
const postgres = require("postgres");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env;
PGPASSWORD = decodeURIComponent(PGPASSWORD);

// Configuración de la conexión con Neon.tech usando el paquete `postgres`
const sql = postgres({
  host: PGHOST,
  database: PGDATABASE,
  username: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: "require",
  connection: {
    options: `project=${ENDPOINT_ID}`,
  },
});

// Función para verificar la conexión y obtener la versión de PostgreSQL
async function getPgVersion() {
  try {
    const result = await sql`select version()`;
    console.log("PostgreSQL version:", result);
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

getPgVersion();

// Ruta para recibir datos del sensor y guardarlos en la base de datos
app.post("/data", async (req, res) => {
  const { temperature, humidity } = req.body;

  if (typeof temperature === "undefined" || typeof humidity === "undefined") {
    return res.status(400).send("Faltan los datos de temperatura o humedad");
  }

  const id = uuidv4();

  try {
    // Inserta los datos en la base de datos usando una consulta SQL
    await sql`
      INSERT INTO "Climate" (id, temperature, humidity)
      VALUES (${id} ,${temperature}, ${humidity})
    `;
    res.status(200).send("Datos insertados con éxito");
  } catch (error) {
    console.error("Error al insertar los datos:", error);
    res.status(500).send("Error al insertar los datos");
  }
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
