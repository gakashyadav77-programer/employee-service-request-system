const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const managerRoutes = require("./routes/managerRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Employee Service Request System API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/manager", managerRoutes);

async function startServer() {
  try {
    const connection = await db.getConnection();

    console.log("MySQL connected successfully");

    connection.release();

    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
}

startServer();