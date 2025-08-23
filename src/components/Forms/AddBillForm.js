import React, { useState, useRef, useEffect } from "react";
import {
  FaBuilding,
  FaUser,
  FaPlus,
  FaTrash,
  FaPaperclip,
  FaFilePdf,
  FaFileImage,
  FaTimes,
  FaSave,
  FaUpload,
} from "react-icons/fa";
import FilePreviewer from "../ui/FilePreviewer";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchVendors,
  updateVendorCredit,
} from "../../redux/slices/vendorSlice";
import { addBill, updateBill } from "../../redux/slices/BillSlice";
import { toast } from "sonner";
import { ToWords } from 'to-words';

const AutoGrowTextarea = ({ className, ...props }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [props.value]);

  return (
    <textarea
      ref={textareaRef}
      rows="1"
      className={`${className} resize-none overflow-hidden text-xs`}
      style={{ 
        fontSize: '12px',
        lineHeight: '1.2'
      }}
      {...props}
    />
  );
};

const BillUploadUI = ({ onFileUpload, uploadedImage, error, onRemoveFile }) => {
  const [dragActive, setDragActive] = useState(false);
  const [scale, setScale] = useState(0); // 0 = fit to container, 1.0 = 100%, etc.

  const handleFileChange = (file) => {
    if (file) {
      onFileUpload(file);
    } else {
      onRemoveFile();
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileChange(file);
    }
  };

  const handleRemoveFile = () => {
    onRemoveFile();
    setScale(0); // Reset zoom when removing file
  };

  if (uploadedImage) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 relative">
          <FilePreviewer
            file={uploadedImage}
            className="h-full w-full"
            scale={scale}
          />
          
          {/* Zoom Controls Overlay */}
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-white bg-opacity-90 rounded-lg shadow-md p-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Zoom:</span>
                <span>{scale === 0 ? 'Fit' : `${Math.round(scale * 100)}%`}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* File Controls */}
        <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaFileImage className="text-blue-500" />
            <span className="font-medium">
              {uploadedImage.name || 'Uploaded File'}
            </span>
            {uploadedImage.size && uploadedImage.size > 0 && (
              <span className="text-gray-500">
                ({(uploadedImage.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
            {uploadedImage.isExistingAttachment && (
              <span className="text-blue-600 text-xs bg-blue-100 px-2 py-1 rounded-full">
                Existing
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {scale !== 0 && (
              <button
                type="button"
                onClick={() => setScale(0)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Reset zoom to fit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              title="Remove file"
            >
              <FaTrash className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div
          className={`h-full border-2 border-dashed rounded-lg transition-all duration-200 ${
            dragActive
              ? "border-blue-400 bg-blue-50 scale-105 shadow-lg"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <div className={`transition-transform duration-200 ${dragActive ? 'scale-110' : ''}`}>
                <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Upload Bill Document
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Click to browse or drag and drop your file here
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Supported formats: JPG, JPEG, PNG, BMP, TIFF, PDF
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Maximum file size: 10MB
              </p>
              
              <label className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-all hover:scale-105 active:scale-95">
                <FaPaperclip className="mr-2" />
                Choose File
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.bmp,.tiff,.pdf"
                  onChange={handleFileInput}
                />
              </label>
              
              {dragActive && (
                <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    Drop your file here to upload
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 text-red-600 bg-red-100 border border-red-300 p-3 rounded-lg text-left">
          <strong>❌ Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

//const mockCompanies = [
//  {
//    id: 1,
//    name: "ABC Pvt Ltd",
//    gstin: "27DEFGH5678I2A6",
//    departments: ["IT Department", "Finance", "HR"],
//  },
//  {
//    id: 2,
//    name: "DEF Solutions",
//    gstin: "29LMNOP1234Q5Z6",
//    departments: ["Operations", "Sales"],
//  },
//];

const BillForm = ({ bill, onCancel }) => {
  const companyId = sessionStorage.getItem("employeeCompanyId");
  const dispatch = useDispatch();
  const isEditMode = !!bill;
  
  // Initialize ToWords for converting numbers to words
  const toWords = new ToWords({
    localeCode: 'en-IN',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
    }
  });

  const mainCardRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);
  const {
    vendors,
    loading,
    error: vendorError,
  } = useSelector((state) => state.vendors);

  //const [companies] = useState(mockCompanies);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");
  const [reference, setReference] = useState("");
  const [billLines, setBillLines] = useState([
    {
      item: "",
      hsn: "",
      qty: 1,
      uom: "PCS",
      rate: 0,
      gst: 18,
      cgst: 9,
      sgst: 9,
      igst: 18,
    },
  ]);
  const [showDeleteIdx, setShowDeleteIdx] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("billLines");
  const [vendorCredits, setVendorCredits] = useState([]);
  const [placeOfSupply, setPlaceOfSupply] = useState("interstate");


  // Pre-fill form data when bill prop is provided (edit mode)
  useEffect(() => {
    if (bill) {
      setBillNumber(bill.billNumber || "");
      setBillDate(bill.billDate || new Date().toISOString().slice(0, 10));
      setDueDate(bill.dueDate || "");
      setReference(bill.billReference || "");
      setPlaceOfSupply(bill.placeOfSupply || "interstate");

      if (bill.billLineItems && bill.billLineItems.length > 0) {
        const mappedLines = bill.billLineItems.map((line) => ({
          item: line.productOrService || "",
          hsn: line.hsnOrSac || "",
          qty: line.quantity || 1,
          uom: line.uom || "PCS",
          rate: line.rate || 0,
          gst: line.gstPercent || 18,
          cgst: line.cgstPercent || 9,
          sgst: line.sgstPercent || 9,
          igst: line.igstPercent || 18,
        }));
        setBillLines(mappedLines);
      } else {
        setBillLines([
          {
            item: "",
            hsn: "",
            qty: 1,
            uom: "PCS",
            rate: 0,
            gst: 18,
            cgst: 9,
            sgst: 9,
            igst: 18,
          },
        ]);
      }

      // Auto-load first attachment into preview if present
      try {
        const attachmentSource = bill.attachmentUrls;
        let firstUrl = null;
        if (Array.isArray(attachmentSource) && attachmentSource.length > 0) {
          firstUrl = attachmentSource[0];
        } else if (
          typeof attachmentSource === "string" &&
          attachmentSource.trim().length > 0 &&
          attachmentSource !== "Yes"
        ) {
          firstUrl = attachmentSource;
        }
        if (firstUrl) {
          // Create a file-like object for the existing attachment
          const existingFile = {
            name: bill.billNumber ? `Bill_${bill.billNumber}.pdf` : 'Existing_Attachment.pdf',
            type: 'application/pdf', // Default to PDF for existing attachments
            size: 0, // Size unknown for existing files
            // Add a flag to indicate this is an existing attachment
            isExistingAttachment: true,
            url: firstUrl
          };
          setUploadedImage(existingFile);
          setUploadedFile(null);
        }
      } catch (e) {
        // Ignore attachment preload errors
      }

      if (bill.vendorId && vendors.length > 0) {
        const vendor = vendors.find((v) => v.vendorId === bill.vendorId);
        if (vendor) {
          setSelectedVendor(vendor);
        }
      }
    }
  }, [bill, vendors]);

  useEffect(() => {
    if (!selectedVendor) {
      setActiveTab("billLines");
    }
  }, [selectedVendor]);

  const handleFileUpload = (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff', 'application/pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'pdf'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload JPG, JPEG, PNG, BMP, TIFF, or PDF files only.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum allowed size is 10MB.');
      return;
    }

    setError(null);
    setUploadedFile(file);
    setUploadedImage(file);

    console.log(
      "File uploaded successfully:",
      file.name,
      `(${(file.size / 1024 / 1024).toFixed(2)}MB)`
    );
    
    toast.success(`File "${file.name}" uploaded successfully!`);
  };

  const handleRemoveFile = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    setError(null);
    toast.success("File removed successfully");
  };

  // Calculate totals
  const subtotal = billLines && billLines.length > 0 ? billLines.reduce((sum, l) => {
    const qty = Number(l.qty) || 0;
    const rate = Number(l.rate) || 0;
    return sum + (qty * rate);
  }, 0) : 0;
  
  const totalGST = billLines && billLines.length > 0 ? billLines.reduce((sum, l) => {
    const qty = Number(l.qty) || 0;
    const rate = Number(l.rate) || 0;
    const gst = Number(l.gst) || 0;
    return sum + (qty * rate * (gst / 100));
  }, 0) : 0;
  
  const totalCGST = billLines && billLines.length > 0 ? billLines.reduce((sum, l) => {
    const qty = Number(l.qty) || 0;
    const rate = Number(l.rate) || 0;
    const cgst = Number(l.cgst) || 0;
    return sum + (qty * rate * (cgst / 100));
  }, 0) : 0;
  
  const totalSGST = billLines && billLines.length > 0 ? billLines.reduce((sum, l) => {
    const qty = Number(l.qty) || 0;
    const rate = Number(l.rate) || 0;
    const sgst = Number(l.sgst) || 0;
    return sum + (qty * rate * (sgst / 100));
  }, 0) : 0;
  
  const totalIGST = billLines && billLines.length > 0 ? billLines.reduce((sum, l) => {
    const qty = Number(l.qty) || 0;
    const rate = Number(l.rate) || 0;
    const igst = Number(l.igst) || 0;
    return sum + (qty * rate * (igst / 100));
  }, 0) : 0;
  
  const total =
    (placeOfSupply === "interstate")
      ? (subtotal || 0) + (totalCGST || 0) + (totalSGST || 0)
      : (subtotal || 0) + (totalIGST || 0);



  // Validation helpers
  const validate = () => {
    const errs = {};
    if (!selectedVendor) errs.vendor = "Vendor is required";
    if (!billNumber) errs.billNumber = "Bill Number is required";
    if (!billDate) errs.billDate = "Bill Date is required";
    if (!billLines.length) errs.billLines = "At least one line item required";
    billLines.forEach((l, i) => {
      if (!l.item) errs[`item${i}`] = "Description required";
      if (!l.qty || l.qty <= 0) errs[`qty${i}`] = "Qty must be positive";
      if (!l.rate || l.rate <= 0) errs[`rate${i}`] = "Rate must be positive";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handlers
  const handleVendorChange = (e) => {
    const selectedValue = e.target.value;

    if (!vendors || vendors.length === 0) {
      setSelectedVendor(null);
      return;
    }

    const v = vendors.find((v) => v.vendorId === selectedValue);
    setSelectedVendor(v);
  };

  //const handleCompanyChange = (e) => {
  //  const c = companies.find((c) => c.id === Number(e.target.value));
  //  setSelectedCompany(c);
  //  setSelectedDepartment("");
  //};

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleLineChange = (idx, field, value) => {
    setBillLines((previousLines) => {
      const updatedLines = [...previousLines];
      const line = { ...updatedLines[idx] };
      if (field === "gst") {
        const gstValue = Number(value) || 0;
        line.gst = gstValue;
        if (placeOfSupply === "interstate") {
          // Split equally between CGST and SGST, no IGST
          line.cgst = gstValue / 2;
          line.sgst = gstValue / 2;
          line.igst = 0;
        } else {
          // Use IGST only
          line.igst = gstValue;
          line.cgst = 0;
          line.sgst = 0;
        }
      } else {
        // Ensure numeric fields are properly converted to numbers
        if (field === "qty" || field === "rate" || field === "cgst" || field === "sgst" || field === "igst") {
          line[field] = Number(value) || 0;
        } else {
          line[field] = value;
        }
      }
      updatedLines[idx] = line;
      return updatedLines;
    });
  };

  const handleAddLine = () => {
    setBillLines((prev) => [
      ...prev,
      {
        item: "",
        hsn: "",
        qty: 1,
        uom: "PCS",
        rate: 0,
        gst: 18,
        cgst: 9,
        sgst: 9,
        igst: 18,
      },
    ]);
  };

  const handleDeleteLine = (idx) => {
    setShowDeleteIdx(idx);
  };

  const confirmDeleteLine = () => {
    setBillLines((lines) => lines.filter((_, i) => i !== showDeleteIdx));
    setShowDeleteIdx(null);
  };

  const cancelDeleteLine = () => setShowDeleteIdx(null);

  const handleAddVendorCredit = () => {
    setVendorCredits((prev) => [
      ...prev,
      {
        id: Date.now(),
        creditDate: new Date().toISOString().slice(0, 10),
        creditAmount: "",
        creditDescription: "",
      },
    ]);
  };

  const handleVendorCreditChange = (id, field, value) => {
    setVendorCredits((prev) =>
      prev.map((vc) => (vc.id === id ? { ...vc, [field]: value } : vc))
    );
  };

  const handleRemoveVendorCredit = (id) => {
    setVendorCredits((prev) => prev.filter((vc) => vc.id !== id));
  };



  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      console.log("Validation failed");
      console.log(errors);
      return;
    }

    setIsSubmitting(true);

    const billData = {
      companyId: companyId,
      vendorId: selectedVendor?.vendorId,
      //gstin: selectedVendor?.gstin || "",
      //vendorAddress: selectedVendor?.addressLine1 || "",
      tdsPercentage: selectedVendor?.tdsPercentage || null,
      placeOfSupply: placeOfSupply,
      billNumber: billNumber,
      billReference: reference,
      billDate: billDate,
      dueDate: dueDate,

      billLineItems: billLines.map((line) => {
        const qty = Number(line.qty) || 0;
        const rate = Number(line.rate) || 0;
        const gst = Number(line.gst) || 18;
        const cgst = Number(line.cgst) || 9;
        const sgst = Number(line.sgst) || 9;
        const igst = Number(line.igst) || 18;
        const amount = qty * rate;
        const gstAmount = amount * (gst / 100);
        const cgstAmount = amount * (cgst / 100);
        const sgstAmount = amount * (sgst / 100);
        const igstAmount = amount * (igst / 100);
        const totalAmount =
          amount +
          (placeOfSupply === "interstate"
            ? cgstAmount + sgstAmount
            : igstAmount);

        return {
          productOrService: line.item,
          description: line.item,
          hsnOrSac: line.hsn,
          quantity: qty,
          uom: line.uom,
          rate: rate,
          amount: amount,
          gstPercent: gst,
          cgstPercent: cgst,
          sgstPercent: sgst,
          igstPercent: igst,
          gstAmount: gstAmount,
          cgstAmount: cgstAmount,
          sgstAmount: sgstAmount,
          igstAmount: igstAmount,
          totalAmount: totalAmount,
        };
      }),
      totalBeforeGST: subtotal,
      totalGST: totalGST,
      totalCGST: totalCGST,
      totalSGST: totalSGST,
      totalIGST: totalIGST,
      finalAmount: total,
    };

    try {
      if (isEditMode) {
        const updateData = {
          ...billData,
          billId: bill.billId || bill.id,
          updatedAt: new Date().toISOString(),
        };

        const formData = new FormData();
        formData.append("bill", JSON.stringify(updateData));

        // Add uploaded file if exists
        if (uploadedFile) {
          formData.append("attachment", uploadedFile);
        }

        const result = await dispatch(
          updateBill({ formData, billId: bill.billId || bill.id })
        ).unwrap();
        if (result) {
          console.log("Bill updated successfully:", result);
          
          // Show success message with bill details
          toast.success(`Bill updated successfully!`, {
            description: `Bill Number: ${result.billNumber || billData.billNumber} | Amount: ₹${result.finalAmount || billData.finalAmount} | Vendor: ${selectedVendor?.vendorName || 'N/A'}`
          });
          onCancel();
        }
      } else {
        const formData = new FormData();
        formData.append("bill", JSON.stringify(billData));

        // Add uploaded file if exists
        if (uploadedFile) {
          formData.append("attachment", uploadedFile);
        }

        const result = await dispatch(addBill(formData)).unwrap();
        if (result) {
          console.log("Bill created successfully:", result);
          
          // Show success message with bill details
          toast.success(`Bill created successfully!`, {
            description: `Bill Number: ${result.billNumber || billData.billNumber} | Amount: ₹${result.finalAmount || billData.finalAmount} | Vendor: ${selectedVendor?.vendorName || 'N/A'}`
          });
          onCancel();
        }
      }
    } catch (error) {
      console.error("Error saving bill:", error);
      alert(`Error saving bill: ${error.message || "Unknown error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVendorCreditSubmit = () => {
    console.log(vendorCredits);
    dispatch(
      updateVendorCredit({
        vendorId: selectedVendor.vendorId,
        vendorCredits: vendorCredits,
      })
    );
  };

  console.log(selectedVendor);

  // Render
  return (
    <div className="flex flex-col h-screen">


            {/* Main Content */}
      <main className="flex-1 overflow-hidden pl-0 pr-2 pt-0 pb-2 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 h-full min-w-0">
          {/* Form Panel (Left) */}
          <div className="lg:col-span-1 overflow-hidden pb-8 min-w-0">

          {/* Form Content */}
          <div className="space-y-2 pb-4 overflow-y-auto h-full" ref={mainCardRef}>

            
            {/* Top Section - Vendor, Bill, and Company Details */}
            <div className="flex flex-col lg:flex-row gap-2">
              {/* Vendor Details */}
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-semibold border-b pb-1 mb-1 text-gray-900">
                  Vendor Details
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={selectedVendor?.vendorId || ""}
                    onChange={handleVendorChange}
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((v) => (
                      <option key={v.vendorId} value={v.vendorId}>
                        {v.vendorName}
                      </option>
                    ))}
                  </select>
                  {errors.vendor && (
                    <div className="text-xs text-red-500 mt-1">
                      {errors.vendor}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor GSTIN
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none"
                    value={selectedVendor?.gstin || ""}
                    placeholder="Auto-filled from vendor"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Place of Supply
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={placeOfSupply}
                    onChange={(e) => {
                      const newPlaceOfSupply = e.target.value;
                      setPlaceOfSupply(newPlaceOfSupply);

                      // Update line items based on place of supply
                      if (newPlaceOfSupply === "intrastate") {
                        // Convert CGST + SGST to IGST
                        setBillLines((prev) =>
                          prev.map((line) => {
                            const igst =
                              Number(line.cgst) + Number(line.sgst) || 0;
                            return {
                              ...line,
                              igst,
                              cgst: 0,
                              sgst: 0,
                              gst: igst,
                            };
                          })
                        );
                      } else {
                        // Convert IGST to CGST and SGST (split equally)
                        setBillLines((prev) =>
                          prev.map((line) => {
                            const total = Number(line.igst) || 0;
                            return {
                              ...line,
                              cgst: total / 2,
                              sgst: total / 2,
                              igst: 0,
                              gst: total,
                            };
                          })
                        );
                      }
                    }}
                  >
                    <option value="interstate">Interstate</option>
                    <option value="intrastate">Intrastate</option>
                  </select>
                </div>
                {/*<div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none" 
                    value={selectedVendor?.gstin || ""} 
                    placeholder="Auto-filled from vendor"
                    readOnly 
                  />
                </div>*/}
                {/*<div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none" 
                    value={selectedVendor?.addressLine1 || ""} 
                    placeholder="Auto-filled from vendor"
                    rows={3}
                    readOnly 
                  />
                </div>*/}
              </div>

              {/* Bill Details */}
              <div className="flex-1 space-y-1">
                <h2 className="text-lg font-semibold border-b pb-1 mb-1 text-gray-900">
                  Bill Details
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter bill number"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                  />
                  {errors.billNumber && (
                    <div className="text-xs text-red-500 mt-1">
                      {errors.billNumber}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bill Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                    />
                    {errors.billDate && (
                      <div className="text-xs text-red-500 mt-1">
                        {errors.billDate}
                      </div>
                    )}
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={billDate}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="PO/Reference number"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mt-2">
              <div className="flex">
                <button
                  type="button"
                  className={`px-6 py-2 border-b-2 font-semibold transition-colors ${
                    activeTab === "billLines"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab("billLines")}
                >
                  Bill Lines
                </button>
                {selectedVendor && (
                  <button
                    type="button"
                    className={`px-6 py-2 border-b-2 font-semibold transition-colors ${
                      activeTab === "vendorCredit"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab("vendorCredit")}
                  >
                    Vendor Credit
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
              {activeTab === "billLines" && (
                <div className="space-y-4">
                  {errors.billLines && (
                    <div className="text-xs text-red-500">
                      {errors.billLines}
                    </div>
                  )}

                  <div>
                    <table className="w-full text-xs border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Sr.
                          </th>
                          <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            UOM
                          </th>
                          <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            GST%
                          </th>
                          <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </th>

                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {billLines.map((line, idx) => {
                          const qty = Number(line.qty) || 0;
                          const rate = Number(line.rate) || 0;
                          const gst = Number(line.gst) || 18;
                          const cgst = Number(line.cgst) || 9;
                          const sgst = Number(line.sgst) || 9;
                          const amount = qty * rate;
                          const gstAmount = amount * (gst / 100);
                          const total = amount + gstAmount;
                          return (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-2 py-2 text-center text-xs font-medium">
                                {idx + 1}
                              </td>
                              <td className="px-2 py-2">
                                <AutoGrowTextarea
                                  className={`w-full bg-transparent p-1 rounded-md focus:bg-white focus:ring-1 text-xs ${
                                    errors[`item${idx}`]
                                      ? "ring-red-500"
                                      : "focus:ring-blue-500"
                                  }`}
                                  value={line.item}
                                  onChange={(e) =>
                                    handleLineChange(
                                      idx,
                                      "item",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter description"
                                />
                                {errors[`item${idx}`] && (
                                  <div className="text-xs text-red-500 mt-1">
                                    {errors[`item${idx}`]}
                                  </div>
                                )}
                              </td>

                              <td className="px-2 py-2 text-center">
                                <input
                                  type="text"
                                  className={`w-full text-center bg-transparent p-1 rounded-md focus:bg-white focus:ring-1 text-xs ${
                                    errors[`qty${idx}`]
                                      ? "ring-red-500"
                                      : "focus:ring-blue-500"
                                  }`}
                                  value={line.qty}
                                  onChange={(e) =>
                                    handleLineChange(idx, "qty", e.target.value)
                                  }
                                  placeholder="1"
                                  style={{ fontSize: '11px' }}
                                />
                                {errors[`qty${idx}`] && (
                                  <div className="text-xs text-red-500 mt-1">
                                    {errors[`qty${idx}`]}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <select
                                  className="w-full text-center bg-transparent p-1 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs border border-gray-200"
                                  value={line.uom}
                                  onChange={(e) =>
                                    handleLineChange(idx, "uom", e.target.value)
                                  }
                                >
                                  <option value="PCS">PCS</option>
                                  <option value="KG">KG</option>
                                  <option value="LTR">LTR</option>
                                  <option value="MTR">MTR</option>
                                  <option value="SQM">SQM</option>
                                  <option value="NOS">NOS</option>
                                  <option value="HRS">HRS</option>
                                  <option value="DAY">DAY</option>
                                </select>
                              </td>
                              <td className="px-2 py-2 text-right">
                                <div className="flex items-center justify-end">
                                  <span className="text-gray-500 mr-0.5 text-xs">
                                    ₹
                                  </span>
                                  <input
                                    type="text"
                                    className={`w-full text-right bg-transparent p-1 rounded-md focus:bg-white focus:ring-1 text-xs ${
                                      errors[`rate${idx}`]
                                        ? "ring-red-500"
                                        : "focus:ring-blue-500"
                                    }`}
                                    value={line.rate}
                                    onChange={(e) =>
                                      handleLineChange(
                                        idx,
                                        "rate",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0"
                                    style={{ fontSize: '11px' }}
                                  />
                                </div>
                                {errors[`rate${idx}`] && (
                                  <div className="text-xs text-red-500 mt-1">
                                    {errors[`rate${idx}`]}
                                  </div>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <select
                                  className="w-full text-center bg-transparent p-1 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs border border-gray-200"
                                  value={line.gst}
                                  onChange={(e) =>
                                    handleLineChange(
                                      idx,
                                      "gst",
                                      Number(e.target.value)
                                    )
                                  }
                                >
                                  <option value={0}>0%</option>
                                  <option value={5}>5%</option>
                                  <option value={12}>12%</option>
                                  <option value={18}>18%</option>
                                  <option value={28}>28%</option>
                                </select>
                              </td>

                              <td className="px-2 py-2 text-right text-xs font-semibold">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="min-w-0 flex-1 text-right">
                                    ₹
                                    {isNaN(total) ? '0.00' : total.toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                  <button
                                    type="button"
                                    className="text-red-500 hover:text-red-700 transition-colors p-1 flex-shrink-0"
                                    onClick={() => handleDeleteLine(idx)}
                                    title="Delete line item"
                                  >
                                    <FaTrash className="text-sm" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="7" className="pt-4">
                            <button
                              type="button"
                              onClick={handleAddLine}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <FaPlus /> Add line item
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="mt-6 p-4 border-t border-gray-200 pt-6">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-700">
                        Subtotal (before GST):
                      </span>
                      <span className="text-gray-900 font-medium">
                        ₹
                        {isNaN(subtotal) ? '0.00' : subtotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    {placeOfSupply === "interstate" ? (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-700">Total CGST:</span>
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-1">₹</span>
                            <input
                              type="number"
                              className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={isNaN(totalCGST) ? '0.00' : totalCGST.toFixed(2)}
                              onChange={(e) => {
                                const newCGST = parseFloat(e.target.value) || 0;
                                // Update all line items to reflect the new CGST total
                                const cgstPerLine = newCGST / billLines.length;
                                setBillLines((prev) =>
                                  prev.map((line) => {
                                    const lineAmount =
                                      Number(line.qty) * Number(line.rate);
                                    return {
                                      ...line,
                                      cgst:
                                        lineAmount > 0
                                          ? (cgstPerLine / lineAmount) * 100
                                          : 0,
                                    };
                                  })
                                );
                              }}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-700">Total SGST:</span>
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-1">₹</span>
                            <input
                              type="number"
                              className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={isNaN(totalSGST) ? '0.00' : totalSGST.toFixed(2)}
                              onChange={(e) => {
                                const newSGST = parseFloat(e.target.value) || 0;
                                // Update all line items to reflect the new SGST total
                                const sgstPerLine = newSGST / billLines.length;
                                setBillLines((prev) =>
                                  prev.map((line) => {
                                    const lineAmount =
                                      Number(line.qty) * Number(line.rate);
                                    return {
                                      ...line,
                                      sgst:
                                        lineAmount > 0
                                          ? (sgstPerLine / lineAmount) * 100
                                          : 0,
                                    };
                                  })
                                );
                              }}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-700">Total IGST:</span>
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">₹</span>
                          <input
                            type="number"
                            className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                          value={isNaN(totalIGST) ? '0.00' : totalIGST.toFixed(2)}
                            onChange={(e) => {
                              const newIGST = parseFloat(e.target.value) || 0;
                              // Update all line items to reflect the new IGST total
                              const igstPerLine = newIGST / billLines.length;
                              setBillLines((prev) =>
                                prev.map((line) => {
                                  const lineAmount =
                                    Number(line.qty) * Number(line.rate);
                                  return {
                                    ...line,
                                    igst:
                                      lineAmount > 0
                                        ? (igstPerLine / lineAmount) * 100
                                        : 0,
                                  };
                                })
                              );
                            }}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}

                    <hr className="my-2" />
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-bold text-lg">Final Amount:</span>
                      <span className="font-bold text-lg">
                        ₹
                        {isNaN(total) ? '0.00' : total.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-700">
                        Amount in Words: <span className="italic">{isNaN(total) ? 'Zero' : toWords.convert(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "vendorCredit" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="w-2/4 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {vendorCredits.map((credit) => (
                          <tr key={credit.id}>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                placeholder="0.00"
                                value={credit.creditAmount}
                                onChange={(e) =>
                                  handleVendorCreditChange(
                                    credit.id,
                                    "creditAmount",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-transparent p-2 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Credit description"
                                value={credit.creditDescription}
                                onChange={(e) =>
                                  handleVendorCreditChange(
                                    credit.id,
                                    "creditDescription",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-transparent p-2 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveVendorCredit(credit.id)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="mt-4 px-4 py-3">
                        <tr>
                          <td colSpan={3}>
                            <div className="flex justify-between items-center">
                              <button
                                type="button"
                                onClick={handleAddVendorCredit}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium ml-4"
                              >
                                <FaPlus /> Add Vendor Credit
                              </button>
                              <button
                                type="button"
                                onClick={handleVendorCreditSubmit}
                                className="flex items-center gap-2 text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
                              >
                                <FaSave /> Save Vendor Credit
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {vendorCredits.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No vendor credits have been added yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Panel (Right) */}
        <div className="lg:col-span-1 overflow-y-auto p-2 lg:p-4 pb-8 h-full min-w-0">
          <BillUploadUI
            onFileUpload={handleFileUpload}
            uploadedImage={uploadedImage}
            error={error}
            onRemoveFile={handleRemoveFile}
          />
        </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">
            Total Bill Amount:{" "}
            <span className="text-blue-600">
              ₹{isNaN(total) ? '0' : total.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className={`px-6 py-2 border border-gray-300 rounded-lg transition-colors ${
                isSubmitting
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-gray-700 bg-white hover:bg-gray-50"
              }`}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Discard
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                isSubmitting
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                ? "Update & Validate"
                : "Confirm & Validate"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-gray-50 border-t border-gray-200 p-2">
        <div className="text-center text-sm text-gray-500">
          {/* Footer content can be added here */}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteIdx !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-red-600 text-xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Line Item
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this line item? This action
                cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={cancelDeleteLine}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  onClick={confirmDeleteLine}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillForm;