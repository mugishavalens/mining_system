-- =====================================================
-- MDMIS Database Enums Initialization
-- Mineral Detection & Mining Intelligence System
-- Version: 1.0
-- PostgreSQL 16+ Required
-- =====================================================

-- Drop existing types if they exist (for development/testing)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS mineral_type CASCADE;
DROP TYPE IF EXISTS scan_status CASCADE;
DROP TYPE IF EXISTS sensor_type CASCADE;
DROP TYPE IF EXISTS zone_status CASCADE;
DROP TYPE IF EXISTS batch_status CASCADE;
DROP TYPE IF EXISTS custody_event_type CASCADE;
DROP TYPE IF EXISTS incident_type CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- =====================================================
-- 1. USER_ROLE ENUM
-- Defines 10 system roles with hierarchical permissions
-- =====================================================
CREATE TYPE user_role AS ENUM (
    'field_operator',        -- Field data collection personnel
    'drone_operator',        -- UAV operators for aerial scanning
    'geologist',            -- Geological analysis and validation
    'mine_manager',         -- Site operations management
    'safety_officer',       -- Health & safety monitoring
    'compliance_manager',   -- Regulatory compliance oversight
    'government_auditor',   -- External government auditors
    'investor',             -- Read-only investor dashboard access
    'company_admin',        -- Organization-level admin
    'system_admin'          -- Platform-level super admin
);

-- =====================================================
-- 2. MINERAL_TYPE ENUM
-- Supported mineral classifications (expandable)
-- =====================================================
CREATE TYPE mineral_type AS ENUM (
    'coltan',              -- Columbite-tantalite (3TG conflict mineral)
    'gold',                -- Gold (Au)
    'cassiterite',         -- Tin ore (3TG conflict mineral)
    'wolframite',          -- Tungsten ore (3TG conflict mineral)
    'cobalt',              -- Cobalt (Co) - battery critical mineral
    'copper',              -- Copper (Cu)
    'gemstone',            -- Precious/semi-precious stones
    'lithium',             -- Lithium (Li) - battery critical mineral
    'nickel',              -- Nickel (Ni)
    'unknown'              -- Unclassified/pending analysis
);

-- =====================================================
-- 3. SCAN_STATUS ENUM
-- Tracks sensor file processing lifecycle
-- =====================================================
CREATE TYPE scan_status AS ENUM (
    'uploading',           -- File upload in progress
    'uploaded',            -- File stored in S3, awaiting processing
    'preprocessing',       -- Geospatial validation, format conversion
    'ready',               -- Queued for ML inference
    'classifying',         -- ML model processing active
    'complete',            -- Mineral zones extracted and stored
    'failed'               -- Processing error (check error_message)
);

-- =====================================================
-- 4. SENSOR_TYPE ENUM
-- Supported sensor modalities for mineral detection
-- =====================================================
CREATE TYPE sensor_type AS ENUM (
    'hyperspectral',       -- Airborne/handheld hyperspectral imaging
    'gpr',                 -- Ground-penetrating radar
    'em',                  -- Electromagnetic induction
    'magnetometer',        -- Magnetic field sensors
    'gamma',               -- Gamma-ray spectrometry
    'sentinel2',           -- Satellite multispectral (Sentinel-2)
    'lab'                  -- Laboratory XRF/ICP-MS analysis
);

-- =====================================================
-- 5. ZONE_STATUS ENUM
-- Mineral zone confidence workflow stages
-- =====================================================
CREATE TYPE zone_status AS ENUM (
    'unconfirmed',         -- ML detection only (no expert review)
    'geologist_reviewed',  -- Geologist validated the detection
    'lab_confirmed',       -- Lab assay confirmed composition
    'rejected'             -- False positive / rejected by expert
);

-- =====================================================
-- 6. BATCH_STATUS ENUM
-- Physical mineral batch lifecycle tracking
-- =====================================================
CREATE TYPE batch_status AS ENUM (
    'scanned',             -- Initial detection/extraction recorded
    'weighed',             -- Mass recorded at weighbridge
    'graded',              -- Quality/purity grading completed
    'in_storage',          -- Stored in secure facility
    'in_transit',          -- Transportation in progress
    'at_processing',       -- At processing/smelting facility
    'exported',            -- Exported (final state for compliance)
    'rejected'             -- Failed quality checks
);

-- =====================================================
-- 7. CUSTODY_EVENT_TYPE ENUM
-- Chain of custody event classifications
-- =====================================================
CREATE TYPE custody_event_type AS ENUM (
    'extraction',          -- Initial extraction from site
    'weigh_in',            -- Weighbridge measurement
    'storage_in',          -- Entered secure storage
    'dispatch',            -- Departed from location
    'waypoint',            -- GPS checkpoint during transport
    'receipt',             -- Received at destination
    'processing',          -- Entered processing facility
    'export',              -- International export
    'rejection'            -- Batch rejected (with reason)
);

-- =====================================================
-- 8. INCIDENT_TYPE ENUM
-- Safety incident classifications
-- =====================================================
CREATE TYPE incident_type AS ENUM (
    'gas_threshold',       -- Hazardous gas concentration exceeded
    'structural_instability', -- Mine structural integrity issue
    'slope_failure',       -- Ground movement/collapse
    'equipment',           -- Equipment malfunction/failure
    'proximity_breach',    -- Unauthorized zone entry
    'environmental',       -- Environmental contamination
    'other'                -- Other incident types
);

-- =====================================================
-- 9. INCIDENT_STATUS ENUM
-- Safety incident workflow states
-- =====================================================
CREATE TYPE incident_status AS ENUM (
    'open',                -- Newly reported, requires action
    'acknowledged',        -- Safety officer notified
    'resolved',            -- Mitigated and closed
    'escalated'            -- Escalated to higher authority
);

-- =====================================================
-- 10. REPORT_TYPE ENUM
-- Supported compliance and operational reports
-- =====================================================
CREATE TYPE report_type AS ENUM (
    'scan_report',         -- Site scan summary (daily/weekly)
    'rmb_submission',      -- Rwanda Mining Board (RMB) submission
    'oecd_due_diligence',  -- OECD Due Diligence report
    'production_report',   -- Monthly production summary
    'variance_report',     -- Inventory variance analysis
    'inventory_report'     -- Current inventory snapshot
);

-- =====================================================
-- 11. REPORT_STATUS ENUM
-- Report generation workflow states
-- =====================================================
CREATE TYPE report_status AS ENUM (
    'generating',          -- Report generation in progress
    'ready',               -- Report ready for download/submission
    'failed',              -- Generation failed (check error)
    'submitted'            -- Submitted to external authority
);

-- =====================================================
-- 12. JOB_STATUS ENUM
-- Background job processing states (Celery tasks)
-- =====================================================
CREATE TYPE job_status AS ENUM (
    'pending',             -- Queued, awaiting worker
    'running',             -- Actively processing
    'complete',            -- Successfully completed
    'failed',              -- Failed (see error_message)
    'retrying'             -- Automatic retry in progress
);

-- =====================================================
-- 13. NOTIFICATION_TYPE ENUM
-- System notification event types
-- =====================================================
CREATE TYPE notification_type AS ENUM (
    'ingestion_complete',  -- Scan file processing completed
    'classification_done', -- ML classification finished
    'safety_alert',        -- Safety incident detected
    'batch_status_change', -- Mineral batch status updated
    'report_ready',        -- Compliance report generated
    'lab_result_uploaded', -- Lab analysis results available
    'model_deployed',      -- New ML model version deployed
    'system_alert',        -- System-level alert
    'compliance_due'       -- Compliance deadline approaching
);

-- =====================================================
-- Verification Query
-- =====================================================
-- SELECT 
--     typname AS enum_name,
--     array_agg(enumlabel ORDER BY enumsortorder) AS enum_values
-- FROM pg_type 
-- JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid
-- WHERE typname IN (
--     'user_role', 'mineral_type', 'scan_status', 'sensor_type',
--     'zone_status', 'batch_status', 'custody_event_type', 'incident_type',
--     'incident_status', 'report_type', 'report_status', 'job_status',
--     'notification_type'
-- )
-- GROUP BY typname
-- ORDER BY typname;
