// const express = require('express');
// const router = express.Router();

// const {
//   createPurchase,
//   getPurchases,
//   getPurchasesByVendor,
//   updatePayment
// } = require('../controllers/purchaseController');


// // CREATE PURCHASE (Admin adds bill)
// router.post('/abi/purchase/add', createPurchase);


// // GET ALL PURCHASES
// router.get('/abi/purchase/get', getPurchases);


// // GET PURCHASE BY VENDOR (tracking)
// router.get('/abi/purchase/vendor/:vendorId', getPurchasesByVendor);


// // UPDATE PAYMENT (paid / partial / unpaid auto)
// router.put('/abi/purchase/pay/:id', updatePayment);


// module.exports = router;

// ====================
// const express = require('express');
// const router = express.Router();

// const {
//   createPurchase,
//   getPurchases,
//   getPurchasesByVendor,
//   updatePayment,
//   deletePurchase  

// } = require('../controllers/purchaseController');

// router.post('/add', createPurchase);
// router.get('/getall', getPurchases);
// router.get('/vendor/:vendorId', getPurchasesByVendor);
// router.put('/pay/:id', updatePayment);
// router.delete('/:id', deletePurchase);

// module.exports = router;

// ======================
const express = require('express');
const router = express.Router();

const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  getPurchasesByVendor,
  updatePurchase,
  updatePayment,
  deletePurchase
} = require('../controllers/purchaseController');


// ================== PURCHASE BILL ==================

// ✅ CREATE PURCHASE BILL
router.post('/add/purchasebill', createPurchase);


// ✅ GET ALL PURCHASE BILLS
router.get('/getall/purchasebill', getPurchases);


// ✅ GET PURCHASE BILL BY ID
router.get('/get/purchasebill/:id', getPurchaseById);


// ✅ GET PURCHASE BILL BY VENDOR
router.get('/get/purchasebill/vendor/:vendorId', getPurchasesByVendor);


// ✅ UPDATE PURCHASE BILL
router.put('/edit/purchasebill/:id', updatePurchase);


// ✅ UPDATE PAYMENT (STATUS AUTO)
router.put('/pay/purchasebill/:id', updatePayment);


// ✅ DELETE PURCHASE BILL
router.delete('/delete/purchasebill/:id', deletePurchase);


module.exports = router;