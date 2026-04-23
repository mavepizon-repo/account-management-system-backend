require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const clientRoutes = require("./routes/clientRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const subcontractRoutes = require("./routes/subcontractRoutes");
const workSubcontractRoutes = require("./routes/workSubcontractRoutes");

const app = express();

const voucherRoutes = require("./routes/voucherRoutes");

const labourRoutes = require("./routes/labourRoutes");

const attendanceRoutes = require("./routes/attendanceRoutes");

// connect database
connectDB();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/client", clientRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/receipt", receiptRoutes);

app.use("/api/vendor", vendorRoutes);
app.use("/api/purchase", purchaseRoutes);

app.use("/api/subcontract", subcontractRoutes);
app.use("/api/workSubcontract", workSubcontractRoutes);

app.use('/api/purchases', purchaseRoutes);

app.use('/uploads', express.static('uploads'));

app.use("/api/vouchers", voucherRoutes);

app.use("/api/labours", labourRoutes);

app.use("/api/attendance", attendanceRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



