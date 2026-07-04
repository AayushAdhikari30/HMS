import "dotenv/config";
import app from "./app.js";
import sequelize from "./db/connection.js";
import "./models/index.js";

const PORT = process.env.PORT || 8000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established");

    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("Models synced");

    app.listen(PORT, () => {
      console.log(`HMS server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log("Failed to start server: ", err);
    process.exit(1);
  }
};

start();