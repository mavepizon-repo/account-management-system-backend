require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const clientRoutes = require("./routes/clientRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const subcontractRoutes = require("./routes/subcontractRoutes");

const app = express();

// connect database
connectDB();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/client", clientRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/receipt", receiptRoutes);
app.use("/api/subcontract", subcontractRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


