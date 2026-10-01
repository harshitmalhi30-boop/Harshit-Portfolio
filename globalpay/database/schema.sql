-- ============================================================================
-- GlobalPay - PostgreSQL Database Schema
-- "Send Money Anywhere, Anytime"
-- Multi-Currency Cross-Border Payment Platform
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Core authentication credentials, roles, and status
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(32) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'COMPLIANCE_OFFICER', 'SUPPORT')),
    account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'FROZEN', 'PENDING_VERIFICATION', 'CLOSED')),
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(128),
    two_factor_type VARCHAR(32) DEFAULT 'SMS' CHECK (two_factor_type IN ('SMS', 'TOTP', 'EMAIL')),
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(64),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_status ON users(account_status);

-- ----------------------------------------------------------------------------
-- 2. USER PROFILES TABLE
-- Extended customer details, address, nationality, tier
-- ----------------------------------------------------------------------------
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(3) NOT NULL, -- ISO-3166 3-letter code
    country_of_residence VARCHAR(3) NOT NULL,
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(32) NOT NULL,
    occupation VARCHAR(100),
    tax_identification_number VARCHAR(64),
    preferred_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    tier_level INT NOT NULL DEFAULT 1 CHECK (tier_level IN (1, 2, 3)), -- 1: Basic ($1k/day), 2: Verified ($25k/day), 3: Business/Unlimited
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_profiles_user_id UNIQUE (user_id)
);

CREATE INDEX idx_user_profiles_nationality ON user_profiles(nationality);

-- ----------------------------------------------------------------------------
-- 3. KYC RECORDS TABLE
-- Identity verification, document verification, AML/PEP checks
-- ----------------------------------------------------------------------------
CREATE TABLE kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL CHECK (document_type IN ('PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT')),
    document_number VARCHAR(128) NOT NULL,
    document_issuing_country VARCHAR(3) NOT NULL,
    document_expiry_date DATE,
    document_front_url TEXT NOT NULL,
    document_back_url TEXT,
    selfie_url TEXT NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('UNSUBMITTED', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_RE_UPLOAD')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    pep_check_passed BOOLEAN DEFAULT TRUE,
    sanctions_check_passed BOOLEAN DEFAULT TRUE,
    risk_score NUMERIC(5,2) DEFAULT 0.00 CHECK (risk_score >= 0 AND risk_score <= 100), -- 0 low, 100 high risk
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_user_id ON kyc_records(user_id);
CREATE INDEX idx_kyc_status ON kyc_records(verification_status);

-- ----------------------------------------------------------------------------
-- 4. CURRENCIES TABLE
-- Supported international currencies and specifications
-- ----------------------------------------------------------------------------
CREATE TABLE currencies (
    code VARCHAR(3) PRIMARY KEY, -- USD, EUR, GBP, INR, CAD, AUD, AED, SGD, JPY
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(8) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(64) NOT NULL,
    decimals INT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_base_currency BOOLEAN NOT NULL DEFAULT FALSE,
    min_transfer_amount NUMERIC(18,4) NOT NULL DEFAULT 1.0000,
    max_transfer_amount NUMERIC(18,4) NOT NULL DEFAULT 50000.0000,
    deposit_fee_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.0050, -- 0.5%
    withdrawal_fee_fixed NUMERIC(18,4) NOT NULL DEFAULT 2.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. WALLETS TABLE
-- Multi-currency wallet balances per user
-- ----------------------------------------------------------------------------
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    balance NUMERIC(18,4) NOT NULL DEFAULT 0.0000 CHECK (balance >= 0),
    reserved_balance NUMERIC(18,4) NOT NULL DEFAULT 0.0000 CHECK (reserved_balance >= 0), -- escrow / in-flight transfers
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    account_number VARCHAR(64) UNIQUE, -- Virtual IBAN or local account number
    routing_number VARCHAR(64),        -- ACH routing / Sort Code / IFSC / SWIFT-BIC
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_currency_wallet UNIQUE (user_id, currency_code)
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- ----------------------------------------------------------------------------
-- 6. EXCHANGE RATES TABLE
-- Real-time and historical currency exchange rates and margins
-- ----------------------------------------------------------------------------
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    target_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    mid_market_rate NUMERIC(18,6) NOT NULL,
    markup_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.0040, -- 0.40% spread
    effective_buy_rate NUMERIC(18,6) NOT NULL,
    effective_sell_rate NUMERIC(18,6) NOT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'Interbank Mid-Market FX Feed',
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_currency_pair UNIQUE (base_currency, target_currency)
);

CREATE INDEX idx_exchange_rates_pair ON exchange_rates(base_currency, target_currency);

-- ----------------------------------------------------------------------------
-- 7. BENEFICIARIES TABLE
-- Saved recipients for instant cross-border transfers
-- ----------------------------------------------------------------------------
CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    nickname VARCHAR(64),
    email VARCHAR(255),
    phone_number VARCHAR(32),
    country_code VARCHAR(3) NOT NULL,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    bank_name VARCHAR(128) NOT NULL,
    account_identifier_type VARCHAR(32) NOT NULL CHECK (account_identifier_type IN ('IBAN', 'ACCOUNT_NUMBER', 'UPI_ID', 'INTERAC_EMAIL', 'PAYNOW_PHONE')),
    account_identifier VARCHAR(128) NOT NULL,
    routing_code VARCHAR(64), -- SWIFT/BIC, IFSC, Sort Code, Routing Number
    relationship VARCHAR(64) DEFAULT 'Friend/Family',
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_beneficiaries_user ON beneficiaries(user_id);

-- ----------------------------------------------------------------------------
-- 8. PAYMENT METHODS TABLE
-- Saved source funding instruments (Cards, Linked Banks, External Wallets)
-- NOTE: Never stores raw PAN or CVV (strictly tokenized/masked per PCI-DSS)
-- ----------------------------------------------------------------------------
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method_type VARCHAR(32) NOT NULL CHECK (method_type IN ('BANK_ACCOUNT', 'CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET')),
    provider_token VARCHAR(255) NOT NULL, -- Tokenized reference from Stripe/Plaid/Razorpay sandbox
    last_four VARCHAR(4) NOT NULL,
    brand VARCHAR(32), -- Visa, Mastercard, Amex, Chase, Barclays
    expiry_month INT CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INT,
    billing_country VARCHAR(3) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);

-- ----------------------------------------------------------------------------
-- 9. TRANSACTIONS TABLE
-- Complete record of international remittances, conversions, deposits & withdrawals
-- ----------------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(32) UNIQUE NOT NULL, -- e.g. GP-2026-X8F90
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('SEND_MONEY', 'RECEIVE_MONEY', 'CONVERT_CURRENCY', 'ADD_MONEY', 'WITHDRAW')),
    source_wallet_id UUID REFERENCES wallets(id),
    destination_wallet_id UUID REFERENCES wallets(id),
    beneficiary_id UUID REFERENCES beneficiaries(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    
    sender_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    sender_amount NUMERIC(18,4) NOT NULL CHECK (sender_amount > 0),
    
    exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1.000000,
    transfer_fee NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    fx_spread_fee NUMERIC(18,4) NOT NULL DEFAULT 0.0000,
    total_charged_amount NUMERIC(18,4) NOT NULL,
    
    recipient_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    recipient_amount NUMERIC(18,4) NOT NULL CHECK (recipient_amount > 0),
    
    payment_channel VARCHAR(64) NOT NULL DEFAULT 'INSTANT_TRANSFER', -- ACH, SEPA_INSTANT, SWIFT, UPI, FASTER_PAYMENTS
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'FLAGGED_FOR_REVIEW')),
    failure_reason TEXT,
    purpose_of_remittance VARCHAR(128) DEFAULT 'Family Support / Maintenance',
    estimated_delivery_time TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Risk & Compliance tracking
    risk_score NUMERIC(5,2) DEFAULT 5.00,
    sanctions_screened BOOLEAN NOT NULL DEFAULT TRUE,
    regulatory_reported BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_reference ON transactions(reference_number);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. TRANSACTION RECEIPTS TABLE
-- Tamper-evident receipt metadata, digital signature, and download tracking
-- ----------------------------------------------------------------------------
CREATE TABLE transaction_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    receipt_number VARCHAR(64) UNIQUE NOT NULL,
    pdf_url TEXT,
    verification_hash VARCHAR(128) NOT NULL, -- SHA-256 integrity hash
    is_downloaded BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_email BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_receipt_transaction UNIQUE (transaction_id)
);

-- ----------------------------------------------------------------------------
-- 11. NOTIFICATIONS TABLE
-- Real-time user alerts for transfers, security, and market rates
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('TRANSFER', 'SECURITY', 'KYC', 'RATE_ALERT', 'PROMO', 'SYSTEM')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url VARCHAR(255),
    reference_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ----------------------------------------------------------------------------
-- 12. SECURITY EVENTS TABLE
-- Session logins, IP addresses, MFA verifications, and suspicious behavior
-- ----------------------------------------------------------------------------
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL CHECK (event_type IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_CHANGE', '2FA_ENABLED', '2FA_DISABLED', 'DEVICE_REVOKED', 'SESSION_TIMEOUT', 'SUSPICIOUS_IP_DETECTED')),
    ip_address VARCHAR(64) NOT NULL,
    user_agent TEXT,
    device_name VARCHAR(128),
    location_estimate VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_user ON security_events(user_id);

-- ----------------------------------------------------------------------------
-- 13. AUDIT LOGS TABLE
-- Immutable administrative and financial compliance audit trail
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(64),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at DESC);

-- ----------------------------------------------------------------------------
-- HELPER TRIGGERS FOR TIMESTAMPS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_beneficiaries_updated_at BEFORE UPDATE ON beneficiaries FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
