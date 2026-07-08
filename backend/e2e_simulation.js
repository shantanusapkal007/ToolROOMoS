const API_URL = 'http://localhost:4000/api/v1';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOTM3MDUzMi1hZTNlLTQxMmQtYjg3Ni1kNmM4ZDZhZGMwNzQiLCJlbWFpbCI6ImFkbWluQHRvb2xyb29tLmNvbSIsInJvbGUiOiJBRE1JTiIsIm5hbWUiOiJTeXN0ZW0gQWRtaW4iLCJlbXBsb3llZUlkIjpudWxsLCJpYXQiOjE3ODM0OTM5OTUsImV4cCI6MTc4MzQ5NzU5NX0.S8rPlMIGELtCjr24Zqi0hHcJgFIG4jtCUdoHoKKbEio';

async function runSimulation() {
  console.log('--- STARTING E2E FULL FLOW SIMULATION ---');
  try {
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };

    const runId = Date.now();

    // 2. Create Customer
    console.log('[2] Creating Customer...');
    const custRes = await fetch(`${API_URL}/master-data/customers`, { 
      method: 'POST', headers, body: JSON.stringify({
        customerCode: `CUST-E2E-${runId}`, companyName: `E2E Demo Customer ${runId}`, status: 'ACTIVE'
      }) 
    });
    const custData = await custRes.json();
    if (!custRes.ok) throw new Error(`Customer failed: ${JSON.stringify(custData)}`);
    const customerId = custData.data.id;

    // 3. Create Material
    console.log('[3] Creating Material...');
    const matRes = await fetch(`${API_URL}/master-data/materials`, { 
      method: 'POST', headers, body: JSON.stringify({
        materialCode: `MAT-E2E-${runId}`, materialGrade: 'EN8', defaultUom: 'kg', status: 'ACTIVE'
      }) 
    });
    const matData = await matRes.json();
    if (!matRes.ok) throw new Error(`Material failed: ${JSON.stringify(matData)}`);
    const materialId = matData.data.id;

    // 4. Create Project
    console.log('[4] Creating Project...');
    const projRes = await fetch(`${API_URL}/projects`, { 
      method: 'POST', headers, body: JSON.stringify({
        projectNumber: `PRJ-E2E-${runId}`, customerPoNumber: `PO/E2E/${runId}`, partName: `E2E Test Part ${runId}`, description: 'E2E Simulation Project', targetDeliveryDate: new Date(Date.now() + 86400000 * 30).toISOString(), priority: 'HIGH', projectOwner: 'E2E Runner', customerId: customerId, plantId: 'PL-01', estimatedMaterialCost: 1000, estimatedProjectCost: 5000, revenue: 8000
      }) 
    });
    const projData = await projRes.json();
    if (!projRes.ok) throw new Error(`Project failed: ${JSON.stringify(projData)}`);
    const projectId = projData.data.id;

    // 5. Create BOM
    console.log('[5] Creating BOM...');
    const bomRes = await fetch(`${API_URL}/projects/${projectId}/bom`, { 
      method: 'POST', headers, body: JSON.stringify({
        documentNumber: `BOM-E2E-${runId}`, items: [{ materialId: materialId, requiredQty: 50, rawSize: '100x100x10', calculatedWeight: 10, estimatedCost: 1500 }]
      }) 
    });
    const bomData = await bomRes.json();
    if (!bomRes.ok) throw new Error(`BOM failed: ${JSON.stringify(bomData)}`);
    const bomId = bomData.data.id;

    // 6. Approve BOM
    console.log('[6] Approving BOM...');
    const approveBomRes = await fetch(`${API_URL}/projects/${projectId}/bom/${bomId}/approve`, { method: 'PUT', headers });
    if (!approveBomRes.ok) throw new Error(`Approve BOM failed`);

    // 7. Fetch Operation, Machine, Employee, Vendor
    console.log('[7] Fetching Master Data...');
    const opRes = await fetch(`${API_URL}/master-data/operations`, { method: 'GET', headers });
    const opData = await opRes.json();
    const operationId = opData.data[0].id;

    const machRes = await fetch(`${API_URL}/master-data/machines`, { method: 'GET', headers });
    const machData = await machRes.json();
    const machineId = machData.data[0].id;

    const empRes = await fetch(`${API_URL}/master-data/employees`, { method: 'GET', headers });
    const empData = await empRes.json();
    let employeeId = empData.data.length > 0 ? empData.data[0].id : null;
    if (!employeeId) {
      const newEmpRes = await fetch(`${API_URL}/master-data/employees`, { 
        method: 'POST', headers, body: JSON.stringify({ employeeCode: `EMP-${runId}`, name: 'E2E Emp', department: 'Production', designation: 'Operator', status: 'ACTIVE' }) 
      });
      const newEmpData = await newEmpRes.json();
      employeeId = newEmpData.data.id;
    }

    const vendorRes = await fetch(`${API_URL}/master-data/vendors`, { method: 'GET', headers });
    const vendorData = await vendorRes.json();
    const vendorId = vendorData.data[0].id;

    // 8. Create Routing
    console.log('[8] Creating Routing...');
    const rtgRes = await fetch(`${API_URL}/projects/${projectId}/routing`, { 
      method: 'POST', headers, body: JSON.stringify({
        documentNumber: `RTG-E2E-${runId}`, operations: [{ sequenceOrder: 1, operationId: operationId, machineId: machineId, estimatedHours: 2, estimatedSetupTime: 0.5, remarks: 'E2E Test Operation' }]
      }) 
    });
    const rtgData = await rtgRes.json();
    if (!rtgRes.ok) throw new Error(`Routing failed: ${JSON.stringify(rtgData)}`);
    const routingId = rtgData.data.id;

    // 9. Approve Routing
    console.log('[9] Approving Routing...');
    const approveRtgRes = await fetch(`${API_URL}/projects/${projectId}/routing/${routingId}/approve`, { method: 'PUT', headers });
    if (!approveRtgRes.ok) throw new Error(`Approve Routing failed`);

    // 10. Create PO
    console.log('[10] Creating PO...');
    const poRes = await fetch(`${API_URL}/projects/${projectId}/purchase-orders`, { 
      method: 'POST', headers, body: JSON.stringify({
        vendorId: vendorId, poNumber: `PO-E2E-${runId}`, expectedDeliveryDate: new Date(Date.now() + 86400000 * 5).toISOString(), items: [{ materialId: materialId, orderedQty: 50, agreedRate: 30 }]
      }) 
    });
    const poData = await poRes.json();
    if (!poRes.ok) throw new Error(`PO failed: ${JSON.stringify(poData)}`);
    const poId = poData.data.id;

    // Get PO Items
    console.log('[10.5] Fetching PO Items...');
    const getPoRes = await fetch(`${API_URL}/projects/${projectId}/purchase-orders`, { method: 'GET', headers });
    const getPoData = await getPoRes.json();
    const currentPo = getPoData.data.find(p => p.id === poId);
    const poItemId = currentPo.items[0].id;

    // 11. Create GRN
    console.log('[11] Creating GRN...');
    const grnRes = await fetch(`${API_URL}/projects/${projectId}/goods-receipts`, { 
      method: 'POST', headers, body: JSON.stringify({
        poHeaderId: poId, grnNumber: `GRN-E2E-${runId}`, supplierChallan: `CH-${runId}`, items: [{ poItemId: poItemId, receivedQty: 50, acceptedQty: 50, rejectedQty: 0, actualRate: 30, heatNumber: `HT-${runId}` }]
      }) 
    });
    const grnData = await grnRes.json();
    if (!grnRes.ok) throw new Error(`GRN failed: ${JSON.stringify(grnData)}`);

    // 12. Fetch Inventory Batches
    console.log('[12] Fetching Inventory Batches...');
    const invRes = await fetch(`${API_URL}/projects/${projectId}/inventory-batches`, { method: 'GET', headers });
    const invData = await invRes.json();
    if (!invRes.ok || !invData.data || invData.data.length === 0) throw new Error(`Failed to fetch inventory batches`);
    const inventoryBatchId = invData.data[0].id;

    // 13. Issue Material
    console.log('[13] Issuing Material...');
    const issueRes = await fetch(`${API_URL}/projects/${projectId}/material-issues`, { 
      method: 'POST', headers, body: JSON.stringify({
        issueNumber: `ISS-${runId}`, items: [{ inventoryBatchId: inventoryBatchId, issuedQty: 20 }]
      }) 
    });
    const issueData = await issueRes.json();
    if (!issueRes.ok) throw new Error(`Material Issue failed: ${JSON.stringify(issueData)}`);

    // 14. Fetch Routing for MSDR
    console.log('[14] Fetching Active Routing for MSDR...');
    const getRtgRes = await fetch(`${API_URL}/projects/${projectId}/routing`, { method: 'GET', headers });
    const getRtgData = await getRtgRes.json();
    const activeRouting = getRtgData.data;
    const routingOpId = activeRouting.operations[0].id;

    // 15. Create MSDR
    console.log('[15] Creating MSDR...');
    const msdrRes = await fetch(`${API_URL}/projects/${projectId}/machine-shop-reports`, { 
      method: 'POST', headers, body: JSON.stringify({
        routingOperationId: routingOpId, machineId: machineId, employeeId: employeeId, reportDate: new Date().toISOString(), startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), setupTime: 0.5, cuttingTime: 0.5, producedQty: 10, remarks: 'E2E MSDR Log'
      }) 
    });
    const msdrData = await msdrRes.json();
    if (!msdrRes.ok) throw new Error(`MSDR failed: ${JSON.stringify(msdrData)}`);

    // 16. Quality Inspection (FINAL_PDI)
    console.log('[16] Quality Inspection (FINAL PDI)...');
    const pdiRes = await fetch(`${API_URL}/projects/${projectId}/inspections`, { 
      method: 'POST', headers, body: JSON.stringify({
        inspectedQty: 10, passedQty: 10, reworkQty: 0, scrapQty: 0, result: 'PASS', inspectionType: 'FINAL_PDI', remarks: 'E2E PDI Passed'
      }) 
    });
    const pdiData = await pdiRes.json();
    if (!pdiRes.ok) throw new Error(`PDI failed: ${JSON.stringify(pdiData)}`);

    // 17. Dispatch
    console.log('[17] Dispatching...');
    const dispatchRes = await fetch(`${API_URL}/projects/${projectId}/dispatches`, { 
      method: 'POST', headers, body: JSON.stringify({
        dispatchNumber: `DN-${runId}`, dispatchQty: 10, logisticsCost: 500, remarks: 'E2E Dispatch'
      }) 
    });
    const dispatchData = await dispatchRes.json();
    if (!dispatchRes.ok) throw new Error(`Dispatch failed: ${JSON.stringify(dispatchData)}`);
    const dispatchId = dispatchData.data.id;

    // 18. Invoice
    console.log('[18] Invoicing...');
    const invoiceRes = await fetch(`${API_URL}/projects/${projectId}/invoices`, { 
      method: 'POST', headers, body: JSON.stringify({
        invoiceNumber: `INV-${runId}`, dispatchNoteId: dispatchId, subtotal: 8000, taxAmount: 1440, totalAmount: 9440, remarks: 'E2E Invoice'
      }) 
    });
    const invoiceData = await invoiceRes.json();
    if (!invoiceRes.ok) throw new Error(`Invoice failed: ${JSON.stringify(invoiceData)}`);

    // 19. Record Payment
    console.log('[19] Recording Payment...');
    const paymentRes = await fetch(`${API_URL}/projects/${projectId}/payments`, { 
      method: 'POST', headers, body: JSON.stringify({
        invoiceId: invoiceData.data.id, amountPaid: 9440, paymentReference: `TX-${runId}`, paymentDate: new Date().toISOString()
      }) 
    });
    const paymentData = await paymentRes.json();
    if (!paymentRes.ok) throw new Error(`Payment failed: ${JSON.stringify(paymentData)}`);

    // 20. Close Project
    console.log('[20] Closing Project...');
    const closeRes = await fetch(`${API_URL}/projects/${projectId}/close`, { method: 'POST', headers });
    const closeData = await closeRes.json();
    if (!closeRes.ok) throw new Error(`Close Project failed: ${JSON.stringify(closeData)}`);

    console.log('--- E2E SIMULATION COMPLETED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('SIMULATION FAILED!');
    console.error(error.message);
  }
}

runSimulation();
