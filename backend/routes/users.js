const express = require("express");
const db = require("../config/database");
const router = express.Router();

const FIELDS = ["name", "username", "contact", "role", "status", "pin"];

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM users ORDER BY id ASC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/", async (req, res) => {
    try {
        const values = FIELDS.map((f) => req.body[f] ?? null);
        const [result] = await db.query(
            `INSERT INTO users (${FIELDS.join(", ")}) VALUES (${FIELDS.map(() => "?").join(", ")})`,
            values
        );
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const values = FIELDS.map((f) => req.body[f] ?? null);
        values.push(req.params.id);
        const [result] = await db.query(
            `UPDATE users SET ${FIELDS.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Username already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
