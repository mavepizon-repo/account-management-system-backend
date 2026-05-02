require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const clientRoutes = require("./routes/client/clientRoutes");
const invoiceRoutes = require("./routes/client/invoiceRoutes");
const receiptRoutes = require("./routes/client/receiptRoutes");
const vendorRoutes = require('./routes/vendor/vendorRoutes');
const purchaseRoutes = require('./routes/vendor/purchaseRoutes');
const subcontractRoutes = require("./routes/subcontractor/subcontractRoutes");
const workSubcontractRoutes = require("./routes/subcontractor/workSubcontractRoutes");

const app = express();

const voucherRoutes = require("./routes/vendor/voucherRoutes");

const labourRoutes = require("./routes/labour/labourRoutes");

const attendanceRoutes = require("./routes/labour/attendanceRoutes");

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

app.use("/api/advancePayment", advanceRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



