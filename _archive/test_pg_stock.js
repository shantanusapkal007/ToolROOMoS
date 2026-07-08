const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://root:rootpassword@localhost:5432/toolroomos?schema=public' });
async function main() {
  await client.connect();
  const res = await client.query(`SELECT * FROM inventory_stock WHERE "materialId"='95cfebb2-65ba-4108-a182-1625434893b0'`);
  console.log('Stock:', res.rows);
  await client.end();
}
main();
