document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.querySelector(".toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main");
    const pageTitle = document.getElementById("page-title");

    // --- HELPER FUNCTION: SAFE DROPDOWN TEXT GETTER ---
    function getSelectedText(elementId, fallback = "All") {
        const el = document.getElementById(elementId);
        return (el && el.selectedIndex >= 0 && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].text : fallback;
    }

    // --- LIVE DATABASE ENGINE (INTEGRATED WITH LOCALSTORAGE) ---
    let cashBookData = JSON.parse(localStorage.getItem('cashBookData')) || [
        { date: '2026-07-19', type: 'Sales', amount: 5000, remarks: 'Daily regular shop sales' },
        { date: '2026-07-19', type: 'Purchase', amount: 2000, remarks: 'Paper and Ink purchase' }
    ];

    // --- EXPENSE MANAGEMENT DATABASE ENGINE ---
    let expenseData = JSON.parse(localStorage.getItem('expenseData')) || [
        { id: 6001, date: '2026-07-19', category: 'Electricity Bill', amount: 1500, note: 'Shop monthly bill' }
    ];

    // --- DAILY SALES SYSTEM ENGINE DATA INITIALIZATION ---
    let dailySalesData = JSON.parse(localStorage.getItem('dailySalesData')) || [
        { id: 5001, date: '2026-07-19', purpose: 'Book Binding & Papers', stationery: 2000, profit: 500, note: 'Initial System Entry' }
    ];

    // --- PURCHASE MANAGEMENT DATABASE ENGINE ---
    let purchaseData = JSON.parse(localStorage.getItem('purchaseData')) || [
        { id: 4001, date: '2026-07-19', item: 'A4 Size Paper Box & Pilot Pens', amount: 2000, note: 'Supplier Market Entry' }
    ];

    // --- MIGRATION HELPER ---
    function migratePartnershipData(rawData) {
        if (!Array.isArray(rawData) || rawData.length === 0) return [];
        if (rawData[0] && Object.prototype.hasOwnProperty.call(rawData[0], 'partner1Name')) {
            return rawData;
        }
        const groups = {};
        const order = [];
        rawData.forEach((entry) => {
            const key = (entry.date || '') + '|' + (entry.remarks || '');
            if (!groups[key]) { groups[key] = []; order.push(key); }
            groups[key].push(entry);
        });
        return order.map((key) => {
            const group = groups[key];
            return {
                id: Math.floor(8000 + Math.random() * 2000),
                date: group[0]?.date || '2026-07-19',
                remarks: group[0]?.remarks || '',
                partner1Name: group[0]?.partnerName || 'Partner 1',
                partner1Amount: group[0]?.shareAmount || 0,
                partner2Name: group[1]?.partnerName || 'Partner 2',
                partner2Amount: group[1]?.shareAmount || 0
            };
        });
    }

    // --- PARTNERSHIP MANAGEMENT DATABASE ENGINE ---
    let partnershipData = migratePartnershipData(JSON.parse(localStorage.getItem('partnershipData')) || [
        { id: 8001, date: '2026-07-19', partner1Name: 'Rahim Ahmed', partner1Amount: 25000, partner2Name: 'Partner 2', partner2Amount: 25000, remarks: 'Initial Business Capital Share' }
    ]);
    localStorage.setItem('partnershipData', JSON.stringify(partnershipData));

    // --- WITHDRAWN / SETTLED PROFIT TRACKER ---
    let partnerWithdrawnAmount = parseFloat(localStorage.getItem('partnerWithdrawnAmount')) || 0;

    // --- ONLINE COST DATABASE ENGINE ---
    // let onlineCostData = JSON.parse(localStorage.getItem('onlineCostData'));

    let onlineCostData = [];
    localStorage.removeItem('onlineCostData');

    // --- PHOTOCOPY SERVICE DATABASE ENGINE ---
    let pmCombinedData = null;
    let photocopyServiceRecords = JSON.parse(localStorage.getItem('photocopyServiceRecords')) || [
        {
            id: 7001, date: "2026-07-19", totalCopy: 10000, grossAmt: 20000, rimQty: 22.22, rimCost: 7778, netAmt: 12222, serviceCost: 500, finalProfit: 11722,
            expenses: [{ title: "Toner Refill", amount: 300 }, { title: "Technician Tip", amount: 200 }]
        },
        {
            id: 7002, date: "2026-07-18", totalCopy: 5000, grossAmt: 10000, rimQty: 11.11, rimCost: 3889, netAmt: 6111, serviceCost: 500, finalProfit: 5611,
            expenses: [{ title: "Machine Service", amount: 500 }]
        }
    ];

    // --- MOBILE BANKING SYSTEM DB ARRAY ---
    let mbTransactions = JSON.parse(localStorage.getItem('mbTransactions')) || [
        { id: 9001, date: "2026-07-19", details: "bKash Cash In 5000", commission: 25 },
        { id: 9002, date: "2026-07-19", details: "Nagad Cash Out 3000", commission: 15 },
        { id: 9003, date: "2026-07-10", details: "Rocket Personal Payin 2000", commission: 10 }
    ];

    // Mini Summary Data
    let miniSummaryData = JSON.parse(localStorage.getItem('miniSummaryData')) || [];

    // --- SHARED TOTALS STORE FOR "TOTAL PROFIT" CARD ---
    let dashboardTotals = { todayProfit: 0, finalNetIncome: 0, photocopyProfit: 0, mobileProfit: 0 };

    function updateOverallTotalProfit() {
        const rawTotal = (dashboardTotals.todayProfit || 0) + (dashboardTotals.finalNetIncome || 0) + (dashboardTotals.photocopyProfit || 0);
        const availableTotal = Math.max(0, rawTotal - (partnerWithdrawnAmount || 0));
        const overallEl = document.getElementById("dash-overall-profit");
        if (overallEl) overallEl.innerText = "৳ " + Math.round(availableTotal).toLocaleString('en-IN');
        if (typeof updatePartnershipSplitUI === 'function') updatePartnershipSplitUI();
    }

    // --- SPECIFIC CARD PROFIT UPDATER ENGINE ---
    function updateProfitCardsOnly(filteredPsProfit, filteredMbProfit) {
        let mbProfit = 0;
        if (typeof filteredMbProfit !== 'undefined') {
            mbProfit = filteredMbProfit;
        } else if (typeof mbTransactions !== 'undefined' && Array.isArray(mbTransactions)) {
            const selectedMonth = document.getElementById("mb-filter-month")?.value || "all";
            const selectedYear = document.getElementById("mb-filter-year")?.value || "all";
            mbProfit = mbTransactions.reduce((acc, curr) => {
                const txYear = curr.date.substring(0, 4);
                const txMonth = curr.date.substring(5, 7);
                const isMatch = (selectedMonth === "all" || txMonth === selectedMonth) &&
                    (selectedYear === "all" || txYear === selectedYear);
                return isMatch ? acc + (curr.commission || 0) : acc;
            }, 0);
        }

        const mbElement = document.getElementById("dash-mobile-profit");
        if (mbElement) mbElement.innerText = "৳ " + mbProfit.toLocaleString('en-IN');
        dashboardTotals.mobileProfit = mbProfit;

        let psProfit = 0;
        if (typeof filteredPsProfit !== 'undefined') {
            psProfit = filteredPsProfit;
        } else if (typeof photocopyServiceRecords !== 'undefined' && Array.isArray(photocopyServiceRecords)) {
            const selectedMonth = document.getElementById("ps-filter-month")?.value || "all";
            const selectedYear = document.getElementById("ps-filter-year")?.value || "all";
            psProfit = photocopyServiceRecords.reduce((acc, curr) => {
                const year = curr.date.substring(0, 4);
                const month = curr.date.substring(5, 7);
                const isMatch = (selectedMonth === "all" || month === selectedMonth) &&
                    (selectedYear === "all" || year === selectedYear);
                return isMatch ? acc + (curr.finalProfit || 0) : acc;
            }, 0);
        }

        const psElement = document.getElementById("dash-photocopy-profit");
        if (psElement) psElement.innerText = "৳ " + psProfit.toLocaleString('en-IN');
        dashboardTotals.photocopyProfit = psProfit;

        updateOverallTotalProfit();
    }

    // --- Mobile Sidebar Backdrop (created dynamically, no HTML edit required) ---
    let sidebarBackdrop = document.querySelector(".sidebar-backdrop");
    if (!sidebarBackdrop) {
        sidebarBackdrop = document.createElement("div");
        sidebarBackdrop.className = "sidebar-backdrop";
        document.body.appendChild(sidebarBackdrop);
    }

    function closeMobileSidebar() {
        sidebar.classList.remove("show-sidebar");
        sidebarBackdrop.classList.remove("show-backdrop");
    }

    function openMobileSidebar() {
        sidebar.classList.add("show-sidebar");
        sidebarBackdrop.classList.add("show-backdrop");
    }

    sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    // Sidebar Toggle
    if (toggleBtn && sidebar && mainContent) {
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.innerWidth <= 768) {
                if (sidebar.classList.contains("show-sidebar")) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }
            } else {
                sidebar.classList.toggle("mini-sidebar");
                mainContent.classList.toggle("expand-main");
            }
        });
    }

    // Auto-close mobile sidebar after choosing a menu item (nicer mobile UX)
    document.querySelectorAll(".sidebar ul li.menu-item").forEach(function (item) {
        item.addEventListener("click", function () {
            if (window.innerWidth <= 768) closeMobileSidebar();
        });
    });

    // Keep sidebar state sane when resizing across the mobile breakpoint
    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) closeMobileSidebar();
    });

    // Function to Switch Pages smoothly
    function switchPage(targetViewId, menuText) {
        document.querySelector(".sidebar ul .active")?.classList.remove("active");
        const targetMenuItem = document.querySelector(`.sidebar ul .menu-item[data-target="${targetViewId}"]`);
        if (targetMenuItem) targetMenuItem.classList.add("active");
        if (pageTitle) pageTitle.innerText = menuText;
        const targetViewElement = document.getElementById(`view-${targetViewId}`);
        if (targetViewElement) {
            document.querySelector("#dynamic-content .active-view")?.classList.remove("active-view");
            targetViewElement.classList.add("active-view");
        }
        if (targetViewId === "mobile-banking") updateMobileBankingUI();
        if (targetViewId === "online-cost") calculateOnlineCostAll();
        if (targetViewId === "mini-summary") renderMiniSummaryTable();
        if (targetViewId === "daily-sale" || targetViewId === "daily-report") renderDailySalesTable();
        if (targetViewId === "daily-report" && typeof renderDailyReport === "function") renderDailyReport();
        if (targetViewId === "monthly-report" && typeof renderMonthlyReport === "function") renderMonthlyReport();
        if (targetViewId === "yearly-report" && typeof renderYearlyReport === "function") renderYearlyReport();
        if (targetViewId === "purchase") renderPurchaseTable();
        if (targetViewId === "expense-management") renderExpenseTable();
        if (targetViewId === "partnership" || targetViewId === "partnership-management") { renderPartnershipTable(); updatePartnershipSplitUI(); }
        if (targetViewId === "cash-book") updateCashBookUI();
        if (targetViewId === "photocopy-service") updatePhotocopyServiceUI();
    }

    // Navigation System for Sidebar
    const menuItems = document.querySelectorAll(".sidebar ul .menu-item");
    menuItems.forEach((item) => {
        item.addEventListener("click", function () {
            const targetViewId = this.getAttribute("data-target");
            if (targetViewId === "logout") return;
            const menuText = this.querySelector("span")?.innerText || "Dashboard";
            switchPage(targetViewId, menuText);
        });
    });

    // View All Buttons Click Handlers
    const viewAllButtons = document.querySelectorAll(".btn-view-all");
    viewAllButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            const boxTitle = this.closest(".box")?.querySelector("h3")?.innerText.toLowerCase() || "";
            if (boxTitle.includes("cash book")) switchPage("cash-book", "Cash Book");
            else if (boxTitle.includes("mini summary")) switchPage("mini-summary", "Mini Summary");
        });
    });

    // Top Matrix Cards "View Details" Click Handlers
    const cardDetailsLinks = document.querySelectorAll(".card-footer a");
    cardDetailsLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const card = this.closest(".card");
            if (!card) return;
            if (card.classList.contains("expense-card")) switchPage("expense-management", "Expense Management");
            else if (card.classList.contains("profit-card")) switchPage("photocopy-service", "Photocopy Service");
            else if (card.classList.contains("cash-card")) switchPage("cash-book", "Cash Book");
        });
    });

    function formatFinancialDate(dateString) {
        if (!dateString) return '';
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
    }

    // --- PARTNERSHIP MANAGEMENT ---
    const partnerTableBody = document.querySelector('#main-partnership-table tbody');
    const partnerFilterMonth = document.getElementById('partner-filter-month') || document.getElementById('partnership-filter-month');
    const partnerFilterYear = document.getElementById('partner-filter-year') || document.getElementById('partnership-filter-year');
    const partner1NameInput = document.getElementById('partner1-name-input');
    const partner2NameInput = document.getElementById('partner2-name-input');
    const partnerTotalProfitDisplay = document.getElementById('partner-total-profit-display');
    const partner1ShareInput = document.getElementById('partner1-share-input');
    const partner2ShareInput = document.getElementById('partner2-share-input');
    const partnerSettleDateInput = document.getElementById('partner-settle-date');
    const partnerSettleNoteInput = document.getElementById('partner-settle-note');
    const btnSettlePartnership = document.getElementById('btn-settle-partnership');
    const partnerWithdrawnDisplay = document.getElementById('partner-withdrawn-display');
    const btnResetPartnerWithdrawn = document.getElementById('btn-reset-partner-withdrawn');
    const btnAutofillSplit = document.getElementById('btn-autofill-5050');

    let partnerNamesData = JSON.parse(localStorage.getItem('partnerNamesData')) || { partner1: 'Partner 1', partner2: 'Partner 2' };
    if (partner1NameInput) partner1NameInput.value = partnerNamesData.partner1;
    if (partner2NameInput) partner2NameInput.value = partnerNamesData.partner2;

    function savePartnerNames() {
        partnerNamesData = {
            partner1: (partner1NameInput?.value.trim()) || 'Partner 1',
            partner2: (partner2NameInput?.value.trim()) || 'Partner 2'
        };
        localStorage.setItem('partnerNamesData', JSON.stringify(partnerNamesData));
    }
    partner1NameInput?.addEventListener('input', savePartnerNames);
    partner2NameInput?.addEventListener('input', savePartnerNames);

    let partnerShareValues = JSON.parse(localStorage.getItem('partnerShareValues')) || { partner1: null, partner2: null };
    if (partner1ShareInput && partnerShareValues.partner1 !== null) partner1ShareInput.value = partnerShareValues.partner1;
    if (partner2ShareInput && partnerShareValues.partner2 !== null) partner2ShareInput.value = partnerShareValues.partner2;

    function savePartnerShareValues() {
        partnerShareValues = {
            partner1: (partner1ShareInput?.value !== '' && partner1ShareInput?.value !== undefined) ? (parseFloat(partner1ShareInput.value) || 0) : null,
            partner2: (partner2ShareInput?.value !== '' && partner2ShareInput?.value !== undefined) ? (parseFloat(partner2ShareInput.value) || 0) : null
        };
        localStorage.setItem('partnerShareValues', JSON.stringify(partnerShareValues));
    }
    partner1ShareInput?.addEventListener('input', savePartnerShareValues);
    partner2ShareInput?.addEventListener('input', savePartnerShareValues);

    btnAutofillSplit?.addEventListener('click', function (e) {
        e.preventDefault();
        const rawTotal = (dashboardTotals.todayProfit || 0) + (dashboardTotals.finalNetIncome || 0) + (dashboardTotals.photocopyProfit || 0);
        const availableTotal = Math.max(0, rawTotal - (partnerWithdrawnAmount || 0));
        const half = Math.round(availableTotal / 2);
        if (partner1ShareInput) partner1ShareInput.value = half;
        if (partner2ShareInput) partner2ShareInput.value = half;
        savePartnerShareValues();
    });

    function updatePartnershipSplitUI() {
        const rawTotal = (dashboardTotals.todayProfit || 0) + (dashboardTotals.finalNetIncome || 0) + (dashboardTotals.photocopyProfit || 0);
        const availableTotal = Math.max(0, rawTotal - (partnerWithdrawnAmount || 0));
        if (partnerTotalProfitDisplay) partnerTotalProfitDisplay.innerText = "৳ " + Math.round(availableTotal).toLocaleString('en-IN');
        if (partnerWithdrawnDisplay) partnerWithdrawnDisplay.innerText = "৳ " + Math.round(partnerWithdrawnAmount || 0).toLocaleString('en-IN');
        const half = Math.round(availableTotal / 2);
        if (partner1ShareInput && partner1ShareInput.value === '' && partnerShareValues.partner1 === null) {
            partner1ShareInput.value = half;
        }
        if (partner2ShareInput && partner2ShareInput.value === '' && partnerShareValues.partner2 === null) {
            partner2ShareInput.value = half;
        }
    }

    btnSettlePartnership?.addEventListener('click', function () {
        const partner1Amt = Math.max(0, parseFloat(partner1ShareInput?.value) || 0);
        const partner2Amt = Math.max(0, parseFloat(partner2ShareInput?.value) || 0);
        const totalToSettle = partner1Amt + partner2Amt;
        if (totalToSettle <= 0) {
            alert("দুঃখিত, Settle করার জন্য কোনো Amount দেওয়া হয়নি। অনুগ্রহ করে Partner 1 ও Partner 2 এর ঘরে এমাউন্ট লিখুন।");
            return;
        }
        const dateVal = partnerSettleDateInput?.value || '2026-07-19';
        const noteVal = (partnerSettleNoteInput?.value.trim()) || 'Profit Settlement';
        const partner1Name = (partner1NameInput?.value.trim()) || 'Partner 1';
        const partner2Name = (partner2NameInput?.value.trim()) || 'Partner 2';
        if (!confirm(`${partner1Name}: ৳ ${partner1Amt.toLocaleString()}\n${partner2Name}: ৳ ${partner2Amt.toLocaleString()}\n\nএই এমাউন্ট সেটেল করে সেভ করতে চান?`)) return;
        partnershipData.unshift({
            id: Math.floor(8000 + Math.random() * 2000),
            date: dateVal,
            partner1Name: partner1Name,
            partner1Amount: partner1Amt,
            partner2Name: partner2Name,
            partner2Amount: partner2Amt,
            remarks: noteVal
        });
        localStorage.setItem('partnershipData', JSON.stringify(partnershipData));
        renderPartnershipTable();
        partnerWithdrawnAmount += totalToSettle;
        localStorage.setItem('partnerWithdrawnAmount', JSON.stringify(partnerWithdrawnAmount));
        if (partner1ShareInput) partner1ShareInput.value = '';
        if (partner2ShareInput) partner2ShareInput.value = '';
        partnerShareValues = { partner1: null, partner2: null };
        localStorage.setItem('partnerShareValues', JSON.stringify(partnerShareValues));
        updateOverallTotalProfit();
        if (partnerSettleNoteInput) partnerSettleNoteInput.value = '';
        alert("প্রফিট সফলভাবে সেভ করা হয়েছে!");
    });

    btnResetPartnerWithdrawn?.addEventListener('click', function (e) {
        e.preventDefault();
        if (confirm('আপনি কি Withdrawn এমাউন্ট রিসেট করতে চান? এটি করলে Available Total Profit আবার পূর্ণ পরিমাণে দেখাবে।')) {
            partnerWithdrawnAmount = 0;
            localStorage.removeItem('partnerWithdrawnAmount');
            updateOverallTotalProfit();
        }
    });

    if (partnerFilterMonth) partnerFilterMonth.addEventListener('change', renderPartnershipTable);
    if (partnerFilterYear) partnerFilterYear.addEventListener('change', renderPartnershipTable);

    function renderPartnershipTable() {
        if (!partnerTableBody) return;
        partnerTableBody.innerHTML = '';
        const selectedMonth = partnerFilterMonth?.value || 'all';
        const selectedYear = partnerFilterYear?.value || 'all';
        let totalPartner1Sum = 0;
        let totalPartner2Sum = 0;
        let serial = 1;
        partnershipData.forEach((entry, index) => {
            const dateParts = (entry.date || '2026-07-19').split('-');
            const entryYear = dateParts[0];
            const entryMonth = dateParts[1];
            const matchMonth = (selectedMonth === 'all' || selectedMonth === entryMonth);
            const matchYear = (selectedYear === 'all' || selectedYear === entryYear);
            if (matchMonth && matchYear) {
                const p1Amt = entry.partner1Amount || 0;
                const p2Amt = entry.partner2Amount || 0;
                totalPartner1Sum += p1Amt;
                totalPartner2Sum += p2Amt;
                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #cbd5e1";
                tr.innerHTML = `
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${serial++}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${formatFinancialDate(entry.date)}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; background: #f8fbff;">${entry.partner1Name || 'Partner 1'}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: #2563eb; background: #f8fbff;">৳ ${p1Amt.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; background: #f8fbff;">
                        <div class="action-cell" style="justify-content: center; display: flex; gap: 10px;">
                            <button type="button" class="btn-print-row btn-print-partner" data-id="${entry.id}" data-partner="1" style="border: none; background: transparent; color: #2563eb; cursor: pointer;">
                                <i class="fas fa-print"></i>
                            </button>
                            <button type="button" class="btn-delete-row btn-delete-partner" data-index="${index}" style="border: none; background: transparent; color: #ef4444; cursor: pointer;">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; background: #f7fdfa;">${entry.partner2Name || 'Partner 2'}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: #059669; background: #f7fdfa;">৳ ${p2Amt.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; background: #f7fdfa;">
                        <div class="action-cell" style="justify-content: center; display: flex; gap: 10px;">
                            <button type="button" class="btn-print-row btn-print-partner" data-id="${entry.id}" data-partner="2" style="border: none; background: transparent; color: #2563eb; cursor: pointer;">
                                <i class="fas fa-print"></i>
                            </button>
                            <button type="button" class="btn-delete-row btn-delete-partner" data-index="${index}" style="border: none; background: transparent; color: #ef4444; cursor: pointer;">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                partnerTableBody.appendChild(tr);
            }
        });
        if (document.getElementById('total-partner1-share')) {
            document.getElementById('total-partner1-share').innerText = "৳ " + totalPartner1Sum.toLocaleString();
        }
        if (document.getElementById('total-partner2-share')) {
            document.getElementById('total-partner2-share').innerText = "৳ " + totalPartner2Sum.toLocaleString();
        }
        if (document.getElementById('total-partnership-share')) {
            document.getElementById('total-partnership-share').innerText = "৳ " + (totalPartner1Sum + totalPartner2Sum).toLocaleString();
        }
    }

    partnerTableBody?.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.btn-delete-partner');
        const printBtn = e.target.closest('.btn-print-partner');
        if (deleteBtn) {
            const index = parseInt(deleteBtn.getAttribute('data-index'));
            if (confirm('আপনি কি এই পার্টনারশিপ সেটেলমেন্ট রেকর্ডটি (উভয় পার্টনার সহ) মুছে ফেলতে চান?')) {
                partnershipData.splice(index, 1);
                localStorage.setItem('partnershipData', JSON.stringify(partnershipData));
                renderPartnershipTable();
            }
        }
        if (printBtn) {
            const idToPrint = parseInt(printBtn.getAttribute("data-id"));
            const whichPartner = printBtn.getAttribute("data-partner");
            const rec = partnershipData.find(r => r.id === idToPrint);
            if (rec) {
                const printTitle = document.getElementById("print-title-main");
                const printSubtitle = document.getElementById("print-subtitle-main");
                const printMeta = document.getElementById("print-meta-area");
                const printWrapper = document.getElementById("print-dynamic-table-wrapper");

                if (printTitle) printTitle.innerText = "PARTNERSHIP INVESTMENT VOUCHER";
                if (printSubtitle) printSubtitle.innerText = `Voucher ID: #PARTNER-${rec.id}-P${whichPartner}`;
                if (printMeta) printMeta.innerHTML = `<p><strong>Date:</strong> ${formatFinancialDate(rec.date)}</p><p><strong>Partner Name:</strong> ${whichPartner === '1' ? rec.partner1Name : rec.partner2Name}</p>`;

                const pName = whichPartner === '1' ? (rec.partner1Name || 'Partner 1') : (rec.partner2Name || 'Partner 2');
                const pAmt = whichPartner === '1' ? (rec.partner1Amount || 0) : (rec.partner2Amount || 0);

                let tableHtml = `
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Partner Name</th>
                                <th>Share / Investment Amount</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${pName}</td>
                                <td style="font-weight: bold; color: #0284c7;">৳ ${pAmt.toLocaleString()}</td>
                                <td>${rec.remarks || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                if (printWrapper) printWrapper.innerHTML = tableHtml;
                window.print();
            }
        }
    });

    document.getElementById("btn-print-partner-report")?.addEventListener("click", function () {
        const mText = getSelectedText("partner-filter-month") || getSelectedText("partnership-filter-month");
        const yText = getSelectedText("partner-filter-year") || getSelectedText("partnership-filter-year");

        const printTitle = document.getElementById("print-title-main");
        const printSubtitle = document.getElementById("print-subtitle-main");
        const printMeta = document.getElementById("print-meta-area");
        const printWrapper = document.getElementById("print-dynamic-table-wrapper");

        if (printTitle) printTitle.innerText = "PARTNERS RECORD LEDGER STATEMENT";
        if (printSubtitle) printSubtitle.innerText = `Statement Period: ${mText} - ${yText}`;
        if (printMeta) printMeta.innerHTML = `<p><strong>Report Type:</strong> Partner Distribution Summary</p><p><strong>Generated Date:</strong> 19 Jul 2026</p>`;

        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="width: 6%;">SL</th>
                        <th style="width: 12%;">Date</th>
                        <th>Partner 1 Name</th>
                        <th style="text-align: right;">Partner 1 Amount (৳)</th>
                        <th>Partner 2 Name</th>
                        <th style="text-align: right;">Partner 2 Amount (৳)</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody> 
        `;
        let totalP1 = 0, totalP2 = 0, sl = 1;
        const selectedMonth = partnerFilterMonth ? partnerFilterMonth.value : "all";
        const selectedYear = partnerFilterYear ? partnerFilterYear.value : "all";
        partnershipData.forEach(entry => {
            const dateParts = (entry.date || '2026-07-19').split('-');
            const txYear = dateParts[0];
            const txMonth = dateParts[1];
            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                const p1Amt = entry.partner1Amount || 0;
                const p2Amt = entry.partner2Amount || 0;
                totalP1 += p1Amt;
                totalP2 += p2Amt;
                tableHtml += `
                    <tr>
                        <td style="text-align: center;">${sl++}</td>
                        <td style="text-align: center;">${formatFinancialDate(entry.date)}</td>
                        <td style="font-weight: 600;">${entry.partner1Name || 'Partner 1'}</td>
                        <td style="text-align: right; color: #2563eb;">৳ ${p1Amt.toLocaleString()}</td>
                        <td style="font-weight: 600;">${entry.partner2Name || 'Partner 2'}</td>
                        <td style="text-align: right; color: #059669;">৳ ${p2Amt.toLocaleString()}</td>
                        <td>${entry.remarks || '-'}</td>
                    </tr>
                `;
            }
        });
        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box" style="margin-left: auto; width: 380px; margin-top: 20px;">
                <div class="print-summary-row">
                    <span>Partner 1 Total Amount:</span>
                    <span style="color: #2563eb;">৳ ${totalP1.toLocaleString()}</span>
                </div>
                <div class="print-summary-row">
                    <span>Partner 2 Total Amount:</span>
                    <span style="color: #059669;">৳ ${totalP2.toLocaleString()}</span>
                </div>
                <div class="print-summary-row" style="font-weight: bold; background: #f8fafc;">
                    <span>Total Distributed Profit:</span>
                    <span style="color: #0284c7;">৳ ${(totalP1 + totalP2).toLocaleString()}</span>
                </div>
            </div>
        `;
        if (printWrapper) printWrapper.innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    // --- PHOTOCOPY SERVICE SYSTEM ENGINE ---
    function updatePhotocopyServiceUI() {
        const tableBody = document.querySelector("#main-ps-table tbody");
        const filterMonth = document.getElementById("ps-filter-month")?.value || "all";
        const filterYear = document.getElementById("ps-filter-year")?.value || "all";
        let sl = 1;
        let totalFilteredProfit = 0;
        if (tableBody) tableBody.innerHTML = "";
        photocopyServiceRecords.forEach((rec) => {
            const year = rec.date.substring(0, 4);
            const month = rec.date.substring(5, 7);
            const isMatch = (filterMonth === "all" || month === filterMonth) &&
                (filterYear === "all" || year === filterYear);
            if (isMatch) {
                totalFilteredProfit += rec.finalProfit;
                if (tableBody) {
                    let expenseDisplayHtml = `<span style="color: #e11d48; font-weight: 700; font-size: 13px;">৳ ${(rec.serviceCost || 0).toLocaleString()}</span>`;
                    if (rec.expenses && rec.expenses.length > 0) {
                        expenseDisplayHtml += `<div style="font-size: 11px; color: #475569; margin-top: 5px; line-height: 1.4; border-top: 1px dashed #fecdd3; padding-top: 4px;">`;
                        rec.expenses.forEach(e => {
                            expenseDisplayHtml += `• <strong>${e.title}:</strong> ৳${e.amount}<br>`;
                        });
                        expenseDisplayHtml += `</div>`;
                    }
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${sl}</td>
                        <td>${formatFinancialDate(rec.date)}</td>
                        <td>${rec.totalCopy.toLocaleString()} Pcs</td>
                        <td>৳ ${rec.grossAmt.toLocaleString()}</td>
                        <td>${Number(rec.rimQty).toFixed(2)} Rims</td>
                        <td>৳ ${rec.rimCost.toLocaleString()}</td>
                        <td>৳ ${rec.netAmt.toLocaleString()}</td>
                        <td style="background: #fffdfd; border-left: 2px solid #fecdd3; border-right: 2px solid #fecdd3;">
                            ${expenseDisplayHtml}
                        </td>
                        <td class="font-semibold text-green" style="font-size: 14px;">৳ ${rec.finalProfit.toLocaleString()}</td>
                        <td>
                            <div class="action-cell">
                                <button class="btn-print-row btn-print-ps" data-id="${rec.id}"><i class="fas fa-print"></i></button>
                                <button class="btn-delete-row btn-delete-ps" data-id="${rec.id}"><i class="fas fa-trash-can"></i></button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                    sl++;
                }
            }
        });
        if (document.getElementById("ps-total-profit-box")) {
            document.getElementById("ps-total-profit-box").innerText = "৳ " + totalFilteredProfit.toLocaleString();
        }
        updateProfitCardsOnly(totalFilteredProfit);
    }

    document.getElementById("btn-save-ps-record")?.addEventListener("click", function () {
        if (typeof calculatePhotocopyMachine === "function") calculatePhotocopyMachine();
        if (!pmCombinedData || pmCombinedData.totalCopy <= 0) {
            alert("দুঃখিত, কোনো ডাটা পাওয়া যায়নি! প্রথমে Photocopy Machine ক্যালকুলেটরে রিডিং ইনপুট দিন।");
            return;
        }
        const dateVal = pmCombinedData.date;
        const totalCopy = pmCombinedData.totalCopy;
        const grossAmt = pmCombinedData.grossAmt;
        const rimQty = pmCombinedData.rimQty;
        const rimCost = pmCombinedData.rimCost;
        const netAmt = pmCombinedData.netAmt;
        const serviceCost = pmCombinedData.serviceCost;
        const finalProfit = pmCombinedData.finalProfit;
        let currentExpensesList = [];
        const titles = document.querySelectorAll(".pm-expense-title");
        const amounts = document.querySelectorAll(".pm-expense-amt");
        for (let i = 0; i < titles.length; i++) {
            let titleText = titles[i].value.trim();
            let amountVal = parseFloat(amounts[i].value) || 0;
            if (titleText !== "" || amountVal > 0) {
                currentExpensesList.push({ title: titleText || "General Maintenance", amount: amountVal });
            }
        }
        const newRecord = {
            id: Math.floor(7000 + Math.random() * 3000),
            date: dateVal, totalCopy, grossAmt, rimQty, rimCost, netAmt, serviceCost, finalProfit, expenses: currentExpensesList
        };
        photocopyServiceRecords.unshift(newRecord);
        localStorage.setItem('photocopyServiceRecords', JSON.stringify(photocopyServiceRecords));
        updatePhotocopyServiceUI();
        alert("ক্যালকুলেশন সাকসেসফুলি সেভ করা হয়েছে!");
    });

    document.getElementById("main-ps-table")?.addEventListener("click", function (e) {
        const deleteBtn = e.target.closest(".btn-delete-ps");
        const printBtn = e.target.closest(".btn-print-ps");
        if (deleteBtn) {
            const idToDelete = parseInt(deleteBtn.getAttribute("data-id"));
            if (confirm("আপনি কি এই ফটোকপি সার্ভিস রেকর্ডটি ডিলিট করতে চান?")) {
                photocopyServiceRecords = photocopyServiceRecords.filter(r => r.id !== idToDelete);
                localStorage.setItem('photocopyServiceRecords', JSON.stringify(photocopyServiceRecords));
                updatePhotocopyServiceUI();
            }
        }
        if (printBtn) {
            const idToPrint = parseInt(printBtn.getAttribute("data-id"));
            const rec = photocopyServiceRecords.find(r => r.id === idToPrint);
            if (rec) {
                document.getElementById("print-title-main").innerText = "PHOTOCOPY SERVICE TRANSACTION VOUCHER";
                document.getElementById("print-subtitle-main").innerText = `Record ID: #${rec.id}`;
                document.getElementById("print-meta-area").innerHTML = `<p><strong>Date:</strong> ${formatFinancialDate(rec.date)}</p><p><strong>Status:</strong> Saved Log Entry</p>`;
                let expenseNotes = `৳ ${(rec.serviceCost || 0).toLocaleString()}`;
                if (rec.expenses && rec.expenses.length > 0) {
                    expenseNotes += " (";
                    rec.expenses.forEach((ex, idx) => {
                        expenseNotes += `${ex.title}: ৳${ex.amount}${idx < rec.expenses.length - 1 ? ', ' : ''}`;
                    });
                    expenseNotes += ")";
                }
                let tableHtml = `
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Total Copy</th>
                                <th>Gross Amt</th>
                                <th>Rim Used</th>
                                <th>Rim Cost</th>
                                <th>Net Amt</th>
                                <th>Expenses Breakdown</th>
                                <th>Final Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${rec.totalCopy.toLocaleString()} Pcs</td>
                                <td>৳ ${rec.grossAmt.toLocaleString()}</td>
                                <td>${Number(rec.rimQty).toFixed(2)} Rims</td>
                                <td>৳ ${rec.rimCost.toLocaleString()}</td>
                                <td>৳ ${rec.netAmt.toLocaleString()}</td>
                                <td>${expenseNotes}</td>
                                <td style="font-weight: bold; color: green;">৳ ${rec.finalProfit.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml;
                window.print();
            }
        }
    });

    document.getElementById("btn-print-ps-report")?.addEventListener("click", function () {
        const mText = getSelectedText("ps-filter-month");
        const yText = getSelectedText("ps-filter-year");
        document.getElementById("print-title-main").innerText = "PHOTOCOPY SERVICE REPORT STATEMENT";
        document.getElementById("print-subtitle-main").innerText = `Statement Period: ${mText} - ${yText}`;
        document.getElementById("print-meta-area").innerHTML = `<p><strong>Report Type:</strong> Full History Log</p><p><strong>Status:</strong> Generated Successfully</p>`;
        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th>SL</th>
                        <th>Date</th>
                        <th>Total Copy</th>
                        <th>Gross Amt</th>
                        <th>Rim Qty</th>
                        <th>Rim Cost</th>
                        <th>Net Amt</th>
                        <th>Service Expense</th>
                        <th>Final Profit</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let totalCopies = 0, totalGross = 0, totalRimCost = 0, totalNet = 0, totalExp = 0, totalProfit = 0, sl = 1;
        const selectedMonth = document.getElementById("ps-filter-month")?.value || "all";
        const selectedYear = document.getElementById("ps-filter-year")?.value || "all";
        photocopyServiceRecords.forEach(rec => {
            const txYear = rec.date.substring(0, 4);
            const txMonth = rec.date.substring(5, 7);
            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                totalCopies += rec.totalCopy;
                totalGross += rec.grossAmt;
                totalRimCost += rec.rimCost;
                totalNet += rec.netAmt;
                totalExp += rec.serviceCost;
                totalProfit += rec.finalProfit;
                tableHtml += `
                    <tr>
                        <td>${sl}</td>
                        <td>${formatFinancialDate(rec.date)}</td>
                        <td>${rec.totalCopy.toLocaleString()} Pcs</td>
                        <td>৳ ${rec.grossAmt.toLocaleString()}</td>
                        <td>${Number(rec.rimQty).toFixed(2)} Rims</td>
                        <td>৳ ${rec.rimCost.toLocaleString()}</td>
                        <td>৳ ${rec.netAmt.toLocaleString()}</td>
                        <td>৳ ${rec.serviceCost.toLocaleString()}</td>
                        <td style="font-weight: 600;">৳ ${rec.finalProfit.toLocaleString()}</td>
                    </tr>
                `;
                sl++;
            }
        });
        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box">
                <div class="print-summary-row"><span>Total Copies:</span><span>${totalCopies.toLocaleString()} Pcs</span></div>
                <div class="print-summary-row"><span>Total Volume:</span><span>৳ ${totalGross.toLocaleString()}</span></div>
                <div class="print-summary-row"><span>Total Rim Cost (-):</span><span>৳ ${totalRimCost.toLocaleString()}</span></div>
                <div class="print-summary-row"><span>Service Expenses (-):</span><span>৳ ${totalExp.toLocaleString()}</span></div>
                <div class="print-summary-row" style="font-weight: bold; background: #e2e8f0;"><span>Total Net Profit:</span><span>৳ ${totalProfit.toLocaleString()}</span></div>
            </div>
        `;
        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    document.getElementById("ps-filter-month")?.addEventListener("change", updatePhotocopyServiceUI);
    document.getElementById("ps-filter-year")?.addEventListener("change", updatePhotocopyServiceUI);

    // --- CASH BOOK ENGINE ---
    function updateCashBookUI() {
        const mainTableBody = document.querySelector("#main-cashbook-table tbody") || document.querySelector("#main-cb-table tbody");
        const dashTableBody = document.querySelector("#dash-cashbook-table tbody");
        const selectedMonth = (document.getElementById("filter-month") || document.getElementById("cb-filter-month"))?.value || "all";
        const selectedYear = (document.getElementById("filter-year") || document.getElementById("cb-filter-year"))?.value || "all";
        let totalPurchase = 0;
        let totalSales = 0;
        let totalGrossProfit = 0;
        let ledgerSl = 1;
        let recentSl = 0;
        if (mainTableBody) mainTableBody.innerHTML = "";
        if (dashTableBody) dashTableBody.innerHTML = "";
        cashBookData.forEach((entry, index) => {
            const txYear = entry.date.substring(0, 4);
            const txMonth = entry.date.substring(5, 7);
            const isMatch = (selectedMonth === "all" || txMonth === selectedMonth) &&
                (selectedYear === "all" || txYear === selectedYear);
            if (isMatch) {
                let purchaseVal = 0;
                let salesVal = 0;
                let profitVal = 0;
                if (entry.type === "Purchase" || entry.type === "debit") {
                    purchaseVal = entry.amount;
                    totalPurchase += purchaseVal;
                } else if (entry.type === "Sales" || entry.type === "credit") {
                    salesVal = entry.amount;
                    if (entry.remarks && entry.remarks.includes("[Daily Sale]")) {
                        const match = dailySalesData.find(d => entry.remarks.includes(`Stat: ৳${d.stationery}`) && d.date === entry.date);
                        profitVal = match ? match.profit : (salesVal * 0.25);
                    } else {
                        profitVal = salesVal * 0.25;
                    }
                    totalSales += salesVal;
                    totalGrossProfit += profitVal;
                }
                if (mainTableBody) {
                    const tr = document.createElement("tr");
                    tr.style.borderBottom = "1px solid #cbd5e1";
                    tr.innerHTML = `
                        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">${ledgerSl}</td>
                        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">${formatFinancialDate(entry.date)}</td>
                        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #dc2626;">${purchaseVal > 0 ? '৳ ' + purchaseVal.toLocaleString() : '-'}</td>
                        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #16a34a;">${salesVal > 0 ? '৳ ' + salesVal.toLocaleString() : '-'}</td>
                        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #2563eb; font-weight: 600;">${profitVal > 0 ? '৳ ' + Math.round(profitVal).toLocaleString() : '-'}</td>
                        <td style="padding: 10px; border: 1px solid #cbd5e1;">${entry.remarks || entry.note || ''}</td>
                        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">
                            <div class="action-cell" style="justify-content: center;">
                                <button type="button" class="btn-print-row btn-print-cash-single" data-index="${index}" style="border: none; background: transparent; color: #2563eb; cursor: pointer; margin-right: 8px;">
                                    <i class="fas fa-print"></i>
                                </button>
                                <button type="button" class="btn-delete-cb btn-delete-cash" data-index="${index}" style="border: none; background: transparent; color: #ef4444; cursor: pointer;">
                                    <i class="fas fa-trash-can"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    mainTableBody.appendChild(tr);
                    ledgerSl++;
                }
                if (dashTableBody && recentSl < 5) {
                    const trDash = document.createElement("tr");
                    trDash.innerHTML = `
                        <td>${formatFinancialDate(entry.date)}</td>
                        <td class="text-red">${purchaseVal > 0 ? '৳ ' + purchaseVal.toLocaleString() : '-'}</td>
                        <td class="text-green">${salesVal > 0 ? '৳ ' + salesVal.toLocaleString() : '-'}</td>
                        <td>${entry.remarks || entry.note || ''}</td>
                    `;
                    dashTableBody.appendChild(trDash);
                    recentSl++;
                }
            }
        });

        let totalOtherExpenses = 0;
        expenseData.forEach((exp) => {
            const dateParts = exp.date.split('-');
            const expYear = dateParts[0];
            const expMonth = dateParts[1];
            if ((selectedMonth === 'all' || selectedMonth === expMonth) && (selectedYear === 'all' || selectedYear === expYear)) {
                totalOtherExpenses += exp.amount;
            }
        });

        miniSummaryData.forEach((entry) => {
            const dateParts = entry.date.split('-');
            const entryYear = dateParts[0];
            const entryMonth = dateParts[1];
            if ((selectedMonth === 'all' || selectedMonth === entryMonth) && (selectedYear === 'all' || selectedYear === entryYear)) {
                totalOtherExpenses += entry.amount;
            }
        });

        const netProfit = totalGrossProfit - totalOtherExpenses;
        const cashInHand = totalSales - totalPurchase;
        if (document.getElementById("cb-total-purchase")) document.getElementById("cb-total-purchase").innerText = "৳ " + totalPurchase.toLocaleString();
        if (document.getElementById("cb-total-sales")) document.getElementById("cb-total-sales").innerText = "৳ " + totalSales.toLocaleString();
        if (document.getElementById("cb-total-profit")) document.getElementById("cb-total-profit").innerText = "৳ " + Math.round(netProfit).toLocaleString();
        if (document.getElementById("total-debit")) document.getElementById("total-debit").innerText = `৳ ${totalPurchase.toLocaleString()}`;
        if (document.getElementById("total-credit")) document.getElementById("total-credit").innerText = `৳ ${totalSales.toLocaleString()}`;
        if (document.getElementById("net-balance")) document.getElementById("net-balance").innerText = `৳ ${cashInHand.toLocaleString()}`;
        if (document.getElementById("dash-sale")) document.getElementById("dash-sale").innerText = `৳ ${totalSales.toLocaleString()}`;
        if (document.getElementById("dash-expense")) document.getElementById("dash-expense").innerText = `৳ ${totalPurchase.toLocaleString()}`;
        if (document.getElementById("dash-cash")) document.getElementById("dash-cash").innerText = `৳ ${cashInHand.toLocaleString()}`;
        if (document.getElementById("dash-profit")) document.getElementById("dash-profit").innerText = `৳ ${Math.round(netProfit).toLocaleString()}`;

        dashboardTotals.todayProfit = netProfit;
        updateOverallTotalProfit();
    }

    document.getElementById("cashbook-form")?.addEventListener("submit", function (e) {
        e.preventDefault();
        const date = document.getElementById("input-date").value;
        const type = document.getElementById("input-type").value;
        const amount = parseFloat(document.getElementById("input-amount").value) || 0;
        const remarks = document.getElementById("input-note").value;

        if (amount <= 0) return alert("সঠিক অ্যামাউন্ট ইনপুট দিন।");

        cashBookData.unshift({ date, type: (type === 'credit' ? 'Sales' : (type === 'debit' ? 'Purchase' : type)), amount, remarks });
        localStorage.setItem('cashBookData', JSON.stringify(cashBookData));

        updateCashBookUI();
        this.reset();
        if (document.getElementById("input-date")) document.getElementById("input-date").value = "2026-07-19";
    });

    const cbTableSelector = document.getElementById("main-cashbook-table");
    cbTableSelector?.addEventListener("click", function (e) {
        const deleteBtn = e.target.closest(".btn-delete-cash");
        const printBtn = e.target.closest(".btn-print-cash-single");

        if (deleteBtn) {
            const index = parseInt(deleteBtn.getAttribute("data-index"));
            if (confirm("আপনি কি নিশ্চিতভাবে এই রেকর্ডটি ডিলিট করতে চান?")) {
                cashBookData.splice(index, 1);
                localStorage.setItem('cashBookData', JSON.stringify(cashBookData));
                updateCashBookUI();
            }
        }

        if (printBtn) {
            const index = parseInt(printBtn.getAttribute("data-index"));
            const tx = cashBookData[index];
            if (tx) {
                document.getElementById("print-title-main").innerText = "SINGLE TRANSACTION VOUCHER";
                document.getElementById("print-subtitle-main").innerText = `Log ID: #CB-${index + 1000}`;
                document.getElementById("print-meta-area").innerHTML = `<p><strong>Date:</strong> ${formatFinancialDate(tx.date)}</p><p><strong>Type:</strong> ${tx.type.toUpperCase()}</p>`;

                let tableHtml = `
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Particulars / Remarks</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${tx.remarks || tx.note || 'N/A'}</td>
                                <td>৳ ${tx.amount.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml;
                window.print();
            }
        }
    });

    document.getElementById("btn-print-ledger")?.addEventListener("click", function () {
        const mText = getSelectedText("filter-month") || getSelectedText("cb-filter-month");
        const yText = getSelectedText("filter-year") || getSelectedText("cb-filter-year");

        document.getElementById("print-title-main").innerText = "CASH BOOK LEDGER STATEMENT";
        document.getElementById("print-subtitle-main").innerText = `Statement Period: ${mText} - ${yText}`;
        document.getElementById("print-meta-area").innerHTML = `<p><strong>Report Type:</strong> Full Ledger</p><p><strong>Status:</strong> Generated Successfully</p>`;

        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th>SL</th>
                        <th>Date</th>
                        <th>Debit (Out ৳)</th>
                        <th>Credit (In ৳)</th>
                        <th>Note / Particulars</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalDebit = 0, totalCredit = 0, sl = 1;
        const selectedMonth = (document.getElementById("filter-month") || document.getElementById("cb-filter-month"))?.value || "all";
        const selectedYear = (document.getElementById("filter-year") || document.getElementById("cb-filter-year"))?.value || "all";

        cashBookData.forEach(tx => {
            const txYear = tx.date.substring(0, 4);
            const txMonth = tx.date.substring(5, 7);
            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                let isCredit = (tx.type === "Sales" || tx.type === "credit");
                if (!isCredit) totalDebit += tx.amount;
                else totalCredit += tx.amount;

                tableHtml += `
                    <tr>
                        <td>${sl}</td>
                        <td>${formatFinancialDate(tx.date)}</td>
                        <td>${!isCredit ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                        <td>${isCredit ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                        <td>${tx.remarks || tx.note || ''}</td>
                    </tr>
                `;
                sl++;
            }
        });

        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box">
                <div class="print-summary-row"><span>Total Expense (Debit):</span><span>৳ ${totalDebit.toLocaleString()}</span></div>
                <div class="print-summary-row"><span>Total Income (Credit):</span><span>৳ ${totalCredit.toLocaleString()}</span></div>
                <div class="print-summary-row" style="font-weight: bold; background: #e2e8f0;"><span>Net Balance:</span><span>৳ ${(totalCredit - totalDebit).toLocaleString()}</span></div>
            </div>
        `;

        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    document.getElementById("filter-month")?.addEventListener("change", updateCashBookUI);
    document.getElementById("filter-year")?.addEventListener("change", updateCashBookUI);

    // --- EXPENSE MANAGEMENT ---
    const expenseForm = document.getElementById('expense-form');
    const expDateInput = document.getElementById('expense-date');
    const expCategoryInput = document.getElementById('expense-category');
    const expAmountInput = document.getElementById('expense-amount');
    const expNoteInput = document.getElementById('expense-note');
    const expTableBody = document.querySelector('#main-expense-table tbody');
    const txtTotalExpense = document.getElementById('total-expense-amount');

    if (expenseForm) {
        expenseForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const dateVal = expDateInput.value;
            const categoryVal = expCategoryInput.value;
            const amountVal = parseFloat(expAmountInput.value) || 0;
            const noteVal = expNoteInput.value.trim();

            if (amountVal <= 0) {
                alert("দয়া করে সঠিক খরচের পরিমাণ ইনপুট দিন।");
                return;
            }

            const newExpenseRecord = {
                id: Math.floor(6000 + Math.random() * 2000),
                date: dateVal,
                category: categoryVal,
                amount: amountVal,
                note: noteVal || 'General Expense'
            };

            expenseData.unshift(newExpenseRecord);
            localStorage.setItem('expenseData', JSON.stringify(expenseData));

            cashBookData.unshift({
                date: dateVal,
                type: 'Purchase',
                amount: amountVal,
                remarks: `[Expense] ${categoryVal} | Note: ${noteVal}`
            });
            localStorage.setItem('cashBookData', JSON.stringify(cashBookData));

            renderExpenseTable();
            updateCashBookUI();
            this.reset();

            if (expDateInput) expDateInput.value = "2026-07-19";
            alert("খরচের হিসাব সফলভাবে সেভ এবং ক্যাশ বুকে যুক্ত করা হয়েছে!");
        });
    }

    document.getElementById('expense-filter-month')?.addEventListener('change', renderExpenseTable);
    document.getElementById('expense-filter-year')?.addEventListener('change', renderExpenseTable);

    function renderExpenseTable() {
        if (!expTableBody) return;
        expTableBody.innerHTML = '';

        const selectedMonth = document.getElementById('expense-filter-month')?.value || 'all';
        const selectedYear = document.getElementById('expense-filter-year')?.value || 'all';

        let totalExpenseSum = 0;
        let serial = 1;

        expenseData.forEach((entry, index) => {
            const dateParts = entry.date.split('-');
            const entryYear = dateParts[0];
            const entryMonth = dateParts[1];

            const matchMonth = (selectedMonth === 'all' || selectedMonth === entryMonth);
            const matchYear = (selectedYear === 'all' || selectedYear === entryYear);

            if (matchMonth && matchYear) {
                totalExpenseSum += entry.amount;

                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #cbd5e1";
                tr.innerHTML = `
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${serial++}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${formatFinancialDate(entry.date)}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 500;">${entry.category}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: #dc2626;">৳ ${entry.amount.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${entry.note || '-'}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">
                        <div class="action-cell" style="justify-content: center; display: flex; gap: 10px;">
                            <button type="button" class="btn-print-row btn-print-exp" data-id="${entry.id}" style="border: none; background: transparent; color: #2563eb; cursor: pointer;">
                                <i class="fas fa-print"></i>
                            </button>
                            <button type="button" class="btn-delete-row btn-delete-exp" data-index="${index}" style="border: none; background: transparent; color: #ef4444; cursor: pointer;">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                expTableBody.appendChild(tr);
            }
        });

        if (txtTotalExpense) txtTotalExpense.innerHTML = `৳ ${totalExpenseSum.toLocaleString()}`;
    }

    expTableBody?.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.btn-delete-exp');
        const printBtn = e.target.closest('.btn-print-exp');

        if (deleteBtn) {
            const index = parseInt(deleteBtn.getAttribute('data-index'));
            if (confirm('আপনি কি এই খরচের রেকর্ডটি মুছে ফেলতে চান?')) {
                expenseData.splice(index, 1);
                localStorage.setItem('expenseData', JSON.stringify(expenseData));
                renderExpenseTable();
                updateCashBookUI();
            }
        }

        if (printBtn) {
            const idToPrint = parseInt(printBtn.getAttribute("data-id"));
            const rec = expenseData.find(r => r.id === idToPrint);
            if (rec) {
                document.getElementById("print-title-main").innerText = "EXPENSE TRANSACTION VOUCHER";
                document.getElementById("print-subtitle-main").innerText = `Voucher ID: #EXP-${rec.id}`;
                document.getElementById("print-meta-area").innerHTML = `<p><strong>Date:</strong> ${formatFinancialDate(rec.date)}</p><p><strong>Category:</strong> ${rec.category}</p>`;

                let tableHtml = `
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Expense Category</th>
                                <th>Particulars / Description</th>
                                <th>Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${rec.category}</td>
                                <td>${rec.note || 'N/A'}</td>
                                <td style="font-weight: bold; color: #dc2626;">৳ ${rec.amount.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml;
                window.print();
            }
        }
    });

    document.getElementById("btn-print-expense-report")?.addEventListener("click", function () {
        const mText = getSelectedText("expense-filter-month");
        const yText = getSelectedText("expense-filter-year");

        document.getElementById("print-title-main").innerText = "OFFICE EXPENSE STATEMENT REPORT";
        document.getElementById("print-subtitle-main").innerText = `Report Period: ${mText} - ${yText}`;
        document.getElementById("print-meta-area").innerHTML = `<p><strong>Report Type:</strong> Debit Ledger Summary</p><p><strong>Generated Date:</strong> 19 Jul 2026</p>`;

        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="width: 8%;">SL</th>
                        <th style="width: 15%;">Date</th>
                        <th>Expense Category</th>
                        <th style="text-align: right; width: 25%;">Amount (৳)</th>
                        <th>Description / Note</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalExpense = 0, sl = 1;
        const selectedMonth = document.getElementById("expense-filter-month")?.value || "all";
        const selectedYear = document.getElementById("expense-filter-year")?.value || "all";

        expenseData.forEach(entry => {
            const dateParts = entry.date.split('-');
            const txYear = dateParts[0];
            const txMonth = dateParts[1];

            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                totalExpense += entry.amount;
                tableHtml += `
                    <tr>
                        <td style="text-align: center;">${sl++}</td>
                        <td style="text-align: center;">${formatFinancialDate(entry.date)}</td>
                        <td style="font-weight: 500;">${entry.category}</td>
                        <td style="text-align: right; color: red;">৳ ${entry.amount.toLocaleString()}</td>
                        <td>${entry.note || '-'}</td>
                    </tr>
                `;
            }
        });

        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box" style="margin-left: auto; width: 350px; margin-top: 20px;">
                <div class="print-summary-row" style="font-weight: bold; background: #f8fafc;">
                    <span>Total Net Expenses:</span>
                    <span style="color: red;">৳ ${totalExpense.toLocaleString()}</span>
                </div>
            </div>
        `;

        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    // --- DAILY SALES SYSTEM ---
    const dsForm = document.getElementById('dailysale-form');
    const dsDateInput = document.getElementById('sale-date');
    const dsPurposeInput = document.getElementById('sale-purpose');
    const dsStationeryInput = document.getElementById('sale-stationery');
    const dsNoteInput = document.getElementById('sale-note');
    const dsTableBody = document.querySelector('#main-dailysale-table tbody');
    const dsFilterMonth = document.getElementById('sale-filter-month') || document.getElementById('daily-report-filter-month');
    const dsFilterYear = document.getElementById('sale-filter-year') || document.getElementById('daily-report-filter-year');
    const txtTotalStationery = document.getElementById('total-stationery-sales');
    const txtEstimatedProfit = document.getElementById('profit-revenue-sales');
    const dashSaleTableBody = document.querySelector("#dash-sale-table tbody");

    if (dsForm) {
        dsForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const dateVal = dsDateInput.value;
            const purposeVal = dsPurposeInput.value.trim();
            const stationeryVal = parseFloat(dsStationeryInput.value) || 0;
            const noteVal = dsNoteInput.value.trim();

            if (stationeryVal <= 0) {
                alert("দয়া করে সঠিক বিক্রয় মূল্য ইনপুট দিন।");
                return;
            }

            const profitVal = stationeryVal * 0.25;

            const newSaleRecord = {
                id: Math.floor(5000 + Math.random() * 2000),
                date: dateVal,
                purpose: purposeVal,
                stationery: stationeryVal,
                profit: Math.round(profitVal),
                note: noteVal || 'Daily Entry'
            };

            dailySalesData.unshift(newSaleRecord);
            localStorage.setItem('dailySalesData', JSON.stringify(dailySalesData));

            cashBookData.unshift({
                date: dateVal,
                type: 'Sales',
                amount: stationeryVal,
                remarks: `[Daily Sale] ${purposeVal} | Stat: ৳${stationeryVal} | ${noteVal}`
            });
            localStorage.setItem('cashBookData', JSON.stringify(cashBookData));

            renderDailySalesTable();
            updateCashBookUI();
            this.reset();

            if (dsDateInput) dsDateInput.value = "2026-07-19";
            alert("ডেইলি সেলস ডেটা সফলভাবে সেভ এবং ক্যাশ বুকে যুক্ত করা হয়েছে!");
        });
    }

    if (dsFilterMonth) dsFilterMonth.addEventListener('change', renderDailySalesTable);
    if (dsFilterYear) dsFilterYear.addEventListener('change', renderDailySalesTable);

    function renderDailySalesTable() {
        if (!dsTableBody) return;
        dsTableBody.innerHTML = '';
        if (dashSaleTableBody) dashSaleTableBody.innerHTML = '';

        const selectedMonth = dsFilterMonth?.value || 'all';
        const selectedYear = dsFilterYear?.value || 'all';

        let totalStatSum = 0;
        let totalProfitSum = 0;
        let serial = 1;
        let dashCount = 0;

        dailySalesData.forEach((entry, index) => {
            const dateParts = entry.date.split('-');
            const entryYear = dateParts[0];
            const entryMonth = dateParts[1];

            const matchMonth = (selectedMonth === 'all' || selectedMonth === entryMonth);
            const matchYear = (selectedYear === 'all' || selectedYear === entryYear);

            if (matchMonth && matchYear) {
                totalStatSum += entry.stationery;
                totalProfitSum += entry.profit;

                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #cbd5e1";
                tr.innerHTML = `
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${serial++}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${formatFinancialDate(entry.date)}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 500; vertical-align: middle;">${entry.purpose || 'N/A'}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: #1e3a8a; vertical-align: middle;">৳ ${entry.stationery.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: #16a34a; vertical-align: middle;">৳ ${entry.profit.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${entry.note || '-'}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">
                        <div class="action-cell" style="justify-content: center; display: flex; gap: 10px;">
                            <button type="button" class="btn-print-row btn-print-ds" data-id="${entry.id}" style="border: none; background: transparent; color: #2563eb; cursor: pointer; font-size: 14px;">
                                <i class="fas fa-print"></i>
                            </button>
                            <button type="button" class="btn-delete-row btn-delete-ds" data-index="${index}" style="border: none; background: transparent; color: #ef4444; cursor: pointer; font-size: 14px;">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                dsTableBody.appendChild(tr);

                if (dashSaleTableBody && dashCount < 5) {
                    const trDash = document.createElement('tr');
                    trDash.innerHTML = `
                        <td style="text-align: center; padding: 8px;">${formatFinancialDate(entry.date)}</td>
                        <td style="text-align: center; padding: 8px;">${entry.purpose || 'N/A'}</td>
                        <td class="text-blue" style="font-weight: 600; text-align: center; padding: 8px;">৳ ${entry.stationery.toLocaleString()}</td>
                    `;
                    dashSaleTableBody.appendChild(trDash);
                    dashCount++;
                }
            }
        });

        if (txtTotalStationery) txtTotalStationery.innerHTML = `৳ ${totalStatSum.toLocaleString()}`;
        if (txtEstimatedProfit) txtEstimatedProfit.innerHTML = `৳ ${totalProfitSum.toLocaleString()}`;
    }

    if (dsTableBody) {
        dsTableBody.addEventListener('click', function (e) {
            const deleteBtn = e.target.closest('.btn-delete-ds');
            const printBtn = e.target.closest('.btn-print-ds');

            if (deleteBtn) {
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                if (confirm('আপনি কি এই সেলস রেকর্ডটি মুছে ফেলতে চান?')) {
                    dailySalesData.splice(index, 1);
                    localStorage.setItem('dailySalesData', JSON.stringify(dailySalesData));
                    renderDailySalesTable();
                    updateCashBookUI();
                }
            }

            if (printBtn) {
                const idToPrint = parseInt(printBtn.getAttribute('data-id'));
                const rec = dailySalesData.find(r => r.id === idToPrint);
                if (rec) {
                    document.getElementById("print-title-main").innerText = "DAILY STATIONERY SALE VOUCHER";
                    document.getElementById("print-subtitle-main").innerText = `Voucher ID: #DS-${rec.id}`;
                    document.getElementById("print-meta-area").innerHTML = `<p><strong>Date:</strong> ${formatFinancialDate(rec.date)}</p><p><strong>Purpose:</strong> ${rec.purpose || 'N/A'}</p>`;

                    let tableHtml = `
                        <table class="print-table">
                            <thead>
                                <tr>
                                    <th>Purpose / Particulars</th>
                                    <th>Stationery Sales Amount</th>
                                    <th>Estimated Net Profit (25%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${rec.purpose || 'N/A'}</td>
                                    <td style="font-weight: bold; color: #1e3a8a;">৳ ${rec.stationery.toLocaleString()}</td>
                                    <td style="font-weight: bold; color: green;">৳ ${rec.profit.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p style="margin-top: 15px; font-size:13px;"><strong>Note:</strong> ${rec.note}</p>
                    `;
                    document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml;
                    window.print();
                }
            }
        });
    }

    const btnPrintDailyReport = document.getElementById("btn-print-ds-report") || document.getElementById("btn-print-daily-report");
    btnPrintDailyReport?.addEventListener("click", function () {
        const mText = getSelectedText("sale-filter-month") || getSelectedText("daily-report-filter-month");
        const yText = getSelectedText("sale-filter-year") || getSelectedText("daily-report-filter-year");

        document.getElementById("print-title-main").innerText = "STATIONERY DAILY SALES STATEMENT";
        document.getElementById("print-subtitle-main").innerText = `Report Period: ${mText} - ${yText}`;
        document.getElementById("print-meta-area").innerHTML = `
            <p><strong>Report Type:</strong> Sales Ledger Sheet</p>
            <p><strong>Generated Date:</strong> 19 Jul 2026</p>
        `;

        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="width: 8%;">SL</th>
                        <th style="width: 15%;">Date</th>
                        <th>Purpose / Description</th>
                        <th style="text-align: right; width: 20%;">Stationery Sale (৳)</th>
                        <th style="text-align: right; width: 20%;">25% Profit (৳)</th>
                        <th style="width: 15%;">Remarks</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalStationery = 0, totalProfit = 0, sl = 1;
        const selectedMonth = dsFilterMonth ? dsFilterMonth.value : "all";
        const selectedYear = dsFilterYear ? dsFilterYear.value : "all";

        dailySalesData.forEach(entry => {
            const dateParts = entry.date.split('-');
            const txYear = dateParts[0];
            const txMonth = dateParts[1];

            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                totalStationery += entry.stationery;
                totalProfit += entry.profit;

                tableHtml += `
                    <tr>
                        <td style="text-align: center;">${sl}</td>
                        <td style="text-align: center;">${formatFinancialDate(entry.date)}</td>
                        <td>${entry.purpose || 'N/A'}</td>
                        <td style="text-align: right;">৳ ${entry.stationery.toLocaleString()}</td>
                        <td style="text-align: right; color: green; font-weight: 600;">৳ ${entry.profit.toLocaleString()}</td>
                        <td>${entry.note || '-'}</td>
                    </tr>
                `;
                sl++;
            }
        });

        tableHtml += `</tbody></table>`;

        const summaryHtml = `
            <div class="print-summary-box" style="margin-left: auto; width: 350px; margin-top: 20px;">
                <div class="print-summary-row">
                    <span>Total Stationery Sales:</span>
                    <strong>৳ ${totalStationery.toLocaleString()}</strong>
                </div>
                <div class="print-summary-row" style="font-weight: bold; background: #e2e8f0;">
                    <span>Total Estimated Profit (25%):</span>
                    <span style="color: green;">৳ ${totalProfit.toLocaleString()}</span>
                </div>
            </div>
        `;

        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    // --- PURCHASE MANAGEMENT ---
    const purchaseForm = document.getElementById('purchase-form');
    const purDateInput = document.getElementById('purchase-date');
    const purItemInput = document.getElementById('purchase-item');
    const purAmountInput = document.getElementById('purchase-amount');
    const purNoteInput = document.getElementById('purchase-note');
    const purTableBody = document.querySelector('#main-purchase-table tbody');
    const txtTotalPurchase = document.getElementById('total-purchase-amount');

    if (purchaseForm) {
        purchaseForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const dateVal = purDateInput.value;
            const itemVal = purItemInput.value.trim();
            const amountVal = parseFloat(purAmountInput.value) || 0;
            const noteVal = purNoteInput.value.trim();

            if (amountVal <= 0) {
                alert("দয়া করে সঠিক ক্রয়ের পরিমাণ ইনপুট দিন।");
                return;
            }

            const newPurchaseRecord = {
                id: Math.floor(4000 + Math.random() * 2000),
                date: dateVal,
                item: itemVal,
                amount: amountVal,
                note: noteVal || 'Inventory Stock Supply'
            };

            purchaseData.unshift(newPurchaseRecord);
            localStorage.setItem('purchaseData', JSON.stringify(purchaseData));

            cashBookData.unshift({
                date: dateVal,
                type: 'Purchase',
                amount: amountVal,
                remarks: `[Purchase] ${itemVal} | Note: ${noteVal}`
            });
            localStorage.setItem('cashBookData', JSON.stringify(cashBookData));

            renderPurchaseTable();
            updateCashBookUI();
            this.reset();

            if (purDateInput) purDateInput.value = "2026-07-19";
            alert("ক্রয়ের হিসাব সফলভাবে সেভ এবং ক্যাশ বুকে ডেবিট হিসেবে যুক্ত করা হয়েছে!");
        });
    }

    document.getElementById('purchase-filter-month')?.addEventListener('change', renderPurchaseTable);
    document.getElementById('purchase-filter-year')?.addEventListener('change', renderPurchaseTable);

    function renderPurchaseTable() {
        if (!purTableBody) return;
        purTableBody.innerHTML = '';

        const selectedMonth = document.getElementById('purchase-filter-month')?.value || 'all';
        const selectedYear = document.getElementById('purchase-filter-year')?.value || 'all';

        let totalPurchaseSum = 0;
        let serial = 1;

        purchaseData.forEach((entry, index) => {
            const dateParts = entry.date.split('-');
            const entryYear = dateParts[0];
            const entryMonth = dateParts[1];

            const matchMonth = (selectedMonth === 'all' || selectedMonth === entryMonth);
            const matchYear = (selectedYear === 'all' || selectedYear === entryYear);

            if (matchMonth && matchYear) {
                totalPurchaseSum += entry.amount;

                const tr = document.createElement('tr');
                tr.style.borderBottom = "1px solid #cbd5e1";
                tr.innerHTML = `
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${serial++}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${formatFinancialDate(entry.date)}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 500;">${entry.item}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0; font-weight: 600; color: #e67e22;">৳ ${entry.amount.toLocaleString()}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${entry.note || '-'}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">
                        <div class="action-cell" style="justify-content: center; display: flex; gap: 10px;">
                            <button type="button" class="btn-print-row btn-print-pur" data-id="${entry.id}" style="border: none; background: transparent; color: #2563eb; cursor: pointer;">
                                <i class="fas fa-print"></i>
                            </button>
                            <button type="button" class="btn-delete-row btn-delete-pur" data-index="${index}" style="border: none; background: transparent; color: #ef4444; cursor: pointer;">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                `;
                purTableBody.appendChild(tr);
            }
        });

        if (txtTotalPurchase) txtTotalPurchase.innerHTML = `৳ ${totalPurchaseSum.toLocaleString()}`;
    }

    purTableBody?.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.btn-delete-pur');
        const printBtn = e.target.closest('.btn-print-pur');

        if (deleteBtn) {
            const index = parseInt(deleteBtn.getAttribute('data-index'));
            if (confirm('আপনি কি এই ক্রয়ের রেকর্ডটি মুছে ফেলতে চান?')) {
                purchaseData.splice(index, 1);
                localStorage.setItem('purchaseData', JSON.stringify(purchaseData));
                renderPurchaseTable();
            }
        }

        if (printBtn) {
            const idToPrint = parseInt(printBtn.getAttribute("data-id"));
            const rec = purchaseData.find(r => r.id === idToPrint);
            if (rec) {
                document.getElementById("print-title-main").innerText = "PURCHASE TRANSACTION VOUCHER";
                document.getElementById("print-subtitle-main").innerText = `Voucher ID: #PUR-${rec.id}`;
                document.getElementById("print-meta-area").innerHTML = `<p><strong>Date:</strong> ${formatFinancialDate(rec.date)}</p><p><strong>Status:</strong> Completed</p>`;

                let tableHtml = `
                    <table class="print-table">
                        <thead>
                            <tr>
                                <th>Item/Supply Details</th>
                                <th>Description</th>
                                <th>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${rec.item}</td>
                                <td>${rec.note || 'N/A'}</td>
                                <td style="font-weight: bold; color: #e67e22;">৳ ${rec.amount.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml;
                window.print();
            }
        }
    });

    document.getElementById("btn-print-purchase-report")?.addEventListener("click", function () {
        const mText = getSelectedText("purchase-filter-month");
        const yText = getSelectedText("purchase-filter-year");

        document.getElementById("print-title-main").innerText = "INVENTORY PURCHASE SHEET REPORT";
        document.getElementById("print-subtitle-main").innerText = `Report Period: ${mText} - ${yText}`;
        document.getElementById("print-meta-area").innerHTML = `<p><strong>Report Type:</strong> Purchase Ledger Summary</p><p><strong>Generated Date:</strong> 19 Jul 2026</p>`;

        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="width: 8%;">SL</th>
                        <th style="width: 15%;">Date</th>
                        <th>Item Details</th>
                        <th style="text-align: right; width: 25%;">Amount (৳)</th>
                        <th>Remarks / Notes</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalPurchase = 0, sl = 1;
        const selectedMonth = document.getElementById("purchase-filter-month")?.value || "all";
        const selectedYear = document.getElementById("purchase-filter-year")?.value || "all";

        purchaseData.forEach(entry => {
            const dateParts = entry.date.split('-');
            const txYear = dateParts[0];
            const txMonth = dateParts[1];

            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                totalPurchase += entry.amount;
                tableHtml += `
                    <tr>
                        <td style="text-align: center;">${sl++}</td>
                        <td style="text-align: center;">${formatFinancialDate(entry.date)}</td>
                        <td style="font-weight: 500;">${entry.item}</td>
                        <td style="text-align: right; color: #e67e22;">৳ ${entry.amount.toLocaleString()}</td>
                        <td>${entry.note || '-'}</td>
                    </tr>
                `;
            }
        });

        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box" style="margin-left: auto; width: 350px; margin-top: 20px;">
                <div class="print-summary-row" style="font-weight: bold; background: #f8fafc;">
                    <span>Total Net Purchases:</span>
                    <span style="color: #e67e22;">৳ ${totalPurchase.toLocaleString()}</span>
                </div>
            </div>
        `;

        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    // --- MOBILE BANKING LOGIC ---
    const fmtBDT = (num) => "৳ " + Number(num || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

    function updateMobileBankingUI() {
        const tbody = document.querySelector("#main-mb-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        const selectedMonth = document.getElementById("mb-filter-month")?.value || "all";
        const selectedYear = document.getElementById("mb-filter-year")?.value || "all";

        let totalProfit = 0, sl = 1;

        mbTransactions.forEach((tx) => {
            const txYear = tx.date.substring(0, 4);
            const txMonth = tx.date.substring(5, 7);

            const isMatch = (selectedMonth === "all" || txMonth === selectedMonth) &&
                (selectedYear === "all" || txYear === selectedYear);

            if (isMatch) {
                totalProfit += tx.commission;

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${sl}</td>
                    <td>${formatFinancialDate(tx.date)}</td>
                    <td><strong>${tx.details}</strong></td>
                    <td class="text-purple font-semibold">৳ ${tx.commission.toLocaleString()}</td>
                    <td>
                        <button class="btn-delete-row btn-delete-mb" data-id="${tx.id}"><i class="fas fa-trash-can"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
                sl++;
            }
        });

        if (document.getElementById("mb-total-commission")) {
            document.getElementById("mb-total-commission").innerText = fmtBDT(totalProfit);
        }

        updateProfitCardsOnly(undefined, totalProfit);
    }

    document.getElementById("mb-form")?.addEventListener("submit", function (e) {
        e.preventDefault();
        const date = document.getElementById("mb-date").value;
        const details = document.getElementById("mb-details").value;
        const commission = parseFloat(document.getElementById("mb-commission").value) || 0;

        const newTx = { id: Math.floor(9000 + Math.random() * 1000), date, details, commission };
        mbTransactions.unshift(newTx);
        localStorage.setItem('mbTransactions', JSON.stringify(mbTransactions));

        updateMobileBankingUI();
        this.reset();
        document.getElementById("mb-date").value = "2026-07-19";
    });

    document.getElementById("main-mb-table")?.addEventListener("click", function (e) {
        const deleteBtn = e.target.closest(".btn-delete-mb");
        if (deleteBtn) {
            const id = parseInt(deleteBtn.getAttribute("data-id"));
            if (confirm("আপনি কি নিশ্চিতভাবে এই মোবাইল ব্যাংকিং ট্রানজেকশনটি মুছে ফেলতে চান?")) {
                mbTransactions = mbTransactions.filter(t => t.id !== id);
                localStorage.setItem('mbTransactions', JSON.stringify(mbTransactions));
                updateMobileBankingUI();
            }
        }
    });

    document.getElementById("mb-filter-month")?.addEventListener("change", updateMobileBankingUI);
    document.getElementById("mb-filter-year")?.addEventListener("change", updateMobileBankingUI);

    document.getElementById("btn-print-mb-report")?.addEventListener("click", function () {
        const mText = getSelectedText("mb-filter-month");
        const yText = getSelectedText("mb-filter-year");

        if (!confirm(`আপনি কি (${mText} - ${yText}) এর মোবাইল ব্যাংকিং স্টেটমেন্ট প্রফিট শীট প্রিন্ট করতে চান?`)) return;

        document.getElementById("print-title-main").innerText = "MOBILE BANKING PROFIT STATEMENT";
        document.getElementById("print-subtitle-main").innerText = `Statement Period: ${mText} - ${yText}`;
        document.getElementById("print-meta-area").innerHTML = `<p><strong>Report:</strong> Mobile Banking Sheet</p><p><strong>Profit Margin:</strong> 100% Net Profit</p>`;

        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th>SL</th><th>Date</th><th>Mobile banking Particulars</th><th>Profit / Commission</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalProfit = 0, sl = 1;
        const selectedMonth = document.getElementById("mb-filter-month")?.value || "all";
        const selectedYear = document.getElementById("mb-filter-year")?.value || "all";

        mbTransactions.forEach(tx => {
            const txYear = tx.date.substring(0, 4);
            const txMonth = tx.date.substring(5, 7);

            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                totalProfit += tx.commission;
                tableHtml += `
                    <tr>
                        <td>${sl}</td>
                        <td>${formatFinancialDate(tx.date)}</td>
                        <td>${tx.details}</td>
                        <td>৳ ${tx.commission}</td>
                    </tr>
                `;
                sl++;
            }
        });

        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box">
                <div class="print-summary-row" style="background:#ede9fe; font-weight:bold;">
                    <span>100% Total Net Profit:</span><span>${fmtBDT(totalProfit)}</span>
                </div>
            </div>
        `;
        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    // --- PHOTOCOPY MACHINE CALCULATION (A4 + LG SIZE BREAKDOWN) ---
    const PM_RATE_A4 = 2; // ৳ per copy for A4 size
    const PM_RATE_LG = 3; // ৳ per copy for LG size

    function setPmText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    function calculatePhotocopyMachine() {
        const dateVal = document.getElementById("pm-date")?.value || "2026-07-19";

        // ---- A4 SIZE ----
        const a4TotalCount = parseFloat(document.getElementById("pm-a4-total-count")?.value) || 0;
        const a4AvgePcs = parseFloat(document.getElementById("pm-a4-avge-pcs")?.value) || 0;
        const a4RimPerPcs = parseFloat(document.getElementById("rate-a4-rim-pcs")?.value) || 480;
        const a4RimPerTk = parseFloat(document.getElementById("rate-a4-rim-tk")?.value) || 350;

        const a4TotalCopy = a4TotalCount - a4AvgePcs;
        const a4TotalAmount = a4TotalCopy > 0 ? a4TotalCopy * PM_RATE_A4 : 0;
        const a4TotalRim = a4TotalCopy > 0 ? a4TotalCopy / a4RimPerPcs : 0;
        const a4TotalRimTk = Math.round(a4TotalRim * a4RimPerTk);
        const a4NetAmount = a4TotalAmount - a4TotalRimTk;

        setPmText("pm-a4-total-copy", a4TotalCopy > 0 ? a4TotalCopy.toLocaleString() : "0");
        setPmText("pm-a4-total-amount", "৳ " + Math.round(a4TotalAmount).toLocaleString());
        setPmText("pm-a4-total-rim", a4TotalRim > 0 ? Math.round(a4TotalRim).toLocaleString() : "0");
        setPmText("pm-a4-total-rim-tk", "৳ " + a4TotalRimTk.toLocaleString());
        setPmText("pm-a4-net-amount", "৳ " + (a4NetAmount > 0 ? Math.round(a4NetAmount).toLocaleString() : "0"));

        // ---- LG SIZE ----
        const lgTotalCount = parseFloat(document.getElementById("pm-lg-total-count")?.value) || 0;
        const lgAvgePcs = parseFloat(document.getElementById("pm-lg-avge-pcs")?.value) || 0;
        const lgRimPerPcs = parseFloat(document.getElementById("rate-lg-rim-pcs")?.value) || 500;
        const lgRimPerTk = parseFloat(document.getElementById("rate-lg-rim-tk")?.value) || 450;

        const lgTotalCopy = lgTotalCount - lgAvgePcs;
        const lgTotalAmount = lgTotalCopy > 0 ? lgTotalCopy * PM_RATE_LG : 0;
        const lgTotalRim = lgTotalCopy > 0 ? lgTotalCopy / lgRimPerPcs : 0;
        const lgTotalRimTk = Math.round(lgTotalRim * lgRimPerTk);
        const lgNetAmount = lgTotalAmount - lgTotalRimTk;

        setPmText("pm-lg-total-copy", lgTotalCopy > 0 ? lgTotalCopy.toLocaleString() : "0");
        setPmText("pm-lg-total-amount", "৳ " + Math.round(lgTotalAmount).toLocaleString());
        setPmText("pm-lg-total-rim", lgTotalRim > 0 ? Math.round(lgTotalRim).toLocaleString() : "0");
        setPmText("pm-lg-total-rim-tk", "৳ " + lgTotalRimTk.toLocaleString());
        setPmText("pm-lg-net-amount", "৳ " + (lgNetAmount > 0 ? Math.round(lgNetAmount).toLocaleString() : "0"));

        // ---- SERVICE EXPENSE (auto-summed, unchanged behavior) ----
        let totalExpenseSum = 0;
        document.querySelectorAll(".pm-expense-amt").forEach(input => {
            totalExpenseSum += parseFloat(input.value) || 0;
        });
        const serviceCost = totalExpenseSum;
        setPmText("pm-service-cost", serviceCost > 0 ? "৳ " + serviceCost.toLocaleString() : "0");

        // ---- COMBINED GROSS / NET PROFIT ----
        const grossProfit = a4NetAmount + lgNetAmount;
        const netProfit = grossProfit - serviceCost;
        setPmText("pm-gross-profit", "৳ " + Math.round(grossProfit).toLocaleString());
        setPmText("pm-net-profit", "৳ " + Math.round(netProfit).toLocaleString());

        // ---- COMBINED DATA (used by Photocopy Service save/history) ----
        pmCombinedData = {
            date: dateVal,
            totalCount: a4TotalCount + lgTotalCount,
            avgePcs: a4AvgePcs + lgAvgePcs,
            totalCopy: a4TotalCopy + lgTotalCopy,
            grossAmt: Math.round(a4TotalAmount + lgTotalAmount),
            rimQty: a4TotalRim + lgTotalRim,
            rimCost: a4TotalRimTk + lgTotalRimTk,
            netAmt: Math.round(grossProfit),
            serviceCost: serviceCost,
            finalProfit: Math.round(netProfit)
        };

        if (document.getElementById("ps-entry-date")) document.getElementById("ps-entry-date").value = dateVal;
        if (document.getElementById("ps-entry-count")) document.getElementById("ps-entry-count").value = pmCombinedData.totalCount;
        if (document.getElementById("ps-entry-avg")) document.getElementById("ps-entry-avg").value = pmCombinedData.avgePcs;
        if (document.getElementById("ps-entry-service")) document.getElementById("ps-entry-service").value = serviceCost;
    }

    document.getElementById("pm-date")?.addEventListener("change", calculatePhotocopyMachine);
    document.getElementById("pm-a4-total-count")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("pm-a4-avge-pcs")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("rate-a4-rim-pcs")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("rate-a4-rim-tk")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("pm-lg-total-count")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("pm-lg-avge-pcs")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("rate-lg-rim-pcs")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("rate-lg-rim-tk")?.addEventListener("input", calculatePhotocopyMachine);

    document.getElementById("btn-add-pm-expense")?.addEventListener("click", function () {
        const tbody = document.getElementById("pm-expense-tbody");
        if (!tbody) return;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="border: 1px solid #cbd5e1; padding: 0;"><input type="text" class="pm-expense-title" placeholder="Expense Title" style="width: 100%; padding: 8px 12px; border: none; outline: none;"></td>
            <td style="border: 1px solid #cbd5e1; padding: 0;">
                <div style="display: flex; align-items: center;">
                    <input type="number" class="pm-expense-amt" placeholder="Amount" style="width: 100%; padding: 8px 12px; border: none; outline: none; text-align: right;">
                    <button type="button" class="btn-remove-pm-exp" style="border: none; background: #fff1f2; color: #e11d48; padding: 8px 10px; cursor: pointer;"><i class="fas fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        tr.querySelector(".pm-expense-amt").addEventListener("input", calculatePhotocopyMachine);
    });

    document.getElementById("pm-expense-tbody")?.addEventListener("click", function (e) {
        const removeBtn = e.target.closest(".btn-remove-pm-exp");
        if (removeBtn) {
            removeBtn.closest("tr").remove();
            calculatePhotocopyMachine();
        }
    });

    document.querySelectorAll(".pm-expense-amt").forEach(input => {
        input.addEventListener("input", calculatePhotocopyMachine);
    });

    // --- ONLINE COST ENGINE ---
    function saveOnlineCostToStorage() {
        const rows = document.querySelectorAll("#oc-master-tbody tr");
        const data = [];
        rows.forEach(row => {
            data.push({
                date: row.querySelector(".oc-row-date")?.value || '2026-07-19',
                particulars: row.querySelector(".oc-row-particulars")?.value || '',
                onlineWork: row.querySelector(".oc-row-online-work")?.value || '',
                printSale: row.querySelector(".oc-row-print-sale")?.value || '',
                printCost: row.querySelector(".oc-row-print-cost")?.value || ''
            });
        });
        localStorage.setItem('onlineCostData', JSON.stringify(data));
    }

    function addOnlineMasterRow(date = '2026-07-19', particulars = '', onlineWork = '', printSale = '', printCost = '') {
        const tbody = document.getElementById("oc-master-tbody");
        if (!tbody) return;

        const rowId = "oc_row_" + Math.floor(Math.random() * 100000);
        const tr = document.createElement("tr");
        tr.id = rowId;

        tr.innerHTML = `
            <td><input type="date" class="oc-row-date" value="${date}" onchange="calculateOnlineCostAll()"></td>
            <td><input type="text" class="oc-row-particulars" placeholder="Details description..." value="${particulars}"></td>
            <td><input type="number" class="oc-row-online-work" placeholder="0" value="${onlineWork}" style="text-align: right; background: #f0fdf4;" oninput="calculateOnlineCostAll()"></td>
            <td><input type="number" class="oc-row-print-sale" placeholder="0" value="${printSale}" style="text-align: right; background: #eff6ff;" oninput="calculateOnlineCostAll()"></td>
            <td><input type="number" class="oc-row-print-cost" placeholder="0" value="${printCost}" style="text-align: right; background: #fff1f2;" oninput="calculateOnlineCostAll()"></td>
            <td class="oc-row-net-margin" style="text-align: right; font-weight: 700;">৳ 0</td>
            <td>
                <div class="oc-action-group">
                    <div class="oc-print-dropdown">
                        <button type="button" class="oc-btn-row-print"><i class="fas fa-print"></i> Print <i class="fas fa-caret-down"></i></button>
                        <div class="oc-dropdown-content">
                            <button type="button" class="btn-oc-row-print-monthly" data-id="${rowId}"><i class="fa-regular fa-calendar-minus"></i> Monthly</button>
                            <button type="button" class="btn-oc-row-print-yearly" data-id="${rowId}"><i class="fa-solid fa-calendar-days"></i> Yearly</button>
                        </div>
                    </div>
                    <button type="button" class="oc-btn-trash btn-delete-oc-row" data-id="${rowId}"><i class="fas fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        calculateOnlineCostAll();
    }

    window.calculateOnlineCostAll = function () {
        let grossOnlineRaw = 0, grossPrintRaw = 0, grossCostRaw = 0;
        const selectedMonth = document.getElementById("oc-filter-month")?.value || "all";
        const selectedYear = document.getElementById("oc-filter-year")?.value || "all";

        document.querySelectorAll("#oc-master-tbody tr").forEach(row => {
            const rowDate = row.querySelector(".oc-row-date")?.value || "";
            const txYear = rowDate.substring(0, 4);
            const txMonth = rowDate.substring(5, 7);

            const isMatch = (selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear);

            if (!isMatch) { row.style.display = "none"; return; } else { row.style.display = ""; }

            const onlineWorkVal = parseFloat(row.querySelector(".oc-row-online-work")?.value) || 0;
            const printSaleVal = parseFloat(row.querySelector(".oc-row-print-sale")?.value) || 0;
            const printCostVal = parseFloat(row.querySelector(".oc-row-print-cost")?.value) || 0;

            grossOnlineRaw += onlineWorkVal; grossPrintRaw += printSaleVal; grossCostRaw += printCostVal;
            const rowMargin = (onlineWorkVal / 2) + (printSaleVal * 0.70) - printCostVal;
            const netMarginEl = row.querySelector(".oc-row-net-margin");
            if (netMarginEl) netMarginEl.innerText = fmtBDT(rowMargin);
        });

        const shareOnlineNet = grossOnlineRaw / 2;
        const sharePrintNet = grossPrintRaw * 0.70;
        const finalCalculatedProfit = shareOnlineNet + sharePrintNet - grossCostRaw;

        if (document.getElementById("oc-tot-online-raw")) document.getElementById("oc-tot-online-raw").innerText = fmtBDT(grossOnlineRaw);
        if (document.getElementById("oc-tot-print-raw")) document.getElementById("oc-tot-print-raw").innerText = fmtBDT(grossPrintRaw);
        if (document.getElementById("oc-tot-cost-raw")) document.getElementById("oc-tot-cost-raw").innerText = fmtBDT(grossCostRaw);
        if (document.getElementById("oc-tot-margin-net")) document.getElementById("oc-tot-margin-net").innerText = fmtBDT(finalCalculatedProfit);

        if (document.getElementById("oc-formula-online")) document.getElementById("oc-formula-online").innerText = fmtBDT(shareOnlineNet);
        if (document.getElementById("oc-formula-print")) document.getElementById("oc-formula-print").innerText = fmtBDT(sharePrintNet);
        if (document.getElementById("oc-formula-cost")) document.getElementById("oc-formula-cost").innerText = "- ৳ " + grossCostRaw.toLocaleString();
        if (document.getElementById("oc-formula-final")) document.getElementById("oc-formula-final").innerText = fmtBDT(finalCalculatedProfit);

        if (document.getElementById("oc-kpi-online-net")) document.getElementById("oc-kpi-online-net").innerText = fmtBDT(shareOnlineNet);
        if (document.getElementById("oc-kpi-print-net")) document.getElementById("oc-kpi-print-net").innerText = fmtBDT(sharePrintNet);
        if (document.getElementById("oc-kpi-prod-cost")) document.getElementById("oc-kpi-prod-cost").innerText = fmtBDT(grossCostRaw);
        if (document.getElementById("oc-kpi-final-profit")) document.getElementById("oc-kpi-final-profit").innerText = fmtBDT(finalCalculatedProfit);

        if (document.getElementById("dash-online-net")) document.getElementById("dash-online-net").innerText = fmtBDT(shareOnlineNet);
        if (document.getElementById("dash-print-net")) document.getElementById("dash-print-net").innerText = fmtBDT(sharePrintNet);
        if (document.getElementById("dash-total-costing")) document.getElementById("dash-total-costing").innerText = fmtBDT(grossCostRaw);
        if (document.getElementById("dash-final-net")) document.getElementById("dash-final-net").innerText = fmtBDT(finalCalculatedProfit);

        dashboardTotals.finalNetIncome = finalCalculatedProfit;
        updateOverallTotalProfit();

        saveOnlineCostToStorage();
    };

    document.getElementById("oc-filter-month")?.addEventListener("change", calculateOnlineCostAll);
    document.getElementById("oc-filter-year")?.addEventListener("change", calculateOnlineCostAll);
    document.getElementById("oc-master-tbody")?.addEventListener("input", saveOnlineCostToStorage);
    document.getElementById("oc-master-tbody")?.addEventListener("change", saveOnlineCostToStorage);

    document.getElementById("oc-master-tbody")?.addEventListener("click", function (e) {
        const deleteBtn = e.target.closest(".btn-delete-oc-row");
        const printMonthlyBtn = e.target.closest(".btn-oc-row-print-monthly");
        const printYearlyBtn = e.target.closest(".btn-oc-row-print-yearly");

        if (deleteBtn) {
            const rowId = deleteBtn.getAttribute("data-id");
            if (confirm("আপনি কি নিশ্চিতভাবে এই রো লাইনটি মুছে ফেলতে চান?")) {
                document.getElementById(rowId)?.remove();
                calculateOnlineCostAll();
                saveOnlineCostToStorage();
            }
        }

        if (printMonthlyBtn || printYearlyBtn) {
            const rowId = (printMonthlyBtn || printYearlyBtn).getAttribute("data-id");
            const row = document.getElementById(rowId);
            if (!row) return;

            const date = row.querySelector(".oc-row-date")?.value || "";
            const particulars = row.querySelector(".oc-row-particulars")?.value || "N/A";
            const onlineWork = parseFloat(row.querySelector(".oc-row-online-work")?.value) || 0;
            const printSale = parseFloat(row.querySelector(".oc-row-print-sale")?.value) || 0;
            const printCost = parseFloat(row.querySelector(".oc-row-print-cost")?.value) || 0;
            const netMargin = (onlineWork / 2) + (printSale * 0.70) - printCost;
            const reportType = printMonthlyBtn ? "MONTHLY STATEMENT VOUCHER" : "YEARLY STATEMENT VOUCHER";

            document.getElementById("print-title-main").innerText = "ONLINE COST TRANSACTION";
            document.getElementById("print-subtitle-main").innerText = reportType;
            document.getElementById("print-meta-area").innerHTML = `<p><strong>Date:</strong> ${formatFinancialDate(date)}</p><p><strong>Description:</strong> ${particulars}</p>`;

            let tableHtml = `
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Particulars / Source</th>
                            <th>Online Work (50%)</th>
                            <th>Print Sales (70%)</th>
                            <th>Print Cost (-)</th>
                            <th>Net Margin</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${particulars}</td>
                            <td>৳ ${(onlineWork / 2).toLocaleString()}</td>
                            <td>৳ ${(printSale * 0.70).toLocaleString()}</td>
                            <td>৳ ${printCost.toLocaleString()}</td>
                            <td style="font-weight: bold; color: green;">৳ ${netMargin.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            `;
            document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml;
            window.print();
        }
    });

    document.getElementById("btn-print-oc-monthly")?.addEventListener("click", function () {
        const mText = getSelectedText("oc-filter-month");
        const yText = getSelectedText("oc-filter-year");

        document.getElementById("print-title-main").innerText = "ONLINE & PRODUCTION WORK STATEMENT";
        document.getElementById("print-subtitle-main").innerText = `Statement Period: ${mText} - ${yText}`;
        document.getElementById("print-meta-area").innerHTML = `<p><strong>Report:</strong> Online Cost Ledger Summary</p><p><strong>Status:</strong> Active</p>`;

        let tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Online Net (৳)</th>
                        <th>Print Net (৳)</th>
                        <th>Print Cost (৳)</th>
                        <th>Row Margin (৳)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalOnline = 0, totalPrint = 0, totalCost = 0, totalMargin = 0;
        const selectedMonth = document.getElementById("oc-filter-month")?.value || "all";
        const selectedYear = document.getElementById("oc-filter-year")?.value || "all";

        document.querySelectorAll("#oc-master-tbody tr").forEach(row => {
            const rowDate = row.querySelector(".oc-row-date")?.value || "";
            const txYear = rowDate.substring(0, 4);
            const txMonth = rowDate.substring(5, 7);

            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                const particulars = row.querySelector(".oc-row-particulars")?.value || "N/A";
                const onlineWorkVal = parseFloat(row.querySelector(".oc-row-online-work")?.value) || 0;
                const printSaleVal = parseFloat(row.querySelector(".oc-row-print-sale")?.value) || 0;
                const printCostVal = parseFloat(row.querySelector(".oc-row-print-cost")?.value) || 0;

                const oNet = onlineWorkVal / 2;
                const pNet = printSaleVal * 0.70;
                const rMargin = oNet + pNet - printCostVal;

                totalOnline += oNet; totalPrint += pNet; totalCost += printCostVal; totalMargin += rMargin;

                tableHtml += `
                    <tr>
                        <td>${formatFinancialDate(rowDate)}</td>
                        <td>${particulars}</td>
                        <td>৳ ${oNet.toLocaleString()}</td>
                        <td>৳ ${pNet.toLocaleString()}</td>
                        <td>৳ ${printCostVal.toLocaleString()}</td>
                        <td style="font-weight:600;">৳ ${rMargin.toLocaleString()}</td>
                    </tr>
                `;
            }
        });

        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box">
                <div class="print-summary-row"><span>Total Online Net (50%):</span><span>৳ ${totalOnline.toLocaleString()}</span></div>
                <div class="print-summary-row"><span>Total Print Net (70%):</span><span>৳ ${totalPrint.toLocaleString()}</span></div>
                <div class="print-summary-row"><span>Total Production Cost (-):</span><span>৳ ${totalCost.toLocaleString()}</span></div>
                <div class="print-summary-row" style="font-weight: bold; background: #e2e8f0;"><span>Final Net Income:</span><span>৳ ${totalMargin.toLocaleString()}</span></div>
            </div>
        `;

        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    document.getElementById("btn-add-oc-row")?.addEventListener("click", () => {
        const selMonth = document.getElementById("oc-filter-month")?.value || "all";
        const selYear = document.getElementById("oc-filter-year")?.value || "all";

        const today = new Date();
        const todayYear = String(today.getFullYear());
        const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
        const todayDay = String(today.getDate()).padStart(2, '0');

        const targetYear = (selYear !== "all") ? selYear : todayYear;
        const targetMonth = (selMonth !== "all") ? selMonth : todayMonth;
        const targetDay = (targetYear === todayYear && targetMonth === todayMonth) ? todayDay : "01";

        const newRowDate = `${targetYear}-${targetMonth}-${targetDay}`;

        addOnlineMasterRow(newRowDate);
        saveOnlineCostToStorage();
    });

    // if (Array.isArray(onlineCostData) && onlineCostData.length > 0) {
    //     onlineCostData.forEach(item => {
    //         addOnlineMasterRow(item.date, item.particulars, item.onlineWork, item.printSale, item.printCost);
    //     });
    // } else {
    //     addOnlineMasterRow('2026-07-02', 'Logo Design & Vector Work', 4000, 0, 0);
    //     addOnlineMasterRow('2026-07-06', 'T-Shirt Sublimation Printing', 0, 8500, 3200);
    //     saveOnlineCostToStorage();
    // }



    if (Array.isArray(onlineCostData) && onlineCostData.length > 0) {
        onlineCostData.forEach(item => {
            addOnlineMasterRow(item.date, item.particulars, item.onlineWork, item.printSale, item.printCost);
        });
    } else {
        // কোনো Sample Data থাকবে না
    }

    // --- MINI SUMMARY ENGINE ---
    const msForm = document.getElementById('ms-form');
    const msDateInput = document.getElementById('ms-date');
    const msPurposeInput = document.getElementById('ms-purpose');
    const msAmountInput = document.getElementById('ms-amount');
    const msTableBody = document.querySelector('#main-ms-table tbody');
    const msTotalAmountEl = document.getElementById('ms-total-amount');
    const msFilterMonth = document.getElementById('ms-filter-month');
    const msFilterYear = document.getElementById('ms-filter-year');
    const btnPrintMsReport = document.getElementById('btn-print-ms-report');
    const btnClearMsData = document.getElementById('btn-clear-ms-data');

    if (msForm) {
        msForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const newEntry = {
                id: Date.now(),
                date: msDateInput.value,
                purpose: msPurposeInput.value.trim(),
                amount: parseFloat(msAmountInput.value) || 0
            };
            miniSummaryData.push(newEntry);
            localStorage.setItem('miniSummaryData', JSON.stringify(miniSummaryData));

            renderMiniSummaryTable();
            updateCashBookUI();

            msPurposeInput.value = '';
            msAmountInput.value = '';
        });
    }

    if (msFilterMonth) msFilterMonth.addEventListener('change', function () {
        renderMiniSummaryTable();
        updateCashBookUI();
    });
    if (msFilterYear) msFilterYear.addEventListener('change', function () {
        renderMiniSummaryTable();
        updateCashBookUI();
    });

    function renderMiniSummaryTable() {
        if (!msTableBody) return;
        msTableBody.innerHTML = '';

        const selectedMonth = msFilterMonth?.value || 'all';
        const selectedYear = msFilterYear?.value || 'all';
        let totalExpense = 0, serial = 1;

        miniSummaryData.forEach(entry => {
            const dateParts = entry.date.split('-');
            const entryYear = dateParts[0];
            const entryMonth = dateParts[1];

            const matchMonth = (selectedMonth === 'all' || selectedMonth === entryMonth);
            const matchYear = (selectedYear === 'all' || selectedYear === entryYear);

            if (matchMonth && matchYear) {
                totalExpense += entry.amount;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${serial++}</td>
                    <td>${formatFinancialDate(entry.date)}</td>
                    <td>${entry.purpose}</td>
                    <td style="font-weight: 600;">৳ ${entry.amount.toLocaleString()}</td>
                    <td>
                        <button type="button" class="btn-delete-ms" data-id="${entry.id}">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </td>
                `;
                msTableBody.appendChild(tr);
            }
        });

        if (msTotalAmountEl) msTotalAmountEl.textContent = `৳ ${totalExpense.toLocaleString()}`;
    }

    msTableBody?.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.btn-delete-ms');
        if (deleteBtn) {
            const idToDelete = parseInt(deleteBtn.getAttribute('data-id'));
            if (confirm('আপনি কি নিশ্চিত যে এই এন্ট্রিটি ডিলিট করতে চান?')) {
                miniSummaryData = miniSummaryData.filter(entry => entry.id !== idToDelete);
                localStorage.setItem('miniSummaryData', JSON.stringify(miniSummaryData));

                renderMiniSummaryTable();
                updateCashBookUI();
            }
        }
    });

    if (btnClearMsData) {
        btnClearMsData.addEventListener('click', function () {
            if (confirm('আপনি কি নিশ্চিতভাবে সমস্ত মিনি সামারি ডাটা মুছে ফেলতে চান? এটি ড্যাশবোর্ডের খরচও আপডেট করে দেবে।')) {
                miniSummaryData = [];
                localStorage.removeItem('miniSummaryData');

                renderMiniSummaryTable();
                updateCashBookUI();
                alert('সমস্ত মিনি সামারি রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!');
            }
        });
    }

    if (btnPrintMsReport) {
        btnPrintMsReport.addEventListener('click', function () {
            const printTitle = document.getElementById('print-title-main');
            const printMeta = document.getElementById('print-meta-area');
            const printTableWrapper = document.getElementById('print-dynamic-table-wrapper');

            if (!printTableWrapper) return;

            if (printTitle) printTitle.textContent = "MINI SUMMARY EXPENSE REPORT";
            if (printMeta) {
                printMeta.innerHTML = `
                    <p><strong>Month:</strong> ${getSelectedText('ms-filter-month')}</p>
                    <p><strong>Year:</strong> ${getSelectedText('ms-filter-year')}</p>
                    <p><strong>Print Date:</strong> 19 Jul 2026</p>
                `;
            }

            const tableClone = document.getElementById('main-ms-table')?.cloneNode(true);
            if (tableClone) {
                tableClone.querySelectorAll('th:last-child, td:last-child').forEach(el => el.remove());

                let totalAmount = 0;
                miniSummaryData.forEach(entry => totalAmount += entry.amount);

                const tfoot = document.createElement('tfoot');
                tfoot.innerHTML = `
                    <tr style="font-weight: bold; background: #f1f5f9;">
                        <td colspan="3" style="text-align: right; padding: 10px;">Total Expense:</td>
                        <td style="padding: 10px;">৳ ${totalAmount.toLocaleString()}</td>
                    </tr>
                `;
                tableClone.appendChild(tfoot);

                printTableWrapper.innerHTML = '';
                printTableWrapper.appendChild(tableClone);
                window.print();
            }
        });
    }

    // ================= DAILY REPORT ENGINE =================
    const drSelectDate = document.getElementById('dr-select-date');
    const drBreakdownBody = document.getElementById('dr-breakdown-tbody');
    const drCardRevenue = document.getElementById('dr-card-revenue');
    const drCardExpenses = document.getElementById('dr-card-expenses');
    const drCardProfit = document.getElementById('dr-card-profit');
    const btnPrintDr = document.getElementById('btn-print-dr');

    const fmtTk = (num) => "৳ " + Math.round(num || 0).toLocaleString('en-IN');

    // Online Cost lives only in the DOM table rows (not the JS array), so read it live
    function getOnlineCostTotalsForDate(dateStr) {
        const rows = document.querySelectorAll('#oc-master-tbody tr');
        let revenue = 0, cost = 0, profit = 0;
        rows.forEach(row => {
            const rowDate = row.querySelector('.oc-row-date')?.value;
            if (rowDate !== dateStr) return;
            const onlineWork = parseFloat(row.querySelector('.oc-row-online-work')?.value) || 0;
            const printSale = parseFloat(row.querySelector('.oc-row-print-sale')?.value) || 0;
            const printCost = parseFloat(row.querySelector('.oc-row-print-cost')?.value) || 0;
            revenue += onlineWork + printSale;
            cost += printCost;
            profit += (onlineWork / 2) + (printSale * 0.70) - printCost;
        });
        return { revenue, cost, profit };
    }

    function buildDailyReportSections(dateStr) {
        const sections = [];

        // 1. Cash Book — manual entries only (Expense / Daily Sale / Purchase are counted in their own sections)
        let cbRevenue = 0, cbCost = 0, cbProfit = 0;
        cashBookData.forEach(entry => {
            if (entry.date !== dateStr) return;
            const tag = entry.remarks || '';
            if (tag.includes('[Expense]') || tag.includes('[Daily Sale]') || tag.includes('[Purchase]')) return;
            if (entry.type === 'Sales' || entry.type === 'credit') {
                cbRevenue += entry.amount;
                cbProfit += entry.amount * 0.25;
            } else if (entry.type === 'Purchase' || entry.type === 'debit') {
                cbCost += entry.amount;
                cbProfit -= entry.amount;
            }
        });
        sections.push({ name: 'Cash Book (Manual Entries)', icon: 'fa-book', revenue: cbRevenue, cost: cbCost, profit: cbProfit });

        // 2. Daily Sale
        // let dsRevenue = 0, dsCost = 0, dsProfit = 0;
        // dailySalesData.forEach(entry => {
        //     if (entry.date !== dateStr) return;
        //     const stationery = entry.stationery || 0;
        //     const profitVal = entry.profit || 0;
        //     dsRevenue += stationery;
        //     dsProfit += profitVal;
        //     dsCost += (stationery - profitVal);
        // });
        // sections.push({ name: 'Daily Sale', icon: 'fa-cart-shopping', revenue: dsRevenue, cost: dsCost, profit: dsProfit });

    // 2. Daily Sale
let dsRevenue = 0;
let dsCost = 0;
let dsProfit = 0;

dailySalesData.forEach(entry => {
    if (entry.date !== dateStr) return;

    dsRevenue += entry.stationery || 0;
    dsProfit += entry.profit || 0;

    // Purchase Management-এ Cost দেখানো হবে,
    // তাই Daily Sale-এ Cost আর দেখানো হবে না।
    dsCost = 0;
});

sections.push({
    name: 'Daily Sale',
    icon: 'fa-cart-shopping',
    revenue: dsRevenue,
    cost: dsCost,
    profit: dsProfit
});



        // 3. Expense Management
        let expCost = 0;
        expenseData.forEach(entry => {
            if (entry.date === dateStr) expCost += entry.amount || 0;
        });
        sections.push({ name: 'Expense Management', icon: 'fa-wallet', revenue: 0, cost: expCost, profit: -expCost });




        // 4. Purchase Management
        // let purCost = 0;
        // purchaseData.forEach(entry => {
        //     if (entry.date === dateStr) purCost += entry.amount || 0;
        // });
        // sections.push({ name: 'Purchase Management', icon: 'fa-bag-shopping', revenue: 0, cost: purCost, profit: -purCost });

        // 4. Purchase Management
        let purCost = 0;
        purchaseData.forEach(entry => {
            if (entry.date === dateStr) {
                purCost += entry.amount || 0;
            }
        });

        // Stock Purchase শুধু দেখাবে, Profit Calculation-এ যোগ হবে না
        sections.push({
            name: 'Purchase Management',
            icon: 'fa-bag-shopping',
            revenue: 0,
            cost: purCost,
            profit: 0
        });







        // 5. Online Cost & Production
        const oc = getOnlineCostTotalsForDate(dateStr);
        sections.push({ name: 'Online Cost & Production', icon: 'fa-globe', revenue: oc.revenue, cost: oc.cost, profit: oc.profit });

        // 6. Photocopy Service
        let psRevenue = 0, psCost = 0, psProfit = 0;
        photocopyServiceRecords.forEach(entry => {
            if (entry.date !== dateStr) return;
            const gross = entry.grossAmt || 0;
            const profitVal = entry.finalProfit || 0;
            psRevenue += gross;
            psProfit += profitVal;
            psCost += (gross - profitVal);
        });
        sections.push({ name: 'Photocopy Service', icon: 'fa-copy', revenue: psRevenue, cost: psCost, profit: psProfit });

        // 7. Mobile Banking (commission income only)
        let mbRevenue = 0;
        mbTransactions.forEach(entry => {
            if (entry.date === dateStr) mbRevenue += entry.commission || 0;
        });
        sections.push({ name: 'Mobile Banking', icon: 'fa-mobile-screen-button', revenue: mbRevenue, cost: 0, profit: mbRevenue });

        // 8. Mini Summary (petty expense tracker)
        let msCost = 0;
        miniSummaryData.forEach(entry => {
            if (entry.date === dateStr) msCost += entry.amount || 0;
        });
        sections.push({ name: 'Mini Summary (Petty Expense)', icon: 'fa-file-lines', revenue: 0, cost: msCost, profit: -msCost });

        return sections;
    }

    function renderDailyReport() {
        if (!drBreakdownBody) return;
        const dateStr = drSelectDate?.value || '2026-07-19';
        const sections = buildDailyReportSections(dateStr);

        drBreakdownBody.innerHTML = '';
        let grandRevenue = 0, grandCost = 0, grandProfit = 0;

        sections.forEach(sec => {
            grandRevenue += sec.revenue;
            grandCost += sec.cost;
            grandProfit += sec.profit;

            const profitColor = sec.profit >= 0 ? '#16a34a' : '#dc2626';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 12px; font-weight: 500;"><i class="fas ${sec.icon}" style="width:18px; color:#64748b; margin-right:8px;"></i>${sec.name}</td>
                <td style="padding: 12px; text-align: right; color:#16a34a;">${sec.revenue > 0 ? fmtTk(sec.revenue) : '-'}</td>
                <td style="padding: 12px; text-align: right; color:#dc2626;">${sec.cost > 0 ? fmtTk(sec.cost) : '-'}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color:${profitColor};">${fmtTk(sec.profit)}</td>
            `;
            drBreakdownBody.appendChild(tr);
        });

        const grandTr = document.createElement('tr');
        grandTr.style.background = '#f1f5f9';
        grandTr.style.borderTop = '2px solid #cbd5e1';
        grandTr.innerHTML = `
            <td style="padding: 12px; font-weight: 700;">Grand Total</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:#16a34a;">${fmtTk(grandRevenue)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:#dc2626;">${fmtTk(grandCost)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:${grandProfit >= 0 ? '#2563eb' : '#dc2626'};">${fmtTk(grandProfit)}</td>
        `;
        drBreakdownBody.appendChild(grandTr);

        if (drCardRevenue) drCardRevenue.innerText = fmtTk(grandRevenue);
        if (drCardExpenses) drCardExpenses.innerText = fmtTk(grandCost);
        if (drCardProfit) drCardProfit.innerText = fmtTk(grandProfit);
    }

    drSelectDate?.addEventListener('change', renderDailyReport);

    btnPrintDr?.addEventListener('click', function () {
        const dateStr = drSelectDate?.value || '2026-07-19';
        const sections = buildDailyReportSections(dateStr);

        const printTitle = document.getElementById('print-title-main');
        const printSubtitle = document.getElementById('print-subtitle-main');
        const printMeta = document.getElementById('print-meta-area');
        const printTableWrapper = document.getElementById('print-dynamic-table-wrapper');
        if (!printTableWrapper) return;

        let grandRevenue = 0, grandCost = 0, grandProfit = 0;
        let rowsHtml = '';
        sections.forEach(sec => {
            grandRevenue += sec.revenue;
            grandCost += sec.cost;
            grandProfit += sec.profit;
            rowsHtml += `
                <tr>
                    <td>${sec.name}</td>
                    <td style="text-align:right;">${sec.revenue > 0 ? fmtTk(sec.revenue) : '-'}</td>
                    <td style="text-align:right;">${sec.cost > 0 ? fmtTk(sec.cost) : '-'}</td>
                    <td style="text-align:right; font-weight:700;">${fmtTk(sec.profit)}</td>
                </tr>
            `;
        });

        if (printTitle) printTitle.textContent = 'DAILY FINANCIAL STATEMENT';
        if (printSubtitle) printSubtitle.textContent = 'Stationery Management System';
        if (printMeta) {
            printMeta.innerHTML = `
                <p><strong>Report Date:</strong> ${formatFinancialDate(dateStr)}</p>
                <p><strong>Generated On:</strong> ${formatFinancialDate('2026-07-19')}</p>
            `;
        }

        printTableWrapper.innerHTML = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="text-align:left;">Business Sector Module</th>
                        <th style="text-align:right;">Revenue (৳)</th>
                        <th style="text-align:right;">Expense (৳)</th>
                        <th style="text-align:right;">Net Profit (৳)</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            <div class="print-summary-box">
                <div class="print-summary-row"><span>Total Revenue (Inflow)</span><strong>${fmtTk(grandRevenue)}</strong></div>
                <div class="print-summary-row"><span>Total Cost &amp; Expenses</span><strong>${fmtTk(grandCost)}</strong></div>
                <div class="print-summary-row"><span>Net Profit for the Day</span><strong>${fmtTk(grandProfit)}</strong></div>
            </div>
        `;

        window.print();
    });

    // ================= MONTHLY REPORT ENGINE =================
    const mrFilterMonth = document.getElementById('mr-filter-month');
    const mrFilterYear = document.getElementById('mr-filter-year');
    const mrBreakdownBody = document.getElementById('mr-breakdown-tbody');
    const mrDaywiseBody = document.getElementById('mr-daywise-tbody');
    const mrCardRevenue = document.getElementById('mr-card-revenue');
    const mrCardExpenses = document.getElementById('mr-card-expenses');
    const mrCardProfit = document.getElementById('mr-card-profit');
    const mrCardAvgProfit = document.getElementById('mr-card-avgprofit');
    const btnPrintMr = document.getElementById('btn-print-mr');

    const MR_SECTION_META = [
        { name: 'Cash Book (Manual Entries)', icon: 'fa-book' },
        { name: 'Daily Sale', icon: 'fa-cart-shopping' },
        { name: 'Expense Management', icon: 'fa-wallet' },
        { name: 'Purchase Management', icon: 'fa-bag-shopping' },
        { name: 'Online Cost & Production', icon: 'fa-globe' },
        { name: 'Photocopy Service', icon: 'fa-copy' },
        { name: 'Mobile Banking', icon: 'fa-mobile-screen-button' },
        { name: 'Mini Summary (Petty Expense)', icon: 'fa-file-lines' }
    ];

    function buildMonthlyReportData(monthStr, yearStr) {
        const daysInMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0).getDate();
        const sectionTotals = MR_SECTION_META.map(meta => ({ ...meta, revenue: 0, cost: 0, profit: 0 }));
        const dayRows = [];
        let activeDays = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
            const daySections = buildDailyReportSections(dateStr);

            let dayRevenue = 0, dayCost = 0, dayProfit = 0;
            daySections.forEach((sec, idx) => {
                sectionTotals[idx].revenue += sec.revenue;
                sectionTotals[idx].cost += sec.cost;
                sectionTotals[idx].profit += sec.profit;
                dayRevenue += sec.revenue;
                dayCost += sec.cost;
                dayProfit += sec.profit;
            });

            if (dayRevenue !== 0 || dayCost !== 0) {
                activeDays++;
                dayRows.push({ date: dateStr, revenue: dayRevenue, cost: dayCost, profit: dayProfit });
            }
        }

        const grand = sectionTotals.reduce((acc, sec) => {
            acc.revenue += sec.revenue; acc.cost += sec.cost; acc.profit += sec.profit; return acc;
        }, { revenue: 0, cost: 0, profit: 0 });

        return { sectionTotals, dayRows, grand, activeDays };
    }

    function renderMonthlyReport() {
        if (!mrBreakdownBody) return;
        const monthStr = mrFilterMonth?.value || '07';
        const yearStr = mrFilterYear?.value || '2026';
        const { sectionTotals, dayRows, grand, activeDays } = buildMonthlyReportData(monthStr, yearStr);

        // Section-wise breakdown
        mrBreakdownBody.innerHTML = '';
        sectionTotals.forEach(sec => {
            const profitColor = sec.profit >= 0 ? '#16a34a' : '#dc2626';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 12px; font-weight: 500;"><i class="fas ${sec.icon}" style="width:18px; color:#64748b; margin-right:8px;"></i>${sec.name}</td>
                <td style="padding: 12px; text-align: right; color:#16a34a;">${sec.revenue > 0 ? fmtTk(sec.revenue) : '-'}</td>
                <td style="padding: 12px; text-align: right; color:#dc2626;">${sec.cost > 0 ? fmtTk(sec.cost) : '-'}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color:${profitColor};">${fmtTk(sec.profit)}</td>
            `;
            mrBreakdownBody.appendChild(tr);
        });
        const grandSecTr = document.createElement('tr');
        grandSecTr.style.background = '#f1f5f9';
        grandSecTr.style.borderTop = '2px solid #cbd5e1';
        grandSecTr.innerHTML = `
            <td style="padding: 12px; font-weight: 700;">Grand Total</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:#16a34a;">${fmtTk(grand.revenue)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:#dc2626;">${fmtTk(grand.cost)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:${grand.profit >= 0 ? '#2563eb' : '#dc2626'};">${fmtTk(grand.profit)}</td>
        `;
        mrBreakdownBody.appendChild(grandSecTr);

        // Day-wise ledger
        if (mrDaywiseBody) {
            mrDaywiseBody.innerHTML = '';
            if (dayRows.length === 0) {
                mrDaywiseBody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align:center; color:#94a3b8;">এই মাসে কোনো লেনদেন পাওয়া যায়নি।</td></tr>`;
            } else {
                dayRows.forEach(row => {
                    const profitColor = row.profit >= 0 ? '#16a34a' : '#dc2626';
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">${formatFinancialDate(row.date)}</td>
                        <td style="padding: 10px; text-align: right; color:#16a34a; border-bottom: 1px solid #f1f5f9;">${row.revenue > 0 ? fmtTk(row.revenue) : '-'}</td>
                        <td style="padding: 10px; text-align: right; color:#dc2626; border-bottom: 1px solid #f1f5f9;">${row.cost > 0 ? fmtTk(row.cost) : '-'}</td>
                        <td style="padding: 10px; text-align: right; font-weight: 600; color:${profitColor}; border-bottom: 1px solid #f1f5f9;">${fmtTk(row.profit)}</td>
                    `;
                    mrDaywiseBody.appendChild(tr);
                });
                const grandDayTr = document.createElement('tr');
                grandDayTr.style.background = '#f1f5f9';
                grandDayTr.style.borderTop = '2px solid #cbd5e1';
                grandDayTr.innerHTML = `
                    <td style="padding: 12px; text-align: center; font-weight: 700;">Total (${activeDays} Days)</td>
                    <td style="padding: 12px; text-align: right; font-weight: 700; color:#16a34a;">${fmtTk(grand.revenue)}</td>
                    <td style="padding: 12px; text-align: right; font-weight: 700; color:#dc2626;">${fmtTk(grand.cost)}</td>
                    <td style="padding: 12px; text-align: right; font-weight: 700; color:${grand.profit >= 0 ? '#2563eb' : '#dc2626'};">${fmtTk(grand.profit)}</td>
                `;
                mrDaywiseBody.appendChild(grandDayTr);
            }
        }

        // KPI cards
        const avgProfit = activeDays > 0 ? (grand.profit / activeDays) : 0;
        if (mrCardRevenue) mrCardRevenue.innerText = fmtTk(grand.revenue);
        if (mrCardExpenses) mrCardExpenses.innerText = fmtTk(grand.cost);
        if (mrCardProfit) mrCardProfit.innerText = fmtTk(grand.profit);
        if (mrCardAvgProfit) mrCardAvgProfit.innerText = fmtTk(avgProfit);
    }

    mrFilterMonth?.addEventListener('change', renderMonthlyReport);
    mrFilterYear?.addEventListener('change', renderMonthlyReport);

    btnPrintMr?.addEventListener('click', function () {
        const monthStr = mrFilterMonth?.value || '07';
        const yearStr = mrFilterYear?.value || '2026';
        const { sectionTotals, dayRows, grand, activeDays } = buildMonthlyReportData(monthStr, yearStr);

        const printTitle = document.getElementById('print-title-main');
        const printSubtitle = document.getElementById('print-subtitle-main');
        const printMeta = document.getElementById('print-meta-area');
        const printTableWrapper = document.getElementById('print-dynamic-table-wrapper');
        if (!printTableWrapper) return;

        let sectionRowsHtml = '';
        sectionTotals.forEach(sec => {
            sectionRowsHtml += `
                <tr>
                    <td>${sec.name}</td>
                    <td style="text-align:right;">${sec.revenue > 0 ? fmtTk(sec.revenue) : '-'}</td>
                    <td style="text-align:right;">${sec.cost > 0 ? fmtTk(sec.cost) : '-'}</td>
                    <td style="text-align:right; font-weight:700;">${fmtTk(sec.profit)}</td>
                </tr>
            `;
        });

        let dayRowsHtml = '';
        dayRows.forEach(row => {
            dayRowsHtml += `
                <tr>
                    <td style="text-align:center;">${formatFinancialDate(row.date)}</td>
                    <td style="text-align:right;">${row.revenue > 0 ? fmtTk(row.revenue) : '-'}</td>
                    <td style="text-align:right;">${row.cost > 0 ? fmtTk(row.cost) : '-'}</td>
                    <td style="text-align:right; font-weight:700;">${fmtTk(row.profit)}</td>
                </tr>
            `;
        });

        if (printTitle) printTitle.textContent = 'MONTHLY FINANCIAL STATEMENT';
        if (printSubtitle) printSubtitle.textContent = 'Stationery Management System';
        if (printMeta) {
            printMeta.innerHTML = `
                <p><strong>Month:</strong> ${getSelectedText('mr-filter-month')} ${yearStr}</p>
                <p><strong>Active Business Days:</strong> ${activeDays}</p>
                <p><strong>Generated On:</strong> ${formatFinancialDate('2026-07-19')}</p>
            `;
        }

        printTableWrapper.innerHTML = `
            <h3 style="font-size: 15px; margin-bottom: 10px; color:#1e293b;">Section-Wise Financial Breakdown</h3>
            <table class="print-table" style="margin-bottom: 25px;">
                <thead>
                    <tr>
                        <th style="text-align:left;">Business Sector Module</th>
                        <th style="text-align:right;">Revenue (৳)</th>
                        <th style="text-align:right;">Expense (৳)</th>
                        <th style="text-align:right;">Net Profit (৳)</th>
                    </tr>
                </thead>
                <tbody>${sectionRowsHtml}</tbody>
            </table>
            <h3 style="font-size: 15px; margin-bottom: 10px; color:#1e293b;">Day-Wise Ledger</h3>
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="text-align:center;">Date</th>
                        <th style="text-align:right;">Revenue (৳)</th>
                        <th style="text-align:right;">Expense (৳)</th>
                        <th style="text-align:right;">Net Profit (৳)</th>
                    </tr>
                </thead>
                <tbody>${dayRowsHtml || '<tr><td colspan="4" style="text-align:center;">No transactions found.</td></tr>'}</tbody>
            </table>
            <div class="print-summary-box">
                <div class="print-summary-row"><span>Total Revenue (Monthly)</span><strong>${fmtTk(grand.revenue)}</strong></div>
                <div class="print-summary-row"><span>Total Cost &amp; Expenses</span><strong>${fmtTk(grand.cost)}</strong></div>
                <div class="print-summary-row"><span>Net Profit for the Month</span><strong>${fmtTk(grand.profit)}</strong></div>
            </div>
        `;

        window.print();
    });

    // ================= YEARLY REPORT ENGINE =================
    const yrFilterYear = document.getElementById('yr-filter-year');
    const yrBreakdownBody = document.getElementById('yr-breakdown-tbody');
    const yrMonthwiseBody = document.getElementById('yr-monthwise-tbody');
    const yrCardRevenue = document.getElementById('yr-card-revenue');
    const yrCardExpenses = document.getElementById('yr-card-expenses');
    const yrCardProfit = document.getElementById('yr-card-profit');
    const yrCardAvgProfit = document.getElementById('yr-card-avgprofit');
    const btnPrintYr = document.getElementById('btn-print-yr');

    const MONTH_NAMES_SHORT = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function buildYearlyReportData(yearStr) {
        const sectionTotals = MR_SECTION_META.map(meta => ({ ...meta, revenue: 0, cost: 0, profit: 0 }));
        const monthRows = [];
        let activeMonths = 0;

        for (let m = 1; m <= 12; m++) {
            const monthStr = String(m).padStart(2, '0');
            const monthData = buildMonthlyReportData(monthStr, yearStr);

            monthData.sectionTotals.forEach((sec, idx) => {
                sectionTotals[idx].revenue += sec.revenue;
                sectionTotals[idx].cost += sec.cost;
                sectionTotals[idx].profit += sec.profit;
            });

            if (monthData.grand.revenue !== 0 || monthData.grand.cost !== 0) activeMonths++;
            monthRows.push({
                label: MONTH_NAMES_SHORT[m - 1],
                revenue: monthData.grand.revenue,
                cost: monthData.grand.cost,
                profit: monthData.grand.profit
            });
        }

        const grand = sectionTotals.reduce((acc, sec) => {
            acc.revenue += sec.revenue; acc.cost += sec.cost; acc.profit += sec.profit; return acc;
        }, { revenue: 0, cost: 0, profit: 0 });

        return { sectionTotals, monthRows, grand, activeMonths };
    }

    function renderYearlyReport() {
        if (!yrBreakdownBody) return;
        const yearStr = yrFilterYear?.value || '2026';
        const { sectionTotals, monthRows, grand, activeMonths } = buildYearlyReportData(yearStr);

        // Section-wise breakdown
        yrBreakdownBody.innerHTML = '';
        sectionTotals.forEach(sec => {
            const profitColor = sec.profit >= 0 ? '#16a34a' : '#dc2626';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 12px; font-weight: 500;"><i class="fas ${sec.icon}" style="width:18px; color:#64748b; margin-right:8px;"></i>${sec.name}</td>
                <td style="padding: 12px; text-align: right; color:#16a34a;">${sec.revenue > 0 ? fmtTk(sec.revenue) : '-'}</td>
                <td style="padding: 12px; text-align: right; color:#dc2626;">${sec.cost > 0 ? fmtTk(sec.cost) : '-'}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color:${profitColor};">${fmtTk(sec.profit)}</td>
            `;
            yrBreakdownBody.appendChild(tr);
        });
        const grandSecTr = document.createElement('tr');
        grandSecTr.style.background = '#f1f5f9';
        grandSecTr.style.borderTop = '2px solid #cbd5e1';
        grandSecTr.innerHTML = `
            <td style="padding: 12px; font-weight: 700;">Grand Total</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:#16a34a;">${fmtTk(grand.revenue)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:#dc2626;">${fmtTk(grand.cost)}</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color:${grand.profit >= 0 ? '#2563eb' : '#dc2626'};">${fmtTk(grand.profit)}</td>
        `;
        yrBreakdownBody.appendChild(grandSecTr);

        // Month-wise ledger (always shows all 12 months)
        if (yrMonthwiseBody) {
            yrMonthwiseBody.innerHTML = '';
            monthRows.forEach(row => {
                const profitColor = row.profit >= 0 ? '#16a34a' : '#dc2626';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9; font-weight: 500;">${row.label}</td>
                    <td style="padding: 10px; text-align: right; color:#16a34a; border-bottom: 1px solid #f1f5f9;">${row.revenue > 0 ? fmtTk(row.revenue) : '-'}</td>
                    <td style="padding: 10px; text-align: right; color:#dc2626; border-bottom: 1px solid #f1f5f9;">${row.cost > 0 ? fmtTk(row.cost) : '-'}</td>
                    <td style="padding: 10px; text-align: right; font-weight: 600; color:${profitColor}; border-bottom: 1px solid #f1f5f9;">${fmtTk(row.profit)}</td>
                `;
                yrMonthwiseBody.appendChild(tr);
            });
            const grandMonthTr = document.createElement('tr');
            grandMonthTr.style.background = '#f1f5f9';
            grandMonthTr.style.borderTop = '2px solid #cbd5e1';
            grandMonthTr.innerHTML = `
                <td style="padding: 12px; text-align: center; font-weight: 700;">Yearly Total</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color:#16a34a;">${fmtTk(grand.revenue)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color:#dc2626;">${fmtTk(grand.cost)}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700; color:${grand.profit >= 0 ? '#2563eb' : '#dc2626'};">${fmtTk(grand.profit)}</td>
            `;
            yrMonthwiseBody.appendChild(grandMonthTr);
        }

        // KPI cards
        const avgProfit = activeMonths > 0 ? (grand.profit / activeMonths) : 0;
        if (yrCardRevenue) yrCardRevenue.innerText = fmtTk(grand.revenue);
        if (yrCardExpenses) yrCardExpenses.innerText = fmtTk(grand.cost);
        if (yrCardProfit) yrCardProfit.innerText = fmtTk(grand.profit);
        if (yrCardAvgProfit) yrCardAvgProfit.innerText = fmtTk(avgProfit);
    }

    yrFilterYear?.addEventListener('change', renderYearlyReport);

    btnPrintYr?.addEventListener('click', function () {
        const yearStr = yrFilterYear?.value || '2026';
        const { sectionTotals, monthRows, grand, activeMonths } = buildYearlyReportData(yearStr);

        const printTitle = document.getElementById('print-title-main');
        const printSubtitle = document.getElementById('print-subtitle-main');
        const printMeta = document.getElementById('print-meta-area');
        const printTableWrapper = document.getElementById('print-dynamic-table-wrapper');
        if (!printTableWrapper) return;

        let sectionRowsHtml = '';
        sectionTotals.forEach(sec => {
            sectionRowsHtml += `
                <tr>
                    <td>${sec.name}</td>
                    <td style="text-align:right;">${sec.revenue > 0 ? fmtTk(sec.revenue) : '-'}</td>
                    <td style="text-align:right;">${sec.cost > 0 ? fmtTk(sec.cost) : '-'}</td>
                    <td style="text-align:right; font-weight:700;">${fmtTk(sec.profit)}</td>
                </tr>
            `;
        });

        let monthRowsHtml = '';
        monthRows.forEach(row => {
            monthRowsHtml += `
                <tr>
                    <td style="text-align:center;">${row.label}</td>
                    <td style="text-align:right;">${row.revenue > 0 ? fmtTk(row.revenue) : '-'}</td>
                    <td style="text-align:right;">${row.cost > 0 ? fmtTk(row.cost) : '-'}</td>
                    <td style="text-align:right; font-weight:700;">${fmtTk(row.profit)}</td>
                </tr>
            `;
        });

        if (printTitle) printTitle.textContent = 'YEARLY FINANCIAL STATEMENT';
        if (printSubtitle) printSubtitle.textContent = 'Stationery Management System';
        if (printMeta) {
            printMeta.innerHTML = `
                <p><strong>Year:</strong> ${yearStr}</p>
                <p><strong>Active Business Months:</strong> ${activeMonths} / 12</p>
                <p><strong>Generated On:</strong> ${formatFinancialDate('2026-07-19')}</p>
            `;
        }

        printTableWrapper.innerHTML = `
            <h3 style="font-size: 15px; margin-bottom: 10px; color:#1e293b;">Section-Wise Financial Breakdown</h3>
            <table class="print-table" style="margin-bottom: 25px;">
                <thead>
                    <tr>
                        <th style="text-align:left;">Business Sector Module</th>
                        <th style="text-align:right;">Revenue (৳)</th>
                        <th style="text-align:right;">Expense (৳)</th>
                        <th style="text-align:right;">Net Profit (৳)</th>
                    </tr>
                </thead>
                <tbody>${sectionRowsHtml}</tbody>
            </table>
            <h3 style="font-size: 15px; margin-bottom: 10px; color:#1e293b;">Month-Wise Ledger</h3>
            <table class="print-table">
                <thead>
                    <tr>
                        <th style="text-align:center;">Month</th>
                        <th style="text-align:right;">Revenue (৳)</th>
                        <th style="text-align:right;">Expense (৳)</th>
                        <th style="text-align:right;">Net Profit (৳)</th>
                    </tr>
                </thead>
                <tbody>${monthRowsHtml}</tbody>
            </table>
            <div class="print-summary-box">
                <div class="print-summary-row"><span>Total Revenue (Yearly)</span><strong>${fmtTk(grand.revenue)}</strong></div>
                <div class="print-summary-row"><span>Total Cost &amp; Expenses</span><strong>${fmtTk(grand.cost)}</strong></div>
                <div class="print-summary-row"><span>Net Profit for the Year</span><strong>${fmtTk(grand.profit)}</strong></div>
            </div>
        `;

        window.print();
    });

    // --- INITIAL RENDER CALLS ---
    updateCashBookUI();
    renderDailyReport();
    renderMonthlyReport();
    renderYearlyReport();
});