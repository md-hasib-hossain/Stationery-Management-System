const express = require("express");
const db = require("../config/database");
const router = express.Router();

const FIELDS = [
    "date",
    "partner1_name",
    "partner1_amount",
    "partner2_name",
    "partner2_amount",
    "remarks"
];

// GET /api/partnerships -> list of profit-share entries
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM partnerships ORDER BY id DESC"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const values = FIELDS.map((f) => req.body[f] ?? null);
        const [result] = await db.query(
            `INSERT INTO partnerships (${FIELDS.join(", ")}) VALUES (${FIELDS.map(() => "?").join(", ")})`,
            values
        );
        const [rows] = await db.query("SELECT * FROM partnerships WHERE id = ?", [
            result.insertId
        ]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const values = FIELDS.map((f) => req.body[f] ?? null);
        values.push(req.params.id);
        const [result] = await db.query(
            `UPDATE partnerships SET ${FIELDS.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
        const [rows] = await db.query("SELECT * FROM partnerships WHERE id = ?", [
            req.params.id
        ]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM partnerships WHERE id = ?", [
            req.params.id
        ]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/", async (req, res) => {
    try {
        await db.query("DELETE FROM partnerships");
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Partner names / share % / withdrawn-amount (single settings row) ---

router.get("/settings", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM partnership_settings WHERE id = 1"
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/settings", async (req, res) => {
    try {
        const { partner1_name, partner2_name, partner1_share, partner2_share, withdrawn_amount } = req.body;
        await db.query(
            `UPDATE partnership_settings
             SET partner1_name = ?, partner2_name = ?, partner1_share = ?, partner2_share = ?, withdrawn_amount = ?
             WHERE id = 1`,
            [
                partner1_name ?? "Partner 1",
                partner2_name ?? "Partner 2",
                partner1_share ?? null,
                partner2_share ?? null,
                withdrawn_amount ?? 0
            ]
        );
        const [rows] = await db.query(
            "SELECT * FROM partnership_settings WHERE id = 1"
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
