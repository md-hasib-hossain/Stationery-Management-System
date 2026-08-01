const express = require("express");
const db = require("../config/database");

/**
 * Builds a simple REST router (GET all, GET one, POST, PUT, DELETE one,
 * DELETE all) for a table whose columns map 1-to-1 onto the request body.
 *
 * @param {string} table   - table name, e.g. "cash_book"
 * @param {string[]} fields - column names allowed in the request body,
 *                            in the order they appear on the frontend
 *                            e.g. ["date", "type", "amount", "remarks"]
 */
function crudFactory(table, fields) {
    const router = express.Router();

    // GET /  -> list everything, newest first
    router.get("/", async (req, res) => {
        try {
            const [rows] = await db.query(
                `SELECT * FROM ${table} ORDER BY id DESC`
            );
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET /:id -> single record
    router.get("/:id", async (req, res) => {
        try {
            const [rows] = await db.query(
                `SELECT * FROM ${table} WHERE id = ?`,
                [req.params.id]
            );
            if (rows.length === 0) return res.status(404).json({ error: "Not found" });
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST / -> create
    router.post("/", async (req, res) => {
        try {
            const values = fields.map((f) => req.body[f] ?? null);
            const placeholders = fields.map(() => "?").join(", ");
            const [result] = await db.query(
                `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders})`,
                values
            );
            const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [
                result.insertId
            ]);
            res.status(201).json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /:id -> update
    router.put("/:id", async (req, res) => {
        try {
            const setClause = fields.map((f) => `${f} = ?`).join(", ");
            const values = fields.map((f) => req.body[f] ?? null);
            values.push(req.params.id);
            const [result] = await db.query(
                `UPDATE ${table} SET ${setClause} WHERE id = ?`,
                values
            );
            if (result.affectedRows === 0)
                return res.status(404).json({ error: "Not found" });
            const [rows] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [
                req.params.id
            ]);
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE /:id -> delete one
    router.delete("/:id", async (req, res) => {
        try {
            const [result] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [
                req.params.id
            ]);
            if (result.affectedRows === 0)
                return res.status(404).json({ error: "Not found" });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE / -> clear entire table
    router.delete("/", async (req, res) => {
        try {
            await db.query(`DELETE FROM ${table}`);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
}

module.exports = crudFactory;
