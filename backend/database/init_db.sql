-- =====================================================
-- MDMIS Database Initialization
-- Mineral Detection & Mining Intelligence System
-- PostgreSQL 16+ with PostGIS 3.x
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Geospatial types and functions (PostGIS 3.x)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram text search indexes
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- Cryptographic functions

-- Verify PostGIS version (must be 3.x+)
SELECT PostGIS_Version();

-- Set default spatial reference system to WGS84
-- SRID 4326 is used for all geometry columns (latitude/longitude)
-- Reference: EPSG:4326 - World Geodetic System 1984

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate geometry SRID
CREATE OR REPLACE FUNCTION validate_srid_4326()
RETURNS TRIGGER AS $$
BEGIN
    IF ST_SRID(NEW.boundary) != 4326 THEN
        RAISE EXCEPTION 'Geometry must use SRID 4326 (WGS84), got SRID %', ST_SRID(NEW.boundary);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Load Enum Types
-- Execute init_enums.sql before running table schemas
-- =====================================================
-- \i init_enums.sql

-- =====================================================
-- Database Metadata
-- =====================================================
COMMENT ON DATABASE postgres IS 'MDMIS - Mineral Detection & Mining Intelligence System';
