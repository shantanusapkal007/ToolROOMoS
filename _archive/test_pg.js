const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://root:rootpassword@localhost:5432/toolroomos?schema=public' });
async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM warehouses');
  console.log('Warehouses:', res.rows.map(w => w.warehouseCode));
  const proj = await client.query(`SELECT "currentStage" FROM projects WHERE id='39de97df-c384-4ec9-8e77-d28fee34e5a6'`);
  console.log('Project Stage:', proj.rows[0]);
  
  const batch = await client.query(`SELECT "materialId", "availableQty" FROM inventory_batches WHERE id='1fa78e2b-bb4e-4e3a-a688-9ee11137e25c'`);
  console.log('Batch:', batch.rows[0]);
  
  const bom = await client.query(`SELECT id FROM bill_of_material_headers WHERE "projectId"='39de97df-c384-4ec9-8e77-d28fee34e5a6' AND status='APPROVED'`);
  console.log('BOM:', bom.rows[0]);
  if (bom.rows[0] && batch.rows[0]) {
      const items = await client.query(`SELECT * FROM bill_of_material_items WHERE "bomHeaderId"='${bom.rows[0].id}' AND "materialId"='${batch.rows[0].materialId}'`);
      console.log('BOM Items matching batch:', items.rows);
  }
  
  await client.end();
}
main();
