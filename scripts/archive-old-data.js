/**
 * CLI Data Archival Utility for Harry Overseas
 * 
 * Usage:
 *   node scripts/archive-old-data.js                  # Runs archival with 90-day threshold
 *   node scripts/archive-old-data.js --days=60        # Runs archival with 60-day threshold
 *   node scripts/archive-old-data.js --seed-test-data # Seeds test records with timestamp 95 days ago
 *   node scripts/archive-old-data.js --stats          # Views current archival stats
 */

import dotenv from 'dotenv';
import pg from 'pg';
import {
  initArchivalTables,
  runDataArchival,
  getArchivalStats,
  restoreArchivedEnquiry,
  restoreArchivedApplication
} from '../server/services/archivalService.js';

dotenv.config();

const { Pool } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set in environment or .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('supabase') || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  });

  const query = async (sql, params = []) => {
    const res = await pool.query(sql, params);
    return {
      rows: res.rows || [],
      rowCount: res.rowCount ?? (res.rows?.length || 0)
    };
  };

  const args = process.argv.slice(2);
  const daysArg = args.find(a => a.startsWith('--days='));
  const daysThreshold = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;
  const isStatsOnly = args.includes('--stats');
  const isSeedTest = args.includes('--seed-test-data');

  console.log('====================================================');
  console.log('   HARRY OVERSEAS DATA ARCHIVAL MANAGEMENT CLI     ');
  console.log('====================================================');

  try {
    await initArchivalTables(query);

    if (isSeedTest) {
      console.log('\n[SEED] Creating test records older than 95 days...');
      const oldDate = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000);
      const testEnqId = `TEST-ENQ-${Math.floor(1000 + Math.random() * 9000)}`;

      await query(`
        INSERT INTO enquiries (
          id, full_name, mobile, phone, whatsapp, email, city, country,
          main_services, service_interest, language_course, additional_services,
          intended_destination, destination_country, travel_period, consultation_method,
          additional_reqs, message, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20
        )
      `, [
        testEnqId, 'Test Old Lead (95d ago)', '+91 9999988888', '+91 9999988888', '+91 9999988888',
        'test.old.lead@example.com', 'Anantapur', 'India',
        JSON.stringify(['German Language Classes']), 'German Language Classes', 'A1', JSON.stringify(['Test Old Data']),
        'Germany', 'Germany', 'Past', 'WhatsApp',
        'Test automated archival record older than 95 days', 'Created 95 days ago for archival test', 'Closed',
        oldDate
      ]);

      await query(`
        INSERT INTO applications (
          full_name, email, phone, role, resume_link, notes, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
      `, [
        'Test Old Candidate (95d ago)', 'test.old.candidate@example.com', '+91 8888877777',
        'Visa Consultant', 'https://example.com/old_resume.pdf', 'Created 95 days ago for archival test', 'Rejected',
        oldDate
      ]);

      console.log(`✅ Seeded 1 test enquiry (#${testEnqId}) and 1 test candidate created at: ${oldDate.toISOString()}`);
    }

    if (isStatsOnly) {
      const stats = await getArchivalStats(query);
      console.log('\n📊 Current Archival Statistics:');
      console.log(`  • Total Archived Enquiries:    ${stats.totalArchivedEnquiries}`);
      console.log(`  • Total Archived Applications: ${stats.totalArchivedApplications}`);
      if (stats.lastExecution) {
        console.log(`  • Last Execution Time:         ${stats.lastExecution.executed_at}`);
        console.log(`  • Last Execution Type:         ${stats.lastExecution.execution_type}`);
        console.log(`  • Last Result Details:         ${stats.lastExecution.details}`);
      } else {
        console.log('  • Last Execution:              No previous runs recorded.');
      }
      await pool.end();
      process.exit(0);
    }

    // Run Archival
    console.log(`\n⏳ Executing archival with threshold: older than ${daysThreshold} days...`);
    const result = await runDataArchival(query, {
      type: 'manual',
      daysThreshold
    });

    console.log('\n🎉 Archival Execution Result:');
    console.log(`  • Status:                SUCCESS`);
    console.log(`  • Enquiries Archived:    ${result.enquiriesArchived}`);
    console.log(`  • Applications Archived: ${result.applicationsArchived}`);
    console.log(`  • Cutoff Timestamp:      ${result.cutoffDate}`);
    console.log(`  • Audit Details:         ${result.details}`);

    const stats = await getArchivalStats(query);
    console.log('\n📊 Updated System Totals:');
    console.log(`  • Total In Archive (Enquiries):    ${stats.totalArchivedEnquiries}`);
    console.log(`  • Total In Archive (Applications): ${stats.totalArchivedApplications}`);

    await pool.end();
    console.log('\n✅ Data Archival CLI completed successfully.');
  } catch (err) {
    console.error('\n❌ Archival CLI failed:', err);
    await pool.end();
    process.exit(1);
  }
}

main();
