-- =====================================================
-- MDMIS Schema: Site Management
-- Tables: sites, site_boundaries
-- =====================================================

-- =====================================================
-- SITES TABLE
-- Mining sites/concessions with geospatial boundaries
-- =====================================================
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    
    -- Site identification
    name VARCHAR(255) NOT NULL,
    site_code VARCHAR(50) NOT NULL,  -- Unique site identifier (e.g., "RW-COL-001")
    license_number VARCHAR(100),     -- Government mining license/permit number
    
    -- Location
    country_code CHAR(2) NOT NULL,
    province VARCHAR(100),
    district VARCHAR(100),
    sector VARCHAR(100),
    
    -- Geospatial (WGS84 SRID 4326)
    center_point GEOMETRY(POINT, 4326) NOT NULL,  -- Site center coordinates
    elevation_m DECIMAL(10, 2),  -- Elevation above sea level (meters)
    
    -- Operational details
    site_type VARCHAR(50) NOT NULL,  -- 'artisanal', 'industrial', 'exploration'
    primary_mineral mineral_type,   -- Main target mineral
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- 'active', 'suspended', 'closed'
    
    -- Mining details
    estimated_reserves_kg BIGINT,  -- Estimated mineral reserves (kg)
    production_capacity_kg_month BIGINT,  -- Monthly production capacity
    
    -- Safety
    safety_zone_radius_m INTEGER DEFAULT 100,  -- Safety perimeter radius
    requires_ppe BOOLEAN NOT NULL DEFAULT true,  -- Personal protective equipment required
    
    -- Contact
    manager_name VARCHAR(255),
    manager_phone VARCHAR(50),
    manager_email VARCHAR(255),
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_site_code_per_org UNIQUE(org_id, site_code),
    CONSTRAINT valid_country_code CHECK (country_code IN ('RW', 'CD', 'UG', 'TZ', 'KE', 'BI')),
    CONSTRAINT valid_site_type CHECK (site_type IN ('artisanal', 'industrial', 'exploration', 'tailings')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'closed', 'under_review'))
);

-- Indexes
CREATE INDEX idx_sites_org_id ON sites(org_id);
CREATE INDEX idx_sites_site_code ON sites(site_code);
CREATE INDEX idx_sites_country ON sites(country_code);
CREATE INDEX idx_sites_primary_mineral ON sites(primary_mineral);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_active ON sites(org_id, is_active) WHERE deleted_at IS NULL;

-- Spatial index for center_point
CREATE INDEX idx_sites_center_point ON sites USING GIST(center_point);

-- Trigger for updated_at
CREATE TRIGGER sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE sites IS 'Mining sites/concessions with geospatial boundaries';
COMMENT ON COLUMN sites.site_code IS 'Unique site identifier (e.g., RW-COL-001 for Rwanda coltan site 001)';
COMMENT ON COLUMN sites.center_point IS 'WGS84 (SRID 4326) center point of site';
COMMENT ON COLUMN sites.safety_zone_radius_m IS 'Safety perimeter radius in meters from center point';

-- =====================================================
-- SITE_BOUNDARIES TABLE
-- Detailed polygon boundaries for sites (versioned)
-- Supports multiple boundary types: legal, operational, safety
-- =====================================================
CREATE TABLE site_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Boundary metadata
    boundary_type VARCHAR(50) NOT NULL,  -- 'legal', 'operational', 'safety', 'restricted'
    version INTEGER NOT NULL DEFAULT 1,  -- Boundary version (for historical tracking)
    
    -- Geospatial (WGS84 SRID 4326)
    boundary GEOMETRY(POLYGON, 4326) NOT NULL,  -- Site boundary polygon
    area_sqkm DECIMAL(12, 6),  -- Calculated area in square kilometers
    
    -- Documentation
    source VARCHAR(255),  -- Data source (e.g., "Government Survey 2023", "GPS Survey")
    survey_date DATE,
    surveyor_name VARCHAR(255),
    notes TEXT,
    
    -- Validity period
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,  -- Null means currently active
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_boundary_type CHECK (boundary_type IN ('legal', 'operational', 'safety', 'restricted', 'exploration')),
    CONSTRAINT valid_date_range CHECK (effective_until IS NULL OR effective_until >= effective_from),
    CONSTRAINT unique_active_boundary_per_type UNIQUE(site_id, boundary_type, is_active) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX idx_site_boundaries_site_id ON site_boundaries(site_id);
CREATE INDEX idx_site_boundaries_type ON site_boundaries(boundary_type);
CREATE INDEX idx_site_boundaries_active ON site_boundaries(site_id, is_active);
CREATE INDEX idx_site_boundaries_version ON site_boundaries(site_id, version DESC);

-- Spatial index for boundary polygon (GIST for PostGIS)
CREATE INDEX idx_site_boundaries_geom ON site_boundaries USING GIST(boundary);

-- Trigger to validate SRID 4326
CREATE TRIGGER site_boundaries_validate_srid BEFORE INSERT OR UPDATE ON site_boundaries
    FOR EACH ROW EXECUTE FUNCTION validate_srid_4326();

-- Trigger to automatically calculate area
CREATE OR REPLACE FUNCTION calculate_boundary_area()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate area in square kilometers using WGS84 geography cast
    NEW.area_sqkm = ST_Area(NEW.boundary::geography) / 1000000.0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_boundaries_calc_area BEFORE INSERT OR UPDATE ON site_boundaries
    FOR EACH ROW EXECUTE FUNCTION calculate_boundary_area();

-- Trigger for updated_at
CREATE TRIGGER site_boundaries_updated_at BEFORE UPDATE ON site_boundaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_boundaries IS 'Versioned site boundary polygons (legal, operational, safety zones)';
COMMENT ON COLUMN site_boundaries.boundary IS 'WGS84 (SRID 4326) polygon boundary';
COMMENT ON COLUMN site_boundaries.boundary_type IS 'Boundary classification: legal (license), operational (active mining), safety (exclusion zone)';
COMMENT ON COLUMN site_boundaries.version IS 'Boundary version number (incremented on boundary changes)';
COMMENT ON COLUMN site_boundaries.area_sqkm IS 'Auto-calculated area in square kilometers';

-- =====================================================
-- Sample Data (Development Only)
-- =====================================================

-- Sample site in Rwanda (Coltan mine)
INSERT INTO sites (
    id, org_id, name, site_code, license_number,
    country_code, province, district, sector,
    center_point, elevation_m,
    site_type, primary_mineral, status
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Rutongo Coltan Mine',
    'RW-COL-001',
    'RMB-2023-COL-001',
    'RW',
    'Northern Province',
    'Rulindo',
    'Rutongo',
    ST_SetSRID(ST_MakePoint(30.0619, -1.9403), 4326),  -- Longitude, Latitude
    1650.00,
    'artisanal',
    'coltan',
    'active'
);

-- Legal boundary for sample site
INSERT INTO site_boundaries (
    site_id, boundary_type, version,
    boundary, source, survey_date,
    effective_from, is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'legal',
    1,
    ST_SetSRID(ST_GeomFromText('POLYGON((
        30.0600 -1.9400,
        30.0650 -1.9400,
        30.0650 -1.9450,
        30.0600 -1.9450,
        30.0600 -1.9400
    ))'), 4326),
    'Rwanda Mining Board Survey 2023',
    '2023-06-15',
    '2023-07-01',
    true
);

-- Operational boundary (smaller than legal)
INSERT INTO site_boundaries (
    site_id, boundary_type, version,
    boundary, source, survey_date,
    effective_from, is_active
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'operational',
    1,
    ST_SetSRID(ST_GeomFromText('POLYGON((
        30.0610 -1.9410,
        30.0640 -1.9410,
        30.0640 -1.9440,
        30.0610 -1.9440,
        30.0610 -1.9410
    ))'), 4326),
    'GPS Survey by Mine Manager',
    '2023-08-01',
    '2023-08-01',
    true
);

-- Audit log entry
INSERT INTO audit_log (org_id, action, resource_type, resource_id, description, status, metadata)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'site.create',
    'site',
    '00000000-0000-0000-0000-000000000002',
    'Sample site created: Rutongo Coltan Mine',
    'success',
    '{"site_code": "RW-COL-001", "mineral": "coltan"}'::jsonb
);
