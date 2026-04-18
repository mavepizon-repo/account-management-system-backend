const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const clientRoutes = require("./routes/clientRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');

dotenv.config();

const app = express();

// connect database
connectDB();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/client", clientRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/purchase", purchaseRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});