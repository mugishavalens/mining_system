-- =====================================================
-- MDMIS Schema: Multi-Tenancy & Authentication
-- Tables: organisations, users, refresh_tokens, mfa_configs, audit_log
-- =====================================================

-- =====================================================
-- ORGANISATIONS TABLE
-- Multi-tenant isolation boundary (mining companies, government agencies)
-- =====================================================
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,  -- URL-safe identifier
    registration_number VARCHAR(100),    -- Company registration/tax ID
    country_code CHAR(2) NOT NULL,      -- ISO 3166-1 alpha-2 (RW, CD)
    
    -- Subscription/licensing
    license_tier VARCHAR(50) NOT NULL DEFAULT 'basic',  -- basic, professional, enterprise
    max_users INTEGER NOT NULL DEFAULT 10,
    max_sites INTEGER NOT NULL DEFAULT 5,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Enabled feature flags
    
    -- Contact information
    primary_contact_email VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(50),
    address TEXT,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,  -- Soft delete
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_country_code CHECK (country_code IN ('RW', 'CD', 'UG', 'TZ', 'KE', 'BI')),
    CONSTRAINT valid_license_tier CHECK (license_tier IN ('basic', 'professional', 'enterprise', 'trial'))
);

-- Indexes
CREATE INDEX idx_organisations_slug ON organisations(slug);
CREATE INDEX idx_organisations_active ON organisations(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_organisations_country ON organisations(country_code);

-- Trigger for updated_at
CREATE TRIGGER organisations_updated_at BEFORE UPDATE ON organisations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE organisations IS 'Multi-tenant organisation (mining companies, government agencies)';
COMMENT ON COLUMN organisations.slug IS 'URL-safe unique identifier for organisation';
COMMENT ON COLUMN organisations.features IS 'JSON array of enabled feature flags (e.g., ["ml_inference", "safety_monitoring"])';

-- =====================================================
-- USERS TABLE
-- System users with role-based access control
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    
    -- Identity
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- Bcrypt with work factor ≥12
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),  -- Optional internal employee/badge ID
    
    -- Role & permissions
    role user_role NOT NULL DEFAULT 'field_operator',
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Additional granular permissions
    
    -- MFA
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(255),  -- TOTP secret (encrypted at rest)
    backup_codes TEXT[],      -- Array of single-use backup codes
    
    -- Account status
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    
    -- Security
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,  -- Account lockout expiration
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_email_per_org UNIQUE(org_id, email),
    CONSTRAINT valid_role CHECK (role IN (
        'field_operator', 'drone_operator', 'geologist', 'mine_manager',
        'safety_officer', 'compliance_manager', 'government_auditor',
        'investor', 'company_admin', 'system_admin'
    ))
);

-- Indexes
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_org_active ON users(org_id, is_active) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'System users with role-based access control (10 roles)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash with work factor ≥12';
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret for 2FA (encrypt at application layer)';
COMMENT ON COLUMN users.permissions IS 'JSON array of granular permissions beyond role defaults';

-- =====================================================
-- REFRESH_TOKENS TABLE
-- JWT refresh token rotation tracking
-- =====================================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token identity
    token_hash VARCHAR(255) NOT NULL UNIQUE,  -- SHA256 hash of refresh token
    device_fingerprint VARCHAR(500),  -- User-Agent + IP hash for device tracking
    
    -- Lifecycle
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,  -- Manual revocation
    replaced_by_token_id UUID,  -- Token rotation tracking
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id) 
    WHERE revoked_at IS NULL AND expires_at > NOW();

COMMENT ON TABLE refresh_tokens IS 'JWT refresh token rotation (30-day expiration)';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA256 hash of refresh token (never store plaintext)';
COMMENT ON COLUMN refresh_tokens.replaced_by_token_id IS 'References new token after rotation';

-- =====================================================
-- MFA_CONFIGS TABLE
-- Multi-factor authentication configuration history
-- =====================================================
CREATE TABLE mfa_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- MFA method
    method VARCHAR(50) NOT NULL,  -- 'totp', 'sms', 'email'
    enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disabled_at TIMESTAMPTZ,
    
    -- Verification
    verified_by_user BOOLEAN NOT NULL DEFAULT false,
    recovery_codes_generated INTEGER NOT NULL DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_mfa_method CHECK (method IN ('totp', 'sms', 'email'))
);

-- Indexes
CREATE INDEX idx_mfa_configs_user_id ON mfa_configs(user_id);
CREATE INDEX idx_mfa_configs_active ON mfa_configs(user_id) WHERE disabled_at IS NULL;

COMMENT ON TABLE mfa_configs IS 'MFA configuration change audit trail';
COMMENT ON COLUMN mfa_configs.method IS 'MFA method: totp (authenticator app), sms, or email';

-- =====================================================
-- AUDIT_LOG TABLE
-- Immutable audit trail for all sensitive operations
-- WARNING: No UPDATE or DELETE allowed - compliance requirement
-- =====================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor
    user_id UUID REFERENCES users(id),  -- Null for system actions
    org_id UUID NOT NULL REFERENCES organisations(id),
    actor_role user_role,
    actor_ip VARCHAR(45),  -- IPv4 or IPv6
    
    -- Action
    action VARCHAR(100) NOT NULL,  -- 'user.login', 'batch.custody_transfer', etc.
    resource_type VARCHAR(100) NOT NULL,  -- 'user', 'mineral_batch', 'scan_session'
    resource_id UUID,  -- ID of affected resource
    
    -- Details
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Additional context
    
    -- Result
    status VARCHAR(50) NOT NULL,  -- 'success', 'failure', 'warning'
    error_message TEXT,
    
    -- Timestamp (immutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('success', 'failure', 'warning'))
);

-- Indexes
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_org_created ON audit_log(org_id, created_at DESC);

-- Prevent UPDATE and DELETE on audit log (compliance requirement)
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

COMMENT ON TABLE audit_log IS 'Immutable audit trail (7-year retention for OECD/RMB compliance)';
COMMENT ON COLUMN audit_log.action IS 'Dot-notation action identifier (e.g., user.login, batch.export)';
COMMENT ON COLUMN audit_log.metadata IS 'JSON object with action-specific details';

-- =====================================================
-- Sample Data (Development Only - Remove in Production)
-- =====================================================

-- Create system organisation
INSERT INTO organisations (id, name, slug, country_code, license_tier, primary_contact_email, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'MDMIS System',
    'system',
    'RW',
    'enterprise',
    'admin@mdmis.gov.rw',
    true
);

-- Create system admin user (password: 'Admin123!')
-- Bcrypt hash with work factor 12
INSERT INTO users (
    id, org_id, email, password_hash, full_name, role,
    is_active, is_email_verified, email_verified_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@mdmis.gov.rw',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeOK7ihM8uAG',  -- Admin123!
    'System Administrator',
    'system_admin',
    true,
    true,
    NOW()
);

-- Audit log entry for system initialization
INSERT INTO audit_log (org_id, action, resource_type, description, status, metadata)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'system.initialize',
    'database',
    'Database schema initialized with auth tables',
    'success',
    '{"version": "1.0", "tables": ["organisations", "users", "refresh_tokens", "mfa_configs", "audit_log"]}'::jsonb
);
