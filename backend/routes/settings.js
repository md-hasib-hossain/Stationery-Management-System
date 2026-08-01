const express = require("express");
const db = require("../config/database");
const router = express.Router();

const FIELDS = [
    "biz_name",
    "owner_name",
    "phone",
    "email",
    "address",
    "currency",
    "fy_start",
    "footer_note"
];

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM business_settings WHERE id = 1");
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/", async (req, res) => {
    try {
        const values = FIELDS.map((f) => req.body[f] ?? null);
        await db.query(
            `UPDATE business_settings SET ${FIELDS.map((f) => `${f} = ?`).join(", ")} WHERE id = 1`,
            values
        );
        const [rows] = await db.query("SELECT * FROM business_settings WHERE id = 1");
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reset back to factory defaults
router.post("/reset", async (req, res) => {
    try {
        await db.query(`
            UPDATE business_settings SET
                biz_name = 'Stationery',
                owner_name = '',
                phone = '',
                email = '',
                address = '',
                currency = '৳',
                fy_start = '07',
                footer_note = '© 2026 Stationery Management System. All rights reserved.'
            WHERE id = 1
        `);
        const [rows] = await db.query("SELECT * FROM business_settings WHERE id = 1");
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
