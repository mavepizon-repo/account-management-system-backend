const express = require("express");
const router = express.Router();

const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  getPurchasesByVendorId,
  getPurchasesByStatus,
  getPurchasesByStatusAndVendor,
  updatePurchase,
  updatePurchaseProducts,
  deletePurchase
} = require("../../controllers/vendor/purchaseController");


// CREATE
router.post("/add", createPurchase);

// GET ALL
router.get("/all", getAllPurchases);

// VENDOR
router.get("/get-by-vendor/:vendorId", getPurchasesByVendorId);

// STATUS
router.get("/get-by-status/:paymentStatus", getPurchasesByStatus);

// VENDOR + STATUS
router.get(
  "/get-by-status-vendor/:vendorId/:paymentStatus",
  getPurchasesByStatusAndVendor
);

// GET BY ID (keep last)
router.get("/get/:purchaseId", getPurchaseById);

// UPDATE
router.put("/update/:purchaseId", updatePurchase);

// UPDATE PRODUCTS
router.put("/update-products/:purchaseId", updatePurchaseProducts);

// DELETE
router.delete("/delete/:purchaseId", deletePurchase);

module.exports = router;