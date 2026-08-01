require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
    res.send("Backend Running Successfully");
});

// --- API Routes (one per module of the Stationery Management System) ---
app.use("/api/cashbook", require("./routes/cashbook"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/sales", require("./routes/dailySales"));
app.use("/api/purchases", require("./routes/purchases"));
app.use("/api/partnerships", require("./routes/partnerships"));
app.use("/api/photocopy", require("./routes/photocopy"));
app.use("/api/mobile-banking", require("./routes/mobileBanking"));
app.use("/api/mini-summary", require("./routes/miniSummary"));
app.use("/api/users", require("./routes/users"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/backup", require("./routes/backup"));

// 404 fallback for unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server Running on http://localhost:${PORT}`);
});