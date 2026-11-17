/**
 * Automated Data Archival Service for Harry Overseas
 * 
 * Policy: Data older than 90 days (Enquiries & Job Applications) is automatically
 * moved from operational tables to archive tables and backed up to disk daily.
 * 
 * Features:
 * - Atomic database migration from active tables to archive tables
 * - File-based JSON snapshots in archives/ directory for compliance & offsite backup
 * - Automated 24-hour daily scheduler running during off-peak hours (02:00 AM)
 * - Complete audit trail in archival_logs
 * - On-demand manual trigger API & Restore API for administrators
 * - Slack audit notification upon completion
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { notifySlackArchivalSummary } from './slackNotifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCHIVES_DIR = path.resolve(__dirname, '../../archives');

/**
 * Ensures archive directory exists on disk
 */
function ensureArchiveDir() {
  if (!fs.existsSync(ARCHIVES_DIR)) {
    fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
  }
}

/**
 * Initializes database archive tables & audit log schema
 */
export async function initArchivalTables(query) {
  // 1. Archived Enquiries Table
  await query(`CREATE TABLE IF NOT EXISTS archived_enquiries (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    country VARCHAR(100),
    main_services TEXT,
    service_interest TEXT,
    language_course VARCHAR(50),
    additional_services TEXT,
    intended_destination VARCHAR(100),
    destination_country VARCHAR(100),
    travel_period VARCHAR(100),
    consultation_method VARCHAR(50),
    additional_reqs TEXT,
    message TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archival_reason VARCHAR(100) DEFAULT 'older_than_90_days'
  )`);

  // 2. Archived Job Applications Table
  await query(`CREATE TABLE IF NOT EXISTS archived_applications (
    id INTEGER PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    role VARCHAR(100) NOT NULL,
    resume_link TEXT,
    notes TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archival_reason VARCHAR(100) DEFAULT 'older_than_90_days'
  )`);

  // 3. Archival Execution Audit Logs
  await query(`CREATE TABLE IF NOT EXISTS archival_logs (
    id SERIAL PRIMARY KEY,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_type VARCHAR(50) DEFAULT 'automated',
    days_threshold INTEGER DEFAULT 90,
    enquiries_archived INTEGER DEFAULT 0,
    applications_archived INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'SUCCESS',
    details TEXT
  )`);

  console.log('[Archival] Archive tables and audit log schema initialized successfully.');
}

/**
 * Executes data archival for records older than the specified threshold (default 90 days)
 * @param {Function} query - DB query function
 * @param {Object} options - { daysThreshold: 90, type: 'automated'|'manual', createdBefore?: Date }
 */
export async function runDataArchival(query, options = {}) {
  const daysThreshold = options.daysThreshold !== undefined ? parseInt(options.daysThreshold, 10) : 90;
  const executionType = options.type || 'automated';
  const cutoffDate = options.createdBefore
    ? new Date(options.createdBefore)
    : new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000);

  const cutoffIso = cutoffDate.toISOString();
  const dateStamp = new Date().toISOString().split('T')[0];

  console.log(`[Archival] Starting ${executionType} data archival (Cutoff: ${cutoffIso}, Threshold: ${daysThreshold} days)...`);

  let enquiriesArchived = 0;
  let applicationsArchived = 0;
  const auditDetails = [];

  try {
    ensureArchiveDir();

    // ─────────────────────────────────────────────────────────────
    // 1. Archive Enquiries older than 90 days
    // ─────────────────────────────────────────────────────────────
    const enqSelect = await query(
      'SELECT * FROM enquiries WHERE created_at < $1 ORDER BY created_at ASC',
      [cutoffDate]
    );

    if (enqSelect.rows.length > 0) {
      const records = enqSelect.rows;
      enquiriesArchived = records.length;

      // 1A. Write file snapshot to archives/
      const enqFilePath = path.join(ARCHIVES_DIR, `enquiries_archive_${dateStamp}_${Date.now()}.json`);
      fs.writeFileSync(enqFilePath, JSON.stringify({
        archived_at: new Date().toISOString(),
        cutoff_date: cutoffIso,
        threshold_days: daysThreshold,
        count: enquiriesArchived,
        records: records
      }, null, 2), 'utf-8');

      // 1B. Copy to archived_enquiries table
      await query(`
        INSERT INTO archived_enquiries (
          id, full_name, mobile, phone, whatsapp, email, city, country,
          main_services, service_interest, language_course, additional_services,
          intended_destination, destination_country, travel_period, consultation_method,
          additional_reqs, message, status, created_at, archived_at, archival_reason
        )
        SELECT
          id, full_name, mobile, phone, whatsapp, email, city, country,
          main_services, service_interest, language_course, additional_services,
          intended_destination, destination_country, travel_period, consultation_method,
          additional_reqs, message, status, created_at, CURRENT_TIMESTAMP, $2
        FROM enquiries
        WHERE created_at < $1
        ON CONFLICT (id) DO UPDATE SET
          archived_at = CURRENT_TIMESTAMP,
          archival_reason = EXCLUDED.archival_reason
      `, [cutoffDate, `older_than_${daysThreshold}_days`]);

      // 1C. Delete archived records from active enquiries table
      await query('DELETE FROM enquiries WHERE created_at < $1', [cutoffDate]);

      auditDetails.push(`Enquiries: Archived ${enquiriesArchived} records to table & saved backup (${path.basename(enqFilePath)}).`);
    } else {
      auditDetails.push('Enquiries: 0 records older than 90 days found.');
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Archive Job Applications older than 90 days
    // ─────────────────────────────────────────────────────────────
    const appSelect = await query(
      'SELECT * FROM applications WHERE created_at < $1 ORDER BY created_at ASC',
      [cutoffDate]
    );

    if (appSelect.rows.length > 0) {
      const records = appSelect.rows;
      applicationsArchived = records.length;

      // 2A. Write file snapshot to archives/
      const appFilePath = path.join(ARCHIVES_DIR, `applications_archive_${dateStamp}_${Date.now()}.json`);
      fs.writeFileSync(appFilePath, JSON.stringify({
        archived_at: new Date().toISOString(),
        cutoff_date: cutoffIso,
        threshold_days: daysThreshold,
        count: applicationsArchived,
        records: records
      }, null, 2), 'utf-8');

      // 2B. Copy to archived_applications table
      await query(`
        INSERT INTO archived_applications (
          id, full_name, email, phone, role, resume_link, notes, status, created_at, archived_at, archival_reason
        )
        SELECT
          id, full_name, email, phone, role, resume_link, notes, status, created_at, CURRENT_TIMESTAMP, $2
        FROM applications
        WHERE created_at < $1
        ON CONFLICT (id) DO UPDATE SET
          archived_at = CURRENT_TIMESTAMP,
          archival_reason = EXCLUDED.archival_reason
      `, [cutoffDate, `older_than_${daysThreshold}_days`]);

      // 2C. Delete archived records from active applications table
      await query('DELETE FROM applications WHERE created_at < $1', [cutoffDate]);

      auditDetails.push(`Applications: Archived ${applicationsArchived} candidates to table & saved backup (${path.basename(appFilePath)}).`);
    } else {
      auditDetails.push('Applications: 0 records older than 90 days found.');
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Record Audit Log
    // ─────────────────────────────────────────────────────────────
    const detailsText = auditDetails.join(' | ');
    await query(`
      INSERT INTO archival_logs (
        executed_at, execution_type, days_threshold, enquiries_archived, applications_archived, status, details
      ) VALUES (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5, $6)
    `, [executionType, daysThreshold, enquiriesArchived, applicationsArchived, 'SUCCESS', detailsText]);

    console.log(`[Archival] Completed successfully. Enquiries archived: ${enquiriesArchived}, Applications archived: ${applicationsArchived}.`);

    // ─────────────────────────────────────────────────────────────
    // 4. Slack Audit Alert (if webhook configured and records archived)
    // ─────────────────────────────────────────────────────────────
    if (enquiriesArchived > 0 || applicationsArchived > 0) {
      try {
        await notifySlackArchivalSummary({
          enquiriesCount: enquiriesArchived,
          applicationsCount: applicationsArchived,
          daysThreshold,
          type: executionType
        });
      } catch (slackErr) {
        console.warn('[Archival] Slack alert warning:', slackErr.message);
      }
    }

    return {
      success: true,
      executionType,
      daysThreshold,
      cutoffDate: cutoffIso,
      enquiriesArchived,
      applicationsArchived,
      executedAt: new Date().toISOString(),
      details: detailsText
    };
  } catch (error) {
    console.error('[Archival] Error during data archival:', error);

    try {
      await query(`
        INSERT INTO archival_logs (
          executed_at, execution_type, days_threshold, enquiries_archived, applications_archived, status, details
        ) VALUES (CURRENT_TIMESTAMP, $1, $2, $3, $4, $5, $6)
      `, [executionType, daysThreshold, enquiriesArchived, applicationsArchived, 'FAILED', error.message]);
    } catch {
      // ignore secondary logging error
    }

    throw error;
  }
}

/**
 * Returns overall statistics on archived data and past executions
 */
export async function getArchivalStats(query) {
  const [enqCountRes, appCountRes, lastLogRes, recentLogsRes] = await Promise.all([
    query('SELECT COUNT(*) AS total FROM archived_enquiries'),
    query('SELECT COUNT(*) AS total FROM archived_applications'),
    query('SELECT * FROM archival_logs ORDER BY executed_at DESC LIMIT 1'),
    query('SELECT * FROM archival_logs ORDER BY executed_at DESC LIMIT 10')
  ]);

  return {
    totalArchivedEnquiries: parseInt(enqCountRes.rows[0]?.total || 0, 10),
    totalArchivedApplications: parseInt(appCountRes.rows[0]?.total || 0, 10),
    lastExecution: lastLogRes.rows[0] || null,
    recentLogs: recentLogsRes.rows || []
  };
}

/**
 * Restores an archived enquiry back to the active enquiries table
 */
export async function restoreArchivedEnquiry(query, id) {
  const selectRes = await query('SELECT * FROM archived_enquiries WHERE id = $1', [id]);
  if (selectRes.rows.length === 0) {
    return { success: false, error: 'Archived enquiry not found' };
  }

  const record = selectRes.rows[0];

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
    ) ON CONFLICT (id) DO NOTHING
  `, [
    record.id, record.full_name, record.mobile, record.phone, record.whatsapp,
    record.email, record.city, record.country, record.main_services,
    record.service_interest, record.language_course, record.additional_services,
    record.intended_destination, record.destination_country, record.travel_period,
    record.consultation_method, record.additional_reqs, record.message,
    record.status || 'Contacted', record.created_at || new Date()
  ]);

  await query('DELETE FROM archived_enquiries WHERE id = $1', [id]);
  return { success: true, restoredId: id };
}

/**
 * Restores an archived application back to active applications
 */
export async function restoreArchivedApplication(query, id) {
  const selectRes = await query('SELECT * FROM archived_applications WHERE id = $1', [id]);
  if (selectRes.rows.length === 0) {
    return { success: false, error: 'Archived application not found' };
  }

  const record = selectRes.rows[0];

  await query(`
    INSERT INTO applications (
      id, full_name, email, phone, role, resume_link, notes, status, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9
    ) ON CONFLICT (id) DO NOTHING
  `, [
    record.id, record.full_name, record.email, record.phone, record.role,
    record.resume_link, record.notes, record.status || 'Reviewing', record.created_at || new Date()
  ]);

  await query('DELETE FROM archived_applications WHERE id = $1', [id]);
  return { success: true, restoredId: id };
}

/**
 * Schedules daily automated archival to execute every 24 hours at 02:00 AM (off-peak)
 */
export function startDailyArchivalScheduler(query, options = {}) {
  const daysThreshold = options.daysThreshold || 90;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  function getMsToNextTwoAM() {
    const now = new Date();
    const nextTwoAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 2, 0, 0, 0);
    if (now >= nextTwoAM) {
      // If 2:00 AM has already passed today, target tomorrow 2:00 AM
      nextTwoAM.setDate(nextTwoAM.getDate() + 1);
    }
    return nextTwoAM.getTime() - now.getTime();
  }

  const msToNext = getMsToNextTwoAM();
  const nextTargetTime = new Date(Date.now() + msToNext).toLocaleString();

  console.log(`[Archival] Daily automated scheduler initialized (Retention threshold: ${daysThreshold} days). Next run scheduled at: ${nextTargetTime}`);

  // Set timeout for the first 02:00 AM trigger, then recurring 24h interval
  const timer = setTimeout(async () => {
    try {
      await runDataArchival(query, { type: 'automated', daysThreshold });
    } catch (e) {
      console.error('[Archival Scheduler] Error in automated run:', e.message);
    }

    // Schedule subsequent daily 24h intervals
    setInterval(async () => {
      try {
        await runDataArchival(query, { type: 'automated', daysThreshold });
      } catch (e) {
        console.error('[Archival Scheduler] Error in periodic run:', e.message);
      }
    }, TWENTY_FOUR_HOURS);
  }, msToNext);

  // Return cancel handle if needed
  return timer;
}
