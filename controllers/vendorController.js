const Vendor = require("../models/Vendor");

// CREATE VENDOR
exports.createVendor = async (req, res) => {
  try {

    const lastVendor = await Vendor.findOne().sort({ createdAt: -1 });

    let vendorCode = "VN001";

    if (lastVendor && lastVendor.vendorCode) {
      const num = parseInt(lastVendor.vendorCode.substring(2)) + 1;
      vendorCode = "VN" + String(num).padStart(3, "0");
    }

    const vendor = new Vendor({
      vendorCode,
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      gstNo: req.body.gstNo,
      notes: req.body.notes
    });

    const savedVendor = await vendor.save();

    res.status(201).json(savedVendor);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL VENDORS
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET VENDOR BY ID
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(vendor);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE VENDOR
exports.updateVendor = async (req, res) => {
  try {
    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedVendor);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE VENDOR
exports.deleteVendor = async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET Vendor Name + Code (for dropdown)
exports.getVendorNameAndCode = async (req, res) => {
  try {

    const vendors = await Vendor.find()
      .select("vendorCode name");

    res.status(200).json({
      count: vendors.length,
      data: vendors
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};