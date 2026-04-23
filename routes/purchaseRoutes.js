// const express = require('express');
// const router = express.Router();



// const {
//   createPurchase,
//   getPurchases,
//   getPurchaseById,
//   getPurchasesByVendor,
//   updatePurchase,
//   updatePayment,
//   deletePurchase
// } = require('../controllers/purchaseController');

// // controller import pannanum
// const {
//   getPurchasesByStatus
// } = require('../controllers/purchaseController');

// // ================== PURCHASE BILL ==================

// // ✅ CREATE PURCHASE BILL
// router.post('/add/purchasebill', createPurchase);


// // ✅ GET ALL PURCHASE BILLS
// router.get('/getall/purchasebill', getPurchases);


// // ✅ GET PURCHASE BILL BY ID
// router.get('/get/purchasebill/:id', getPurchaseById);


// // ✅ GET PURCHASE BILL BY VENDOR
// router.get('/get/purchasebill/vendor/:vendorId', getPurchasesByVendor);


// // ✅ UPDATE PURCHASE BILL
// router.put('/edit/purchasebill/:id', updatePurchase);


// // ✅ UPDATE PAYMENT (STATUS AUTO)
// router.put('/pay/purchasebill/:id', updatePayment);


// // ✅ DELETE PURCHASE BILL
// router.delete('/delete/purchasebill/:id', deletePurchase);


// // STATUS WISE (paid,unpaid,partial)
// router.get('/status/:status', getPurchasesByStatus);

// // VENDOR ID + STATUS 
// router.get('/vendor/:vendorId/:status', getPurchasesByVendorAndStatus);

// module.exports = router;

// ================================
const express = require('express');
const router = express.Router();

const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  getPurchasesByVendor,
  getPurchasesByVendorAndStatus,
  getPurchasesByStatus,
  updatePurchase,
  updatePayment,
  deletePurchase
} = require('../controllers/purchaseController');


// ================== PURCHASE BILL ==================

// CREATE
router.post('/add/purchasebill', createPurchase);

// GET ALL
router.get('/getall/purchasebill', getPurchases);

// GET BY ID
router.get('/get/purchasebill/:id', getPurchaseById);

// GET BY VENDOR
router.get('/get/purchasebill/vendor/:vendorId', getPurchasesByVendor);

// UPDATE
router.put('/edit/purchasebill/:id', updatePurchase);

// PAYMENT
router.put('/pay/purchasebill/:id', updatePayment);

// DELETE
router.delete('/delete/purchasebill/:id', deletePurchase);

// STATUS WISE
router.get('/status/:status', getPurchasesByStatus);


// VENDOR + STATUS
router.get('/vendor/:vendorId/:status', getPurchasesByVendorAndStatus);

//VENDOR ID + TOTAL PURCHASE BILL
router.get('/vendor/:vendorId', getPurchasesByVendor);

module.exports = router;