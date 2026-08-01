-- ============================================================
-- Stationery Management System - Database Schema (MySQL)
-- ============================================================
CREATE DATABASE IF NOT EXISTS stationery_db;
USE stationery_db;

-- 1) CASH BOOK
CREATE TABLE IF NOT EXISTS cash_book (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remarks VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) EXPENSE MANAGEMENT
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    note VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) DAILY SALE
CREATE TABLE IF NOT EXISTS daily_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    stationery DECIMAL(12,2) NOT NULL DEFAULT 0,
    profit DECIMAL(12,2) NOT NULL DEFAULT 0,
    note VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4) PURCHASE MANAGEMENT
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    item VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    note VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5) PARTNERSHIP MANAGEMENT
CREATE TABLE IF NOT EXISTS partnerships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    partner1_name VARCHAR(100) DEFAULT 'Partner 1',
    partner1_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    partner2_name VARCHAR(100) DEFAULT 'Partner 2',
    partner2_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remarks VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Single-row settings table for partnership names / share % / withdrawn amount
CREATE TABLE IF NOT EXISTS partnership_settings (
    id INT PRIMARY KEY DEFAULT 1,
    partner1_name VARCHAR(100) DEFAULT 'Partner 1',
    partner2_name VARCHAR(100) DEFAULT 'Partner 2',
    partner1_share DECIMAL(5,2) DEFAULT NULL,
    partner2_share DECIMAL(5,2) DEFAULT NULL,
    withdrawn_amount DECIMAL(12,2) NOT NULL DEFAULT 0
);
INSERT IGNORE INTO partnership_settings (id) VALUES (1);

-- 6) PHOTOCOPY SERVICE (+ its per-record expense breakdown)
CREATE TABLE IF NOT EXISTS photocopy_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_copy INT NOT NULL DEFAULT 0,
    gross_amt DECIMAL(12,2) NOT NULL DEFAULT 0,
    rim_qty DECIMAL(10,2) NOT NULL DEFAULT 0,
    rim_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_amt DECIMAL(12,2) NOT NULL DEFAULT 0,
    service_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    final_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photocopy_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    photocopy_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (photocopy_id) REFERENCES photocopy_records(id) ON DELETE CASCADE
);

-- 7) MOBILE BANKING
CREATE TABLE IF NOT EXISTS mobile_banking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    details VARCHAR(255) NOT NULL,
    commission DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8) MINI SUMMARY
CREATE TABLE IF NOT EXISTS mini_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9) USERS
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    contact VARCHAR(50) DEFAULT '',
    role VARCHAR(50) DEFAULT 'Staff',
    status VARCHAR(20) DEFAULT 'Active',
    pin VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT IGNORE INTO users (id, name, username, contact, role, status, pin)
VALUES (1, 'Admin', 'admin', '', 'Administrator', 'Active', '');

-- 10) BUSINESS / SYSTEM SETTINGS (single row)
CREATE TABLE IF NOT EXISTS business_settings (
    id INT PRIMARY KEY DEFAULT 1,
    biz_name VARCHAR(150) DEFAULT 'Stationery',
    owner_name VARCHAR(150) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(150) DEFAULT '',
    address VARCHAR(255) DEFAULT '',
    currency VARCHAR(5) DEFAULT '৳',
    fy_start VARCHAR(2) DEFAULT '07',
    footer_note VARCHAR(255) DEFAULT '© 2026 Stationery Management System. All rights reserved.'
);
INSERT IGNORE INTO business_settings (id) VALUES (1);
