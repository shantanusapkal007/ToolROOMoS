const BASE_URL = 'http://127.0.0.1:4000/api/v1';

async function runTest() {
  console.log('=== Starting Master Data Proof Test ===');
  try {
    // 1. Login to get token
    console.log('\n[1] Logging in as admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@toolroom.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
    const token = loginData.access_token;
    console.log('✅ Login successful. Received JWT token.');

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Fetch companies to get a valid companyId
    console.log('\n[2] Fetching companies for foreign key...');
    const companiesRes = await fetch(`${BASE_URL}/master-data/companies`, { headers });
    const companiesData = await companiesRes.json();
    const companyId = companiesData.data[0].id;
    console.log(`✅ Found valid companyId: ${companyId}`);

    // 3. Create a Customer with EXTRA unwhitelisted field (status)
    console.log('\n[3] Creating new customer with extra "status" field...');
    const newCustomer = {
      customerCode: `TEST-CU-${Date.now()}`,
      companyName: 'Test Customer ' + Date.now(),
      companyId: companyId,
      status: 'ACTIVE' // This caused 400 Bad Request before
    };
    
    const createRes = await fetch(`${BASE_URL}/master-data/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newCustomer)
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(JSON.stringify(createData));
    const createdCustomerId = createData.data.id;
    console.log(`✅ Customer created successfully! ID: ${createdCustomerId}`);

    // 4. Delete the Customer
    console.log(`\n[4] Deleting customer ${createdCustomerId}...`);
    const deleteRes = await fetch(`${BASE_URL}/master-data/customers/${createdCustomerId}`, {
      method: 'DELETE',
      headers
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok) throw new Error(JSON.stringify(deleteData));
    console.log('✅ Customer deleted successfully!');

    // 5. Fetch Active Customers (what the UI now does)
    console.log(`\n[5] Fetching ACTIVE customers to verify deletion...`);
    const activeRes = await fetch(`${BASE_URL}/master-data/customers?status=ACTIVE`, { headers });
    const activeData = await activeRes.json();
    const stillExists = activeData.data.some((c: any) => c.id === createdCustomerId);
    
    if (stillExists) {
      console.log('❌ Error: Deleted customer still appears in ACTIVE list.');
    } else {
      console.log('✅ Verified: Deleted customer DOES NOT appear in ACTIVE list.');
    }

    // 6. Prove it's just INACTIVE
    console.log(`\n[6] Fetching INACTIVE customers to prove soft-delete...`);
    const inactiveRes = await fetch(`${BASE_URL}/master-data/customers?status=INACTIVE`, { headers });
    const inactiveData = await inactiveRes.json();
    const isInDatabase = inactiveData.data.some((c: any) => c.id === createdCustomerId);
    
    if (isInDatabase) {
      console.log('✅ Verified: Customer still exists in database marked as INACTIVE.');
    } else {
      console.log('❌ Error: Could not find customer in database.');
    }

    console.log('\n=== Test Completed Successfully ===');
  } catch (error: any) {
    console.error('❌ Test failed!', error.message);
  }
}

runTest();
