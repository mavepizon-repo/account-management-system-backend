const express = require('express');
const router = express.Router();
const { getVendorNameAndCode } = require('../../controllers/vendor/vendorController');

const {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor
} = require('../../controllers/vendor/vendorController');

router.post('/add', createVendor);
router.get('/getall', getVendors);
router.get('/get/:id', getVendorById);
router.put('/edit/:id', updateVendor);
router.delete('/delete/:id', deleteVendor);

router.get('/dropdown', getVendorNameAndCode);

module.exports = router;