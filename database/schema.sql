-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses Table (Core)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20) NOT NULL,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    business_type VARCHAR(50) CHECK (business_type IN ('Startup', 'Small Business', 'MSME', 'Enterprise', 'Freelancer')),
    industry VARCHAR(100),
    establishment_year INTEGER,
    employee_count VARCHAR(20),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    pincode VARCHAR(20),
    address TEXT,
    is_multi_location BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (with roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    mobile VARCHAR(20),
    designation VARCHAR(50),
    role VARCHAR(50) CHECK (role IN ('Owner', 'Admin', 'Manager', 'Accountant', 'Analyst', 'Operator', 'Viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table (Manufacturing Focus)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    unit VARCHAR(20) DEFAULT 'PCS',
    raw_material_cost DECIMAL(15,2) DEFAULT 0,
    labor_cost DECIMAL(15,2) DEFAULT 0,
    overhead_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (raw_material_cost + labor_cost + overhead_cost) STORED,
    selling_price DECIMAL(15,2) DEFAULT 0,
    margin DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN selling_price > 0 THEN ((selling_price - (raw_material_cost + labor_cost + overhead_cost)) / selling_price * 100)
            ELSE 0
        END
    ) STORED,
    min_stock_level INTEGER DEFAULT 10,
    current_stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, product_code)
);

-- Production Logs
CREATE TABLE production_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    production_date DATE NOT NULL,
    shift VARCHAR(20) CHECK (shift IN ('Morning', 'Evening', 'Night', 'General')),
    planned_quantity INTEGER DEFAULT 0,
    actual_quantity INTEGER DEFAULT 0,
    good_quantity INTEGER DEFAULT 0,
    rejected_quantity INTEGER DEFAULT 0,
    machine_id VARCHAR(100),
    operator_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    invoice_number VARCHAR(100),
    customer_name VARCHAR(255),
    sale_date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    gst_percentage DECIMAL(5,2) DEFAULT 0,
    gst_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price * gst_percentage / 100) STORED,
    net_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + gst_percentage / 100)) STORED,
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Paid', 'Pending', 'Partial')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Transactions
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('Purchase', 'Sale', 'Return', 'Adjustment', 'Wastage')),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) DEFAULT 0,
    total_value DECIMAL(15,2),
    reference_id VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights Log
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    question TEXT NOT NULL,
    analysis_type VARCHAR(50),
    insight_data JSONB NOT NULL,
    suggested_actions JSONB,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File Uploads Log
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    module VARCHAR(50),
    row_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Processing' CHECK (status IN ('Processing', 'Completed', 'Failed')),
    error_message TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Error Logs (Critical for debugging)
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id),
    user_id UUID REFERENCES users(id),
    error_code VARCHAR(50),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    endpoint VARCHAR(255),
    request_body TEXT,
    severity VARCHAR(20) DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_businesses_email ON businesses(business_email);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_business ON users(business_id);
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_production_business_date ON production_logs(business_id, production_date);
CREATE INDEX idx_sales_business_date ON sales(business_id, sale_date);
CREATE INDEX idx_ai_insights_business ON ai_insights(business_id, created_at);