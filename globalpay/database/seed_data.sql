-- ============================================================================
-- GlobalPay - Seed Data Script
-- Populates currencies, default user, multi-currency wallets, rates, beneficiaries
-- ============================================================================

-- 1. Insert 9 Supported Currencies
INSERT INTO currencies (code, name, symbol, country_code, country_name, decimals, is_active, is_base_currency, min_transfer_amount, max_transfer_amount, deposit_fee_percentage, withdrawal_fee_fixed)
VALUES 
('USD', 'United States Dollar', '$', 'USA', 'United States', 2, TRUE, TRUE, 1.00, 50000.00, 0.005, 1.50),
('EUR', 'Euro', '€', 'EUR', 'Eurozone', 2, TRUE, FALSE, 1.00, 45000.00, 0.004, 1.20),
('GBP', 'British Pound', '£', 'GBR', 'United Kingdom', 2, TRUE, FALSE, 1.00, 40000.00, 0.004, 1.00),
('INR', 'Indian Rupee', '₹', 'IND', 'India', 2, TRUE, FALSE, 100.00, 4000000.00, 0.002, 50.00),
('CAD', 'Canadian Dollar', 'CA$', 'CAN', 'Canada', 2, TRUE, FALSE, 1.00, 60000.00, 0.005, 2.00),
('AUD', 'Australian Dollar', 'A$', 'AUS', 'Australia', 2, TRUE, FALSE, 1.00, 65000.00, 0.005, 2.00),
('AED', 'UAE Dirham', 'AED', 'ARE', 'United Arab Emirates', 2, TRUE, FALSE, 5.00, 180000.00, 0.003, 5.00),
('SGD', 'Singapore Dollar', 'S$', 'SGP', 'Singapore', 2, TRUE, FALSE, 2.00, 65000.00, 0.004, 2.50),
('JPY', 'Japanese Yen', '¥', 'JPN', 'Japan', 0, TRUE, FALSE, 100.00, 7000000.00, 0.003, 200.00)
ON CONFLICT (code) DO NOTHING;

-- 2. Initial Exchange Rates vs USD
INSERT INTO exchange_rates (base_currency, target_currency, mid_market_rate, markup_percentage, effective_buy_rate, effective_sell_rate, source)
VALUES
('USD', 'EUR', 0.921500, 0.0035, 0.918274, 0.924725, 'Interbank Mid-Market Feed'),
('USD', 'GBP', 0.784200, 0.0035, 0.781455, 0.786944, 'Interbank Mid-Market Feed'),
('USD', 'INR', 83.425000, 0.0040, 83.091300, 83.758700, 'Reserve Bank of India Reference'),
('USD', 'CAD', 1.358200, 0.0035, 1.353446, 1.362953, 'Interbank Mid-Market Feed'),
('USD', 'AUD', 1.523000, 0.0035, 1.517669, 1.528330, 'Interbank Mid-Market Feed'),
('USD', 'AED', 3.672500, 0.0010, 3.668827, 3.676172, 'Central Bank of UAE Fixed Peg'),
('USD', 'SGD', 1.341200, 0.0035, 1.336505, 1.345894, 'Monetary Authority of Singapore Feed'),
('USD', 'JPY', 151.850000, 0.0035, 151.318525, 152.381475, 'Bank of Japan Reference')
ON CONFLICT (base_currency, target_currency) DO UPDATE 
SET mid_market_rate = EXCLUDED.mid_market_rate,
    retrieved_at = CURRENT_TIMESTAMP;

-- Sample User & Profile
INSERT INTO users (id, email, phone_number, password_hash, role, account_status, two_factor_enabled, two_factor_type)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'harshit@globalpay.io', '+1 (555) 234-5678', '$2b$12$e8Y6lFpA/3Xg0K6V9FwZReO9p1B0Dq.q1uLw2K9G6H7J8K9L0M1N2', 'USER', 'ACTIVE', TRUE, 'TOTP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, first_name, last_name, date_of_birth, nationality, country_of_residence, street_address, city, state_province, postal_code, occupation, tier_level)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Harshit', 'Malhi', '1998-05-14', 'USA', 'USA', '742 Evergreen Terrace', 'San Francisco', 'CA', '94107', 'Software Engineer & Entrepreneur', 2)
ON CONFLICT (user_id) DO NOTHING;

-- Seed Admin User
INSERT INTO users (id, email, phone_number, password_hash, role, account_status, two_factor_enabled, two_factor_type)
VALUES ('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'admin@globalpay.io', '+1 (555) 999-0000', '$2b$12$e8Y6lFpA/3Xg0K6V9FwZReO9p1B0Dq.q1uLw2K9G6H7J8K9L0M1N2', 'ADMIN', 'ACTIVE', TRUE, 'TOTP')
ON CONFLICT (id) DO NOTHING;
