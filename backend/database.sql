-- AptPay Database Schema
-- PostgreSQL Database Setup

-- Create database (run this separately as superuser)
-- CREATE DATABASE aptpay;

-- Connect to aptpay database and run the following:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    upi_id VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    address TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    amount_inr DECIMAL(15, 2) NOT NULL,
    stablecoin_amount DECIMAL(20, 8) NOT NULL,
    exchange_rate DECIMAL(10, 4) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    merchant_upi_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    aptos_transaction_hash VARCHAR(255),
    upi_payout_id UUID,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- UPI Payouts table
CREATE TABLE upi_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    payout_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    merchant_upi_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    provider_transaction_id VARCHAR(255),
    failure_reason TEXT,
    provider_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exchange Rates table (for caching)
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(15, 8) NOT NULL,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Events table (for blockchain events)
CREATE TABLE transaction_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    event_type VARCHAR(50) NOT NULL,
    blockchain_hash VARCHAR(255),
    block_number BIGINT,
    event_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id),
    recipient_type VARCHAR(20) NOT NULL, -- 'user' or 'merchant'
    recipient_id VARCHAR(255) NOT NULL, -- wallet address or merchant id
    notification_type VARCHAR(50) NOT NULL, -- 'email', 'push', 'sms'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table (for merchant API access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id),
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_payments_wallet_address ON payments(wallet_address);
CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_upi_payouts_payout_id ON upi_payouts(payout_id);
CREATE INDEX idx_upi_payouts_status ON upi_payouts(status);
CREATE INDEX idx_transaction_events_payment_id ON transaction_events(payment_id);
CREATE INDEX idx_transaction_events_processed ON transaction_events(processed);
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
CREATE INDEX idx_exchange_rates_created_at ON exchange_rates(created_at);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upi_payouts_updated_at BEFORE UPDATE ON upi_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample merchants for testing
INSERT INTO merchants (name, email, phone, upi_id, business_type, verified) VALUES
('Demo Coffee Shop', 'coffee@demo.com', '+91-9876543210', 'coffee@paytm', 'Food & Beverage', true),
('Tech Store', 'tech@demo.com', '+91-9876543211', 'techstore@gpay', 'Electronics', true),
('Book Store', 'books@demo.com', '+91-9876543212', 'books@phonepe', 'Retail', true);

-- Sample exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, source) VALUES
('USDC', 'INR', 84.0, 'demo'),
('INR', 'USDC', 0.012, 'demo');

COMMIT;