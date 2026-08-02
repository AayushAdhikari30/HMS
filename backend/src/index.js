import "dotenv/config";
import app from "./app.js";
import sequelize from "./db/connection.js";
import "./models/index.js";

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established");

    await sequelize.sync({ alter: process.env.NODE_ENV === "development", force: false });
    console.log("Models synced");

    const server = app.listen(PORT, HOST, () => {
      console.log(`HMS server running on http://${HOST}:${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the conflicting process or choose a different PORT.`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });
  } catch (err) {
    console.log("Failed to start server: ", err);
    process.exit(1);
  }
};

start();