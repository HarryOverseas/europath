import { query } from '../index.js';

async function executeCleanup() {
  console.log('🧹 [CLEANUP] Starting test data removal...');

  // 1. Delete test enquiries
  const delEnqSql = `
    DELETE FROM enquiries 
    WHERE email LIKE '%example.%' 
       OR email LIKE '%domain..%' 
       OR email LIKE '%test.%' 
       OR email LIKE '%remediation%' 
       OR full_name ILIKE '%test%' 
       OR email LIKE '%hkrishna%@gmail.com'
    RETURNING id
  `;
  const enqRes = await query(delEnqSql);
  console.log(`✓ Deleted ${enqRes.rowCount} test enquiries.`);

  // 2. Delete test applications
  const delAppsSql = `
    DELETE FROM applications 
    WHERE email LIKE '%example.%' 
       OR full_name ILIKE '%test%' 
       OR full_name ILIKE '%candidate%' 
       OR full_name ILIKE '%concurrent%' 
       OR full_name ILIKE '%applicant%' 
       OR full_name ILIKE '%xss%' 
       OR full_name IN ('Tyrd', 'Tetss')
    RETURNING id
  `;
  const appsRes = await query(delAppsSql);
  console.log(`✓ Deleted ${appsRes.rowCount} test applications.`);

  // 3. Clear mock test records from archives
  const delArchEnq = await query(`DELETE FROM archived_enquiries WHERE email LIKE '%example.com%' OR full_name LIKE '%Test%'`);
  const delArchApps = await query(`DELETE FROM archived_applications WHERE email LIKE '%example.com%' OR full_name LIKE '%Test%'`);
  console.log(`✓ Cleaned mock records from archives.`);

  // 4. Verify remaining active records
  const remainingEnq = await query('SELECT count(*) FROM enquiries');
  const remainingApps = await query('SELECT count(*) FROM applications');
  console.log(`\n🎉 Current clean database state:`);
  console.log(`   - Enquiries remaining: ${remainingEnq.rows[0].count}`);
  console.log(`   - Applications remaining: ${remainingApps.rows[0].count}`);

  process.exit(0);
}

executeCleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
