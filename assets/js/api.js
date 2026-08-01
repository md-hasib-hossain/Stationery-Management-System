// ============================================================
// API CLIENT — connects the frontend UI to the Express + MySQL
// backend (backend/server.js + backend/config/database.js).
//
// Every write the user makes (add / edit / delete) is still saved
// instantly to localStorage so the UI never feels slow or breaks
// when offline, and is ALSO sent to the backend in the background
// so it lands in the real MySQL database. On page load we ask the
// backend for the latest data and, if it answers, that becomes the
// source of truth (so multiple devices / a server restart all stay
// in sync with the database instead of just the browser's storage).
// ============================================================
(function (global) {
    "use strict";

    // Change this if the backend runs on a different host/port.
    const API_BASE = (global.API_BASE_URL) || "http://localhost:5000/api";
    const REQUEST_TIMEOUT_MS = 4000;

    function withTimeout(promise, ms) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return { controller, cleanup: () => clearTimeout(timer) };
    }

    async function request(path, options = {}) {
        const { controller, cleanup } = withTimeout(null, REQUEST_TIMEOUT_MS);
        try {
            const res = await fetch(`${API_BASE}${path}`, {
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                ...options
            });
            cleanup();
            if (!res.ok) {
                let msg = `HTTP ${res.status}`;
                try {
                    const body = await res.json();
                    if (body && body.error) msg = body.error;
                } catch (_) { /* ignore */ }
                throw new Error(msg);
            }
            if (res.status === 204) return null;
            return await res.json();
        } catch (err) {
            cleanup();
            throw err;
        }
    }

    const get = (path) => request(path, { method: "GET" });
    const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body || {}) });
    const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body || {}) });
    const del = (path) => request(path, { method: "DELETE" });

    // Quick reachability check used once at startup. Never throws.
    async function isServerOnline() {
        try {
            await get("/settings");
            return true;
        } catch (_) {
            return false;
        }
    }

    // Generic CRUD helper matching backend/routes/_crudFactory.js
    function makeCrud(basePath) {
        return {
            getAll: () => get(basePath),
            create: (data) => post(basePath, data),
            update: (id, data) => put(`${basePath}/${id}`, data),
            remove: (id) => del(`${basePath}/${id}`),
            removeAll: () => del(basePath)
        };
    }

    // --- field-name mappers (DB uses snake_case, some UI fields are camelCase) ---
    function partnershipToDb(p) {
        return {
            date: p.date,
            partner1_name: p.partner1Name,
            partner1_amount: p.partner1Amount,
            partner2_name: p.partner2Name,
            partner2_amount: p.partner2Amount,
            remarks: p.remarks
        };
    }
    function partnershipFromDb(row) {
        return {
            id: row.id,
            date: row.date,
            partner1Name: row.partner1_name,
            partner1Amount: Number(row.partner1_amount) || 0,
            partner2Name: row.partner2_name,
            partner2Amount: Number(row.partner2_amount) || 0,
            remarks: row.remarks
        };
    }

    function partnershipSettingsFromDb(row) {
        if (!row) return null;
        return {
            partner1_name: row.partner1_name,
            partner2_name: row.partner2_name,
            partner1_share: row.partner1_share === null ? null : Number(row.partner1_share),
            partner2_share: row.partner2_share === null ? null : Number(row.partner2_share),
            withdrawn_amount: Number(row.withdrawn_amount) || 0
        };
    }

    function businessSettingsToDb(s) {
        return {
            biz_name: s.bizName,
            owner_name: s.ownerName,
            phone: s.phone,
            email: s.email,
            address: s.address,
            currency: s.currency,
            fy_start: s.fyStart,
            footer_note: s.footerNote
        };
    }
    function businessSettingsFromDb(row) {
        if (!row) return null;
        return {
            bizName: row.biz_name,
            ownerName: row.owner_name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            currency: row.currency,
            fyStart: row.fy_start,
            footerNote: row.footer_note
        };
    }

    function photocopyFromDb(row) {
        return {
            id: row.id,
            date: row.date,
            totalCopy: Number(row.total_copy) || 0,
            grossAmt: Number(row.gross_amt) || 0,
            rimQty: Number(row.rim_qty) || 0,
            rimCost: Number(row.rim_cost) || 0,
            netAmt: Number(row.net_amt) || 0,
            serviceCost: Number(row.service_cost) || 0,
            finalProfit: Number(row.final_profit) || 0,
            expenses: Array.isArray(row.expenses)
                ? row.expenses.map((e) => ({ title: e.title, amount: Number(e.amount) || 0 }))
                : []
        };
    }

    function numericFields(row, fields) {
        const out = { ...row };
        fields.forEach((f) => { if (out[f] !== undefined) out[f] = Number(out[f]) || 0; });
        return out;
    }

    global.StationeryAPI = {
        isServerOnline,

        cashBook: makeCrud("/cashbook"),
        expenses: makeCrud("/expenses"),
        dailySales: makeCrud("/sales"),
        purchases: makeCrud("/purchases"),
        mobileBanking: makeCrud("/mobile-banking"),
        miniSummary: makeCrud("/mini-summary"),
        users: makeCrud("/users"),

        // normalizers for records where the DB returns numeric strings
        normalizeCashBook: (row) => numericFields(row, ["amount"]),
        normalizeExpense: (row) => numericFields(row, ["amount"]),
        normalizeSale: (row) => numericFields(row, ["stationery", "profit"]),
        normalizePurchase: (row) => numericFields(row, ["amount"]),
        normalizeMb: (row) => numericFields(row, ["commission"]),
        normalizeMs: (row) => numericFields(row, ["amount"]),

        partnerships: {
            getAll: async () => (await get("/partnerships")).map(partnershipFromDb),
            create: async (p) => partnershipFromDb(await post("/partnerships", partnershipToDb(p))),
            remove: (id) => del(`/partnerships/${id}`),
            getSettings: async () => partnershipSettingsFromDb(await get("/partnerships/settings")),
            saveSettings: async (s) => partnershipSettingsFromDb(await put("/partnerships/settings", s))
        },

        photocopy: {
            getAll: async () => (await get("/photocopy")).map(photocopyFromDb),
            create: async (rec) => photocopyFromDb(await post("/photocopy", rec)),
            remove: (id) => del(`/photocopy/${id}`)
        },

        settings: {
            get: async () => businessSettingsFromDb(await get("/settings")),
            save: async (s) => businessSettingsFromDb(await put("/settings", businessSettingsToDb(s))),
            reset: async () => businessSettingsFromDb(await post("/settings/reset"))
        },

        backup: {
            exportAll: () => get("/backup"),
            restore: (backupJson) => post("/backup/restore", backupJson),
            clearTransactions: () => post("/backup/clear-transactions"),
            factoryReset: () => post("/backup/factory-reset")
        }
    };
})(window);
