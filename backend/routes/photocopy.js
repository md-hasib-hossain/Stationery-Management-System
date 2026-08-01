const express = require("express");
const db = require("../config/database");
const router = express.Router();

const FIELDS = [
    "date",
    "total_copy",
    "gross_amt",
    "rim_qty",
    "rim_cost",
    "net_amt",
    "service_cost",
    "final_profit"
];

// Attach the nested `expenses` array (title/amount breakdown) to each record
async function attachExpenses(records) {
    if (records.length === 0) return records;
    const ids = records.map((r) => r.id);
    const [expenseRows] = await db.query(
        `SELECT * FROM photocopy_expenses WHERE photocopy_id IN (${ids.map(() => "?").join(", ")})`,
        ids
    );
    return records.map((r) => ({
        ...r,
        expenses: expenseRows
            .filter((e) => e.photocopy_id === r.id)
            .map((e) => ({ id: e.id, title: e.title, amount: e.amount }))
    }));
}

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM photocopy_records ORDER BY id DESC"
        );
        res.json(await attachExpenses(rows));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM photocopy_records WHERE id = ?",
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Not found" });
        const [withExpenses] = [await attachExpenses(rows)];
        res.json(withExpenses[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST body: { date, totalCopy, grossAmt, rimQty, rimCost, netAmt, serviceCost,
//              finalProfit, expenses: [{ title, amount }, ...] }
router.post("/", async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const values = FIELDS.map((f) => req.body[toCamelKeyMap[f]] ?? req.body[f] ?? null);
        const [result] = await conn.query(
            `INSERT INTO photocopy_records (${FIELDS.join(", ")}) VALUES (${FIELDS.map(() => "?").join(", ")})`,
            values
        );
        const photocopyId = result.insertId;
        const expenses = Array.isArray(req.body.expenses) ? req.body.expenses : [];
        for (const exp of expenses) {
            await conn.query(
                "INSERT INTO photocopy_expenses (photocopy_id, title, amount) VALUES (?, ?, ?)",
                [photocopyId, exp.title, exp.amount ?? 0]
            );
        }
        await conn.commit();
        const [rows] = await db.query(
            "SELECT * FROM photocopy_records WHERE id = ?",
            [photocopyId]
        );
        const withExpenses = await attachExpenses(rows);
        res.status(201).json(withExpenses[0]);
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

router.put("/:id", async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const values = FIELDS.map((f) => req.body[toCamelKeyMap[f]] ?? req.body[f] ?? null);
        values.push(req.params.id);
        const [result] = await conn.query(
            `UPDATE photocopy_records SET ${FIELDS.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`,
            values
        );
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Not found" });
        }
        if (Array.isArray(req.body.expenses)) {
            await conn.query("DELETE FROM photocopy_expenses WHERE photocopy_id = ?", [req.params.id]);
            for (const exp of req.body.expenses) {
                await conn.query(
                    "INSERT INTO photocopy_expenses (photocopy_id, title, amount) VALUES (?, ?, ?)",
                    [req.params.id, exp.title, exp.amount ?? 0]
                );
            }
        }
        await conn.commit();
        const [rows] = await db.query("SELECT * FROM photocopy_records WHERE id = ?", [req.params.id]);
        const withExpenses = await attachExpenses(rows);
        res.json(withExpenses[0]);
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
});

router.delete("/:id", async (req, res) => {
    try {
        // photocopy_expenses cascades automatically via FK ON DELETE CASCADE
        const [result] = await db.query("DELETE FROM photocopy_records WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete("/", async (req, res) => {
    try {
        await db.query("DELETE FROM photocopy_records");
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Accept both snake_case (DB-style) and camelCase (frontend-style) request bodies
const toCamelKeyMap = {
    date: "date",
    total_copy: "totalCopy",
    gross_amt: "grossAmt",
    rim_qty: "rimQty",
    rim_cost: "rimCost",
    net_amt: "netAmt",
    service_cost: "serviceCost",
    final_profit: "finalProfit"
};

module.exports = router;
