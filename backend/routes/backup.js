const express = require("express");
const db = require("../config/database");
const router = express.Router();

// Tables that make up "transactional" data (cleared by Clear Data,
// kept by Factory Reset only clearing everything including these + users/settings)
const TRANSACTIONAL_TABLES = [
    "cash_book",
    "expenses",
    "daily_sales",
    "purchases",
    "partnerships",
    "photocopy_records", // photocopy_expenses cascades
    "mobile_banking",
    "mini_summary"
];

// GET /api/backup -> full JSON export of every module
router.get("/", async (req, res) => {
    try {
        const data = {};
        for (const table of TRANSACTIONAL_TABLES) {
            const [rows] = await db.query(`SELECT * FROM ${table}`);
            data[table] = rows;
        }
        const [users] = await db.query("SELECT * FROM users");
        const [settings] = await db.query("SELECT * FROM business_settings WHERE id = 1");
        const [partnershipSettings] = await db.query("SELECT * FROM partnership_settings WHERE id = 1");
        data.users = users;
        data.business_settings = settings[0];
        data.partnership_settings = partnershipSettings[0];
        data.exportedAt = new Date().toISOString();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/backup/restore -> overwrite everything from an uploaded backup JSON
router.post("/restore", async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const backup = req.body;

        for (const table of TRANSACTIONAL_TABLES) {
            await conn.query(`DELETE FROM ${table}`);
            const rows = backup[table];
            if (Array.isArray(rows)) {
                for (const row of rows) {
                    const cols = Object.keys(row).filter((c) => c !== "id");
                    if (cols.length === 0) continue;
                    await conn.query(
                        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
                        cols.map((c) => row[c])
                    );
                }
            }
        }

        if (Array.isArray(backup.users)) {
            await conn.query("DELETE FROM users");
            for (const u of backup.users) {
                await conn.query(
                    "INSERT INTO users (name, username, contact, role, status, pin) VALUES (?, ?, ?, ?, ?, ?)",
                    [u.name, u.username, u.contact, u.role, u.status, u.pin]
                );
            }
        }

        if (backup.business_settings) {
            const s = backup.business_settings;
            await conn.query(
                `UPDATE business_settings SET biz_name=?, owner_name=?, phone=?, email=?, address=?, currency=?, fy_start=?, footer_note=? WHERE id = 1`,
                [s.biz_name, s.owner_name, s.phone, s.email, s.address, s.currency, s.fy_start, s.footer_note]
            );
        }

        if (backup.partnership_settings) {
            const p = backup.partnership_settings;
            await conn.query(
                `UPDATE partnership_settings SET partner1_name=?, partner2_name=?, partner1_share=?, partner2_share=?, withdrawn_amount=? WHERE id = 1`,
                [p.partner1_name, p.partner2_name, p.partner1_share, p.partner2_share, p.withdrawn_amount]
            );
        }

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// POST /api/backup/clear-transactions -> "Clear Data" danger-zone button
router.post("/clear-transactions", async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        for (const table of TRANSACTIONAL_TABLES) {
            await conn.query(`DELETE FROM ${table}`);
        }
        await conn.query(
            "UPDATE partnership_settings SET withdrawn_amount = 0 WHERE id = 1"
        );
        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

// POST /api/backup/factory-reset -> wipe everything, including users/settings
router.post("/factory-reset", async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        for (const table of TRANSACTIONAL_TABLES) {
            await conn.query(`DELETE FROM ${table}`);
        }
        await conn.query("DELETE FROM users");
        await conn.query(
            "INSERT INTO users (name, username, contact, role, status, pin) VALUES ('Admin', 'admin', '', 'Administrator', 'Active', '')"
        );
        await conn.query(`
            UPDATE business_settings SET
                biz_name = 'Stationery', owner_name = '', phone = '', email = '',
                address = '', currency = '৳', fy_start = '07',
                footer_note = '© 2026 Stationery Management System. All rights reserved.'
            WHERE id = 1
        `);
        await conn.query(
            "UPDATE partnership_settings SET partner1_name='Partner 1', partner2_name='Partner 2', partner1_share=NULL, partner2_share=NULL, withdrawn_amount=0 WHERE id = 1"
        );
        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
