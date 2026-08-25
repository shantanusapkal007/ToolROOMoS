const ExcelJS = require('exceljs');
const path = require('path');

async function generateExcelFiles() {
  const rootDir = path.resolve('..'); // e:\projects\enterprise toolroom

  // 1. Generate Vendor Master Data Excel
  const vendorWorkbook = new ExcelJS.Workbook();
  const vendorSheet = vendorWorkbook.addWorksheet('Vendors Master Data');

  vendorSheet.columns = [
    { header: 'Vendor Code', key: 'vendorCode', width: 18 },
    { header: 'Vendor Name', key: 'vendorName', width: 42 },
    { header: 'Vendor Type', key: 'vendorType', width: 22 },
    { header: 'GST Number', key: 'gstNumber', width: 20 },
    { header: 'Address', key: 'address', width: 55 },
    { header: 'Contact Phone', key: 'contactPhone', width: 18 },
    { header: 'Contact Email', key: 'contactEmail', width: 32 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Remarks', key: 'remarks', width: 55 },
  ];

  const vendorData = [
    {
      vendorCode: 'VEND-MAT-001',
      vendorName: 'Bohler Uddeholm Steels India Pvt Ltd',
      vendorType: 'MATERIAL_SUPPLIER',
      gstNumber: '27AAACB1234C1Z1',
      address: 'Plot 15, MIDC Bhosari, Pune, MH - 411026',
      contactPhone: '+91 98220 11223',
      contactEmail: 'sales@bohler-india.com',
      status: 'ACTIVE',
      remarks: 'Certified supplier for D2, H13 & P20 tool steel blocks'
    },
    {
      vendorCode: 'VEND-HT-002',
      vendorName: 'Bodycote Vacuum Heat Treatment Ltd',
      vendorType: 'HEAT_TREATMENT',
      gstNumber: '29AABCB5678C1Z2',
      address: 'Plot 88, Peenya Industrial Area Phase 2, Bengaluru, KA - 560058',
      contactPhone: '+91 98450 33445',
      contactEmail: 'info@bodycote.in',
      status: 'ACTIVE',
      remarks: 'Vacuum hardening, tempering & stress relieving services'
    },
    {
      vendorCode: 'VEND-COAT-003',
      vendorName: 'Oerlikon Balzers Coating India Pvt Ltd',
      vendorType: 'COATING',
      gstNumber: '27AACCO9012C1Z3',
      address: 'Gat No 307, Nanekarwadi, Chakan, Pune, MH - 410501',
      contactPhone: '+91 98900 55667',
      contactEmail: 'coating.balzers@oerlikon.com',
      status: 'ACTIVE',
      remarks: 'PVD TiAlN, TiN & DLC coatings for moulds and dies'
    },
    {
      vendorCode: 'VEND-TOOL-004',
      vendorName: 'Sandvik Coromant India Ltd',
      vendorType: 'TOOL_SUPPLIER',
      gstNumber: '27AAACS4321C1Z4',
      address: 'Sandvik Composite Park, Patancheru, Hyderabad, TS - 502319',
      contactPhone: '+91 97010 77889',
      contactEmail: 'coromant.orders@sandvik.com',
      status: 'ACTIVE',
      remarks: 'CNC carbide inserts, end mills & tooling systems'
    },
    {
      vendorCode: 'VEND-PLAT-005',
      vendorName: 'Surface Chrome Tech Platers',
      vendorType: 'PLATING',
      gstNumber: '27AAACS1122C1Z5',
      address: 'W-12, MIDC Waluj, Chhatrapati Sambhajinagar, MH - 431136',
      contactPhone: '+91 98231 99000',
      contactEmail: 'info@surfacechrometech.com',
      status: 'ACTIVE',
      remarks: 'Hard chrome plating for mould cavities and cores'
    },
    {
      vendorCode: 'VEND-GRND-006',
      vendorName: 'Precision Jig & Surface Grinders',
      vendorType: 'GRINDING',
      gstNumber: '29AABCP3344C1Z6',
      address: 'Plot 44, Bommasandra Industrial Area, Bengaluru, KA - 560099',
      contactPhone: '+91 98801 22334',
      contactEmail: 'orders@precisiongrinding.in',
      status: 'ACTIVE',
      remarks: 'Subcontract jig grinding and optical profile grinding'
    },
    {
      vendorCode: 'VEND-MAT-007',
      vendorName: 'Hindalco Aluminium Extrusions Ltd',
      vendorType: 'MATERIAL_SUPPLIER',
      gstNumber: '07AAACH5566C1Z7',
      address: 'Sector 6, IMT Manesar, Gurugram, HR - 122050',
      contactPhone: '+91 99100 44556',
      contactEmail: 'sales@hindalco-extrusions.com',
      status: 'ACTIVE',
      remarks: 'Aluminium 6061-T6 and 7075-T6 plates and blocks'
    },
    {
      vendorCode: 'VEND-TOOL-008',
      vendorName: 'Kennametal India Ltd',
      vendorType: 'TOOL_SUPPLIER',
      gstNumber: '29AAACK8899C1Z8',
      address: '8/9th Mile, Tumkur Road, Bengaluru, KA - 560073',
      contactPhone: '+91 98440 66778',
      contactEmail: 'k-bangalore.service@kennametal.com',
      status: 'ACTIVE',
      remarks: 'High-speed milling cutters and solid carbide drills'
    },
    {
      vendorCode: 'VEND-HT-009',
      vendorName: 'Induction Hardening & Nitriding Works',
      vendorType: 'HEAT_TREATMENT',
      gstNumber: '27AAACI7788C1Z9',
      address: 'C-15, MIDC Ambad, Nashik, MH - 422010',
      contactPhone: '+91 98500 88990',
      contactEmail: 'contact@inductionnitriding.com',
      status: 'ACTIVE',
      remarks: 'Gas nitriding, plasma nitriding and induction hardening'
    },
    {
      vendorCode: 'VEND-MAT-010',
      vendorName: 'Thyssenkrupp Materials India Pvt Ltd',
      vendorType: 'MATERIAL_SUPPLIER',
      gstNumber: '27AAACT9900C1Z0',
      address: 'Unit 3, Khed City Industrial Park, Khed, Pune, MH - 410505',
      contactPhone: '+91 98225 11990',
      contactEmail: 'materials.india@thyssenkrupp.com',
      status: 'ACTIVE',
      remarks: 'High-performance alloy steels and copper beryllium'
    }
  ];

  vendorData.forEach(row => vendorSheet.addRow(row));

  // Style Header Row
  const headerRow = vendorSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  // Add borders & zebra striping
  vendorSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 22;
      row.alignment = { vertical: 'middle' };
      if (rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
      }
    }
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } }
      };
    });
  });

  const vendorFilePath = path.join(rootDir, 'Vendors_Master_Data.xlsx');
  await vendorWorkbook.xlsx.writeFile(vendorFilePath);
  console.log(`✅ Saved Vendors Excel file to: ${vendorFilePath}`);


  // 2. Generate Material Master Data Excel
  const materialWorkbook = new ExcelJS.Workbook();
  const materialSheet = materialWorkbook.addWorksheet('Materials Master Data');

  materialSheet.columns = [
    { header: 'Material Code', key: 'materialCode', width: 20 },
    { header: 'Material Grade', key: 'materialGrade', width: 32 },
    { header: 'Material Category', key: 'materialCategory', width: 22 },
    { header: 'Density (g/cm3)', key: 'density', width: 16 },
    { header: 'Standard Cost (₹/KG)', key: 'standardCost', width: 22 },
    { header: 'Default UOM', key: 'defaultUom', width: 14 },
    { header: 'Default Vendor Code', key: 'defaultVendor', width: 22 },
    { header: 'HSN Code', key: 'hsnCode', width: 16 },
    { header: 'GST %', key: 'gstPercent', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Remarks / Applications', key: 'remarks', width: 60 }
  ];

  const materialData = [
    {
      materialCode: 'MAT-STEEL-D2',
      materialGrade: 'AISI D2 / DIN 1.2379',
      materialCategory: 'DIE_STEEL',
      density: 7.70,
      standardCost: 450.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-001',
      hsnCode: '72283020',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'High carbon high chromium cold work steel for blanking and punching dies'
    },
    {
      materialCode: 'MAT-STEEL-H13',
      materialGrade: 'AISI H13 / DIN 1.2344',
      materialCategory: 'TOOL_STEEL',
      density: 7.80,
      standardCost: 580.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-001',
      hsnCode: '72284010',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'Hot work tool steel for pressure die casting dies & hot forging tools'
    },
    {
      materialCode: 'MAT-STEEL-P20',
      materialGrade: 'AISI P20+Ni / DIN 1.2738',
      materialCategory: 'MOULD_STEEL',
      density: 7.85,
      standardCost: 320.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-010',
      hsnCode: '72283020',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'Pre-hardened plastic mould steel for automotive core and cavity blocks'
    },
    {
      materialCode: 'MAT-STEEL-OHNS',
      materialGrade: 'OHNS / AISI O1 / DIN 1.2510',
      materialCategory: 'TOOL_STEEL',
      density: 7.85,
      standardCost: 280.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-001',
      hsnCode: '72283020',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'Oil hardening non-shrinking tool steel for gauges, punches and pillars'
    },
    {
      materialCode: 'MAT-AL-6061',
      materialGrade: 'Aluminium 6061-T6',
      materialCategory: 'NON_FERROUS',
      density: 2.70,
      standardCost: 410.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-007',
      hsnCode: '76061200',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'Lightweight structural aluminum alloy for fixture plates and EDM base plates'
    },
    {
      materialCode: 'MAT-AL-7075',
      materialGrade: 'Aluminium 7075-T6',
      materialCategory: 'NON_FERROUS',
      density: 2.81,
      standardCost: 650.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-007',
      hsnCode: '76061200',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'High strength aircraft grade aluminum for blow moulding & prototype tooling'
    },
    {
      materialCode: 'MAT-COP-BER',
      materialGrade: 'Beryllium Copper CuBe2 / C17200',
      materialCategory: 'SPECIAL_ALLOY',
      density: 8.25,
      standardCost: 3200.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-010',
      hsnCode: '74091100',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'High thermal conductivity copper alloy for fast cooling mould insert cores'
    },
    {
      materialCode: 'MAT-CARB-K10',
      materialGrade: 'Tungsten Carbide K10/K20',
      materialCategory: 'SPECIAL_ALLOY',
      density: 14.50,
      standardCost: 4500.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-TOOL-008',
      hsnCode: '81130030',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'Ultra-hard sintered tungsten carbide for high volume progressive die inserts'
    },
    {
      materialCode: 'MAT-STEEL-EN8',
      materialGrade: 'EN8 / AISI 1045',
      materialCategory: 'CARBON_STEEL',
      density: 7.85,
      standardCost: 95.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-010',
      hsnCode: '72283010',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'Medium carbon steel for die sets, bolster plates, top and bottom plates'
    },
    {
      materialCode: 'MAT-STEEL-EN24',
      materialGrade: 'EN24 / AISI 4340 / DIN 1.6565',
      materialCategory: 'TOOL_STEEL',
      density: 7.85,
      standardCost: 180.00,
      defaultUom: 'KG',
      defaultVendor: 'VEND-MAT-010',
      hsnCode: '72283020',
      gstPercent: 18,
      status: 'ACTIVE',
      remarks: 'High tensile alloy steel for shafts, heavy duty guide pins and tie rods'
    }
  ];

  materialData.forEach(row => materialSheet.addRow(row));

  // Style Header Row
  const matHeaderRow = materialSheet.getRow(1);
  matHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  matHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '166534' } }; // Dark green header for materials
  matHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  matHeaderRow.height = 28;

  // Add borders & zebra striping
  materialSheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 22;
      row.alignment = { vertical: 'middle' };
      if (rowNumber % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFB' } };
      }
    }
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } }
      };
    });
  });

  const materialFilePath = path.join(rootDir, 'Materials_Master_Data.xlsx');
  await materialWorkbook.xlsx.writeFile(materialFilePath);
  console.log(`✅ Saved Materials Excel file to: ${materialFilePath}`);
}

generateExcelFiles().catch(err => {
  console.error('Error generating Excel files:', err);
  process.exit(1);
});
