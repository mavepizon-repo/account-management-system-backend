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
      email: req.body.email,
      address: req.body.address,
      gstNo: req.body.gstNo,
      website: req.body.website
    });

    const savedVendor = await vendor.save();

    res.status(201).json({
      message: "Vendor created successfully",
      data: savedVendor
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// GET ALL VENDORS
exports.getVendors = async (req, res) => {
  try {

    const vendors = await Vendor.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: vendors.length,
      data: vendors
    });

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

    res.status(200).json(vendor);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// UPDATE VENDOR
exports.updateVendor = async (req, res) => {
  try {

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: "Vendor updated successfully",
      data: updatedVendor
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// DELETE VENDOR
exports.deleteVendor = async (req, res) => {
  try {

    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    await Vendor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Vendor deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// GET Vendor Name + Code (for dropdown)
exports.getVendorNameAndCode = async (req, res) => {
  try {

    const vendors = await Vendor.find()
      .select("vendorCode name")
      .sort({ name: 1 });

    res.status(200).json({
      count: vendors.length,
      data: vendors
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};