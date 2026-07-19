document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.querySelector(".toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main");
    const pageTitle = document.getElementById("page-title");

    // Live Database Array for Cash Book
    let cashTransactions = [
        { id: 100201, date: "2026-07-19", type: "credit", amount: 5500, note: "Daily Stationery Sale" },
        { id: 100202, date: "2026-07-18", type: "debit", amount: 900, note: "Shop Electric Bill" },
        { id: 100203, date: "2026-07-10", type: "credit", amount: 4200, note: "Photocopy Bulk Order" },
        { id: 100204, date: "2026-06-15", type: "debit", amount: 1500, note: "Paper Rim Purchase" },
        { id: 100205, date: "2025-12-25", type: "credit", amount: 8000, note: "Year End Special Sale" }
    ];

    // Photocopy Service Array Database (With Expense Breakdown)
    let photocopyServiceRecords = [
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
    let mbTransactions = [
        { id: 9001, date: "2026-07-19", details: "bKash Cash In 5000", commission: 25 },
        { id: 9002, date: "2026-07-19", details: "Nagad Cash Out 3000", commission: 15 },
        { id: 9003, date: "2026-07-10", details: "Rocket Personal Payin 2000", commission: 10 }
    ];

    // Sidebar Toggle
    if (toggleBtn && sidebar && mainContent) {
        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle("show-sidebar");
            } else {
                sidebar.classList.toggle("mini-sidebar");
                mainContent.classList.toggle("expand-main");
            }
        });
    }

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

        if (targetViewId === "mobile-banking") {
            updateMobileBankingUI();
        }
        if (targetViewId === "online-cost") {
            calculateOnlineCostAll();
        }
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
            const boxTitle = this.closest(".box").querySelector("h3").innerText.toLowerCase();
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
            if (card.classList.contains("expense-card")) switchPage("mini-summary", "Mini Summary");
            else if (card.classList.contains("profit-card")) switchPage("photocopy-service", "Photocopy Service");
            else if (card.classList.contains("cash-card")) switchPage("cash-book", "Cash Book");
        });
    });

    function formatFinancialDate(dateString) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const d = new Date(dateString);
        if(isNaN(d.getTime())) return dateString;
        return `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
    }

    // --- PHOTOCOPY SERVICE SYSTEM ENGINE ---
    function updatePhotocopyServiceUI() {
        const tableBody = document.querySelector("#main-ps-table tbody");
        const filterMonth = document.getElementById("ps-filter-month")?.value || "all";
        const filterYear = document.getElementById("ps-filter-year")?.value || "all";

        let sl = 1;
        let totalFilteredProfit = 0; // লাভ ট্র্যাক করার জন্য ভেরিয়েবল
        if (tableBody) tableBody.innerHTML = "";

        photocopyServiceRecords.forEach((rec) => {
            const year = rec.date.substring(0, 4);
            const month = rec.date.substring(5, 7);
            const isMatch = (filterMonth === "all" || month === filterMonth) && 
                            (filterYear === "all" || year === filterYear);

            if (isMatch) {
                totalFilteredProfit += rec.finalProfit; // ফিল্টার করা লাভ যোগ হচ্ছে

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

        // HTML সামারি বক্সে মোট লাভ পুশ করা
        if (document.getElementById("ps-total-profit-box")) {
            document.getElementById("ps-total-profit-box").innerText = "৳ " + totalFilteredProfit.toLocaleString();
        }
    }

    document.getElementById("btn-save-ps-record")?.addEventListener("click", function() {
        const dateVal = document.getElementById("ps-entry-date").value;
        const totalCount = parseFloat(document.getElementById("ps-entry-count").value) || 0;
        const avgePcs = parseFloat(document.getElementById("ps-entry-avg").value) || 0;
        const serviceCost = parseFloat(document.getElementById("ps-entry-service").value) || 0;
        
        const rimPerPcs = parseFloat(document.getElementById("rate-rim-pcs").value) || 450;
        const rimPerTk = parseFloat(document.getElementById("rate-rim-tk").value) || 350;

        const totalCopy = totalCount - avgePcs;
        if(totalCopy <= 0) {
            alert("দুঃখিত, কোনো ডাটা পাওয়া যায়নি! প্রথমে Photocopy Machine ক্যালকুলেটরে রিডিং ইনপুট দিন।");
            return;
        }

        let currentExpensesList = [];
        const titles = document.querySelectorAll(".pm-expense-title");
        const amounts = document.querySelectorAll(".pm-expense-amt");
        
        for(let i = 0; i < titles.length; i++) {
            let titleText = titles[i].value.trim();
            let amountVal = parseFloat(amounts[i].value) || 0;
            if (titleText !== "" || amountVal > 0) {
                currentExpensesList.push({ title: titleText || "General Maintenance", amount: amountVal });
            }
        }

        const grossAmt = totalCopy * 2;
        const rimQty = totalCopy / rimPerPcs;
        const rimCost = Math.round(rimQty * rimPerTk);
        const netAmt = grossAmt - rimCost;
        const finalProfit = netAmt - serviceCost; 

        const newRecord = {
            id: Math.floor(7000 + Math.random() * 3000),
            date: dateVal, totalCopy, grossAmt, rimQty, rimCost, netAmt, serviceCost, finalProfit, expenses: currentExpensesList
        };

        photocopyServiceRecords.unshift(newRecord);
        updatePhotocopyServiceUI();
        alert("ক্যালকুলেশন সাকসেসফুলি সেভ করা হয়েছে!");
    });

    // --- Photocopy Service Table Action (Delete & Row Single Print Fix) ---
    document.getElementById("main-ps-table")?.addEventListener("click", function(e) {
        const deleteBtn = e.target.closest(".btn-delete-ps");
        const printBtn = e.target.closest(".btn-print-ps");
        
        if (deleteBtn) {
            const idToDelete = parseInt(deleteBtn.getAttribute("data-id"));
            if (confirm("আপনি কি এই ফটোকপি সার্ভিস রেকর্ডটি ডিলিট করতে চান?")) {
                photocopyServiceRecords = photocopyServiceRecords.filter(r => r.id !== idToDelete);
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
                if(rec.expenses && rec.expenses.length > 0) {
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

    // --- Photocopy Service: Full Report Bulk Filter Print Fix ---
    document.getElementById("btn-print-ps-report")?.addEventListener("click", function() {
        const mText = document.getElementById("ps-filter-month").options[document.getElementById("ps-filter-month").selectedIndex].text;
        const yText = document.getElementById("ps-filter-year").options[document.getElementById("ps-filter-year").selectedIndex].text;

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
        const selectedMonth = document.getElementById("ps-filter-month").value;
        const selectedYear = document.getElementById("ps-filter-year").value;

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
                <div class="print-summary-row"><span>Gross Volume:</span><span>৳ ${totalGross.toLocaleString()}</span></div>
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


    // --- CASH BOOK ENGINE & DASHBOARD ENGINE ---
    function updateCashBookUI() {
        const mainTableBody = document.querySelector("#main-cashbook-table tbody");
        const dashTableBody = document.querySelector("#dash-cashbook-table tbody");
        const selectedMonth = document.getElementById("filter-month")?.value || "all";
        const selectedYear = document.getElementById("filter-year")?.value || "all";

        let totalDebit = 0, totalCredit = 0, ledgerSl = 1, recentSl = 0;

        if (mainTableBody) mainTableBody.innerHTML = "";
        if (dashTableBody) dashTableBody.innerHTML = "";

        cashTransactions.forEach((tx) => {
            const txYear = tx.date.substring(0, 4);
            const txMonth = tx.date.substring(5, 7);
            const isMatch = (selectedMonth === "all" || txMonth === selectedMonth) && 
                            (selectedYear === "all" || txYear === selectedYear);

            const formattedDate = formatFinancialDate(tx.date);
            const isCredit = tx.type === "credit";

            if (isMatch) {
                if (isCredit) totalCredit += tx.amount;
                else totalDebit += tx.amount;

                if (mainTableBody) {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${ledgerSl}</td><td>${formattedDate}</td>
                        <td class="${!isCredit ? 'text-red font-semibold' : ''}">${!isCredit ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                        <td class="${isCredit ? 'text-green font-semibold' : ''}">${isCredit ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                        <td>${tx.note}</td>
                        <td>
                            <div class="action-cell">
                                <button class="btn-print-row btn-print-cash-single" data-id="${tx.id}"><i class="fas fa-print"></i></button>
                                <button class="btn-delete-row btn-delete-cash" data-id="${tx.id}"><i class="fas fa-trash-can"></i></button>
                            </div>
                        </td>
                    `;
                    mainTableBody.appendChild(tr);
                    ledgerSl++;
                }
            }

            if (dashTableBody && recentSl < 5) {
                const trDash = document.createElement("tr");
                trDash.innerHTML = `
                    <td>${formattedDate}</td>
                    <td class="${!isCredit ? 'text-red' : ''}">${!isCredit ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                    <td class="${isCredit ? 'text-green' : ''}">${isCredit ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                    <td>${tx.note}</td>
                `;
                dashTableBody.appendChild(trDash);
                recentSl++;
            }
        });

        const cashInHand = totalCredit - totalDebit; 
        if(document.getElementById("total-debit")) document.getElementById("total-debit").innerText = `৳ ${totalDebit.toLocaleString()}`;
        if(document.getElementById("total-credit")) document.getElementById("total-credit").innerText = `৳ ${totalCredit.toLocaleString()}`;
        if(document.getElementById("net-balance")) document.getElementById("net-balance").innerText = `৳ ${cashInHand.toLocaleString()}`;

        if(document.getElementById("dash-sale")) document.getElementById("dash-sale").innerText = `৳ ${totalCredit.toLocaleString()}`;
        if(document.getElementById("dash-expense")) document.getElementById("dash-expense").innerText = `৳ ${totalDebit.toLocaleString()}`;
        if(document.getElementById("dash-cash")) document.getElementById("dash-cash").innerText = `৳ ${cashInHand.toLocaleString()}`;

        const calculatedProfit = cashInHand * 0.25;
        if(document.getElementById("dash-profit")) {
            document.getElementById("dash-profit").innerText = `৳ ${Math.round(calculatedProfit).toLocaleString()}`;
        }
    }

    // --- Cash Book Action ---
    document.getElementById("main-cashbook-table")?.addEventListener("click", function(e) {
        const deleteBtn = e.target.closest(".btn-delete-cash");
        const printBtn = e.target.closest(".btn-print-cash-single");
        
        if (deleteBtn) {
            const idToDelete = parseInt(deleteBtn.getAttribute("data-id"));
            if (confirm("আপনি কি নিশ্চিতভাবে এই ক্যাশ বুক রেকর্ডটি ডিলিট করতে চান?")) {
                cashTransactions = cashTransactions.filter(r => r.id !== idToDelete);
                updateCashBookUI();
            }
        }

        if (printBtn) {
            const idToPrint = parseInt(printBtn.getAttribute("data-id"));
            const tx = cashTransactions.find(r => r.id === idToPrint);
            if (tx) {
                document.getElementById("print-title-main").innerText = "SINGLE TRANSACTION VOUCHER";
                document.getElementById("print-subtitle-main").innerText = `Voucher ID: #${tx.id}`;
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
                                <td>${tx.note}</td>
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

    // --- Cash Book: Print report ---
    document.getElementById("btn-print-ledger")?.addEventListener("click", function() {
        const mText = document.getElementById("filter-month").options[document.getElementById("filter-month").selectedIndex].text;
        const yText = document.getElementById("filter-year").options[document.getElementById("filter-year").selectedIndex].text;

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
        const selectedMonth = document.getElementById("filter-month").value;
        const selectedYear = document.getElementById("filter-year").value;

        cashTransactions.forEach(tx => {
            const txYear = tx.date.substring(0, 4);
            const txMonth = tx.date.substring(5, 7);
            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                if (tx.type === "credit") totalCredit += tx.amount;
                else totalDebit += tx.amount;

                tableHtml += `
                    <tr>
                        <td>${sl}</td>
                        <td>${formatFinancialDate(tx.date)}</td>
                        <td>${tx.type === 'debit' ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                        <td>${tx.type === 'credit' ? '৳ ' + tx.amount.toLocaleString() : '-'}</td>
                        <td>${tx.note}</td>
                    </tr>
                `;
                sl++;
            }
        });

        tableHtml += `</tbody></table>`;
        const summaryHtml = `
            <div class="print-summary-box">
                <div class="print-summary-row"><span>Total Debit (Expense):</span><span>৳ ${totalDebit.toLocaleString()}</span></div>
                <div class="print-summary-row"><span>Total Credit (Income):</span><span>৳ ${totalCredit.toLocaleString()}</span></div>
                <div class="print-summary-row" style="font-weight: bold; background: #e2e8f0;"><span>Net Balance:</span><span>৳ ${(totalCredit - totalDebit).toLocaleString()}</span></div>
            </div>
        `;

        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });

    document.getElementById("filter-month")?.addEventListener("change", updateCashBookUI);
    document.getElementById("filter-year")?.addEventListener("change", updateCashBookUI);

    document.getElementById("cashbook-form")?.addEventListener("submit", function (e) {
        e.preventDefault();
        const dateVal = document.getElementById("input-date").value;
        const typeVal = document.getElementById("input-type").value;
        const amountVal = parseFloat(document.getElementById("input-amount").value);
        const noteVal = document.getElementById("input-note").value;

        const newTx = { id: Math.floor(100000 + Math.random() * 900000), date: dateVal, type: typeVal, amount: amountVal, note: noteVal };
        cashTransactions.unshift(newTx);
        updateCashBookUI();
        this.reset();
        document.getElementById("input-date").value = "2026-07-19";
    });


    // --- MOBILE BANKING LOGIC ---
    const fmtBDT = (num) => "৳ " + Number(num || 0).toLocaleString('en-IN', {maximumFractionDigits: 0});

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
    }

    document.getElementById("mb-form")?.addEventListener("submit", function(e) {
        e.preventDefault();
        const date = document.getElementById("mb-date").value;
        const details = document.getElementById("mb-details").value;
        const commission = parseFloat(document.getElementById("mb-commission").value) || 0;

        const newTx = { id: Math.floor(9000 + Math.random() * 1000), date, details, commission };
        mbTransactions.unshift(newTx);
        updateMobileBankingUI();
        this.reset();
        document.getElementById("mb-date").value = "2026-07-19";
    });

    document.getElementById("main-mb-table")?.addEventListener("click", function(e) {
        const deleteBtn = e.target.closest(".btn-delete-mb");
        if (deleteBtn) {
            const id = parseInt(deleteBtn.getAttribute("data-id"));
            if (confirm("আপনি কি নিশ্চিতভাবে এই মোবাইল ব্যাংকিং ট্রানজেকশনটি মুছে ফেলতে চান?")) {
                mbTransactions = mbTransactions.filter(t => t.id !== id);
                updateMobileBankingUI();
            }
        }
    });

    document.getElementById("mb-filter-month")?.addEventListener("change", updateMobileBankingUI);
    document.getElementById("mb-filter-year")?.addEventListener("change", updateMobileBankingUI);

    document.getElementById("btn-print-mb-report")?.addEventListener("click", function() {
        const mText = document.getElementById("mb-filter-month").options[document.getElementById("mb-filter-month").selectedIndex].text;
        const yText = document.getElementById("mb-filter-year").options[document.getElementById("mb-filter-year").selectedIndex].text;

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
        
        mbTransactions.forEach(tx => {
            const txYear = tx.date.substring(0, 4);
            const txMonth = tx.date.substring(5, 7);
            const selectedMonth = document.getElementById("mb-filter-month").value;
            const selectedYear = document.getElementById("mb-filter-year").value;
            
            if((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
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
                    <span>100% Total Net Profit:</span><span style="color:#7c3aed;">${fmtBDT(totalProfit)}</span>
                </div>
            </div>
        `;
        document.getElementById("print-dynamic-table-wrapper").innerHTML = tableHtml + summaryHtml;
        window.print();
    });


    // --- PHOTOCOPY MACHINE CALCULATION (FIXED & FULLY FUNCTIONAL) ---
    function calculatePhotocopyMachine() {
        const dateVal = document.getElementById("pm-date")?.value || "2026-07-19";
        const totalCount = parseFloat(document.getElementById("pm-total-count")?.value) || 0;
        const avgePcs = parseFloat(document.getElementById("pm-avge-pcs")?.value) || 0;
        
        // ১. সার্ভিস খরচের লাইভ যোগফল বের করা
        let totalExpenseSum = 0;
        document.querySelectorAll(".pm-expense-amt").forEach(input => {
            totalExpenseSum += parseFloat(input.value) || 0;
        });
        
        const serviceCost = totalExpenseSum;
        if(document.getElementById("pm-service-cost")) {
            document.getElementById("pm-service-cost").innerText = serviceCost > 0 ? "৳ " + serviceCost.toLocaleString() : "0";
        }
        
        const rimPerPcs = parseFloat(document.getElementById("rate-rim-pcs")?.value) || 450;
        const rimPerTk = parseFloat(document.getElementById("rate-rim-tk")?.value) || 350;

        // ২. ডাইনামিক টোটাল কপি হিসাব (Total Count - Avge.PCS)
        const totalCopy = totalCount - avgePcs;
        if(document.getElementById("pm-total-copy")) {
            document.getElementById("pm-total-copy").innerText = totalCopy > 0 ? totalCopy.toLocaleString() : "0";
        }

        // ৩. প্রতি কপির দাম ২ টাকা ধরে টোটাল এমাউন্ট
        const totalAmount = totalCopy > 0 ? totalCopy * 2 : 0;
        if(document.getElementById("pm-total-amount")) {
            document.getElementById("pm-total-amount").innerText = "৳ " + totalAmount.toLocaleString();
        }

        // ৪. রিম খরচ ও নেট এমাউন্ট ডাইনামিক ক্যালকুলেশন
        const totalRim = totalCopy > 0 ? totalCopy / rimPerPcs : 0;
        if(document.getElementById("pm-total-rim")) {
            document.getElementById("pm-total-rim").innerText = totalRim > 0 ? totalRim.toFixed(2) : "0";
        }

        const totalRimTk = Math.round(totalRim * rimPerTk);
        if(document.getElementById("pm-total-rim-tk")) {
            document.getElementById("pm-total-rim-tk").innerText = "৳ " + totalRimTk.toLocaleString();
        }

        const netAmount = totalAmount - totalRimTk;
        if(document.getElementById("pm-net-amount")) {
            document.getElementById("pm-net-amount").innerText = "৳ " + (netAmount > 0 ? netAmount.toLocaleString() : "0");
        }

        // ৫. ফাইনাল সর্বমোট হিসাব (Net Amount - Service Cost)
        const finalTotal = netAmount - serviceCost;
        if(document.getElementById("pm-final-total")) {
            document.getElementById("pm-final-total").innerText = "৳ " + (finalTotal > 0 ? Math.round(finalTotal).toLocaleString() : "0");
        }

        // ৬. কপি সার্ভিস টেবিল প্রিপারেশন ইনপুটের সাথে ডাইনামিক ডেটা পুশ ও সিঙ্ক
        if(document.getElementById("ps-entry-date")) document.getElementById("ps-entry-date").value = dateVal;
        if(document.getElementById("ps-entry-count")) document.getElementById("ps-entry-count").value = totalCount;
        if(document.getElementById("ps-entry-avg")) document.getElementById("ps-entry-avg").value = avgePcs;
        if(document.getElementById("ps-entry-service")) document.getElementById("ps-entry-service").value = serviceCost;
    }

    // --- PHOTOCOPY MACHINE EVENT LISTENERS & EXPENSE ROW CONTROLS ---
    // ইনপুট ফিল্ডগুলোতে টাইপ করলেই রিয়েল-টাইম লাইভ ক্যালকুলেশন রান হবে
    document.getElementById("pm-date")?.addEventListener("change", calculatePhotocopyMachine);
    document.getElementById("pm-total-count")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("pm-avge-pcs")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("rate-rim-pcs")?.addEventListener("input", calculatePhotocopyMachine);
    document.getElementById("rate-rim-tk")?.addEventListener("input", calculatePhotocopyMachine);

    // ডাইনামিক নতুন এক্সপেন্স রো লাইন যোগ করার সুবিধা
    document.getElementById("btn-add-pm-expense")?.addEventListener("click", function() {
        const tbody = document.getElementById("pm-expense-tbody");
        if(!tbody) return;
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
        // নতুন যুক্ত হওয়া রো এর এমাউন্টে ইনপুট লিসেনার বাইন্ড করা
        tr.querySelector(".pm-expense-amt").addEventListener("input", calculatePhotocopyMachine);
    });

    // এক্সপেন্স ডিলিট বোতাম এবং বিদ্যমান এক্সপেন্সে ইভেন্ট বাইন্ডিং
    document.getElementById("pm-expense-tbody")?.addEventListener("click", function(e) {
        const removeBtn = e.target.closest(".btn-remove-pm-exp");
        if (removeBtn) {
            removeBtn.closest("tr").remove();
            calculatePhotocopyMachine();
        }
    });
    document.querySelectorAll(".pm-expense-amt").forEach(input => {
        input.addEventListener("input", calculatePhotocopyMachine);
    });


    // --- ONLINE COST ENGINE (FIXED & FULLY FUNCTIONAL WITH DASHBOARD INTEGRATION) ---
    function addOnlineMasterRow(date = '2026-07-19', particulars = '', onlineWork = '', printSale = '', printCost = '') {
        const tbody = document.getElementById("oc-master-tbody");
        if(!tbody) return;
        
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

    window.calculateOnlineCostAll = function() {
        let grossOnlineRaw = 0, grossPrintRaw = 0, grossCostRaw = 0;
        const selectedMonth = document.getElementById("oc-filter-month")?.value || "all";
        const selectedYear = document.getElementById("oc-filter-year")?.value || "all";

        document.querySelectorAll("#oc-master-tbody tr").forEach(row => {
            const rowDate = row.querySelector(".oc-row-date").value;
            const txYear = rowDate.substring(0, 4);
            const txMonth = rowDate.substring(5, 7);
            
            const isMatch = (selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear);
                            
            if (!isMatch) { row.style.display = "none"; return; } else { row.style.display = ""; }

            const onlineWorkVal = parseFloat(row.querySelector(".oc-row-online-work").value) || 0;
            const printSaleVal = parseFloat(row.querySelector(".oc-row-print-sale").value) || 0;
            const printCostVal = parseFloat(row.querySelector(".oc-row-print-cost").value) || 0;

            grossOnlineRaw += onlineWorkVal; grossPrintRaw += printSaleVal; grossCostRaw += printCostVal;
            const rowMargin = (onlineWorkVal / 2) + (printSaleVal * 0.70) - printCostVal;
            row.querySelector(".oc-row-net-margin").innerText = fmtBDT(rowMargin);
        });

        const shareOnlineNet = grossOnlineRaw / 2;
        const sharePrintNet = grossPrintRaw * 0.70;
        const finalCalculatedProfit = shareOnlineNet + sharePrintNet - grossCostRaw;

        // Footers & Summary Calculation updates
        document.getElementById("oc-tot-online-raw").innerText = fmtBDT(grossOnlineRaw);
        document.getElementById("oc-tot-print-raw").innerText = fmtBDT(grossPrintRaw);
        document.getElementById("oc-tot-cost-raw").innerText = fmtBDT(grossCostRaw);
        document.getElementById("oc-tot-margin-net").innerText = fmtBDT(finalCalculatedProfit);
        
        // Dynamic Update Formula Box Under the Table
        if(document.getElementById("oc-formula-online")) document.getElementById("oc-formula-online").innerText = fmtBDT(shareOnlineNet);
        if(document.getElementById("oc-formula-print")) document.getElementById("oc-formula-print").innerText = fmtBDT(sharePrintNet);
        if(document.getElementById("oc-formula-cost")) document.getElementById("oc-formula-cost").innerText = "- ৳ " + grossCostRaw.toLocaleString();
        if(document.getElementById("oc-formula-final")) document.getElementById("oc-formula-final").innerText = fmtBDT(finalCalculatedProfit);

        // Update KPI top boxes
        if(document.getElementById("oc-kpi-online-net")) document.getElementById("oc-kpi-online-net").innerText = fmtBDT(shareOnlineNet);
        if(document.getElementById("oc-kpi-print-net")) document.getElementById("oc-kpi-print-net").innerText = fmtBDT(sharePrintNet);
        if(document.getElementById("oc-kpi-prod-cost")) document.getElementById("oc-kpi-prod-cost").innerText = fmtBDT(grossCostRaw);
        if(document.getElementById("oc-kpi-final-profit")) document.getElementById("oc-kpi-final-profit").innerText = fmtBDT(finalCalculatedProfit);

        // --- DASHBOARD LIVE CARDS SYNC ---
        if(document.getElementById("dash-online-net")) document.getElementById("dash-online-net").innerText = fmtBDT(shareOnlineNet);
        if(document.getElementById("dash-print-net")) document.getElementById("dash-print-net").innerText = fmtBDT(sharePrintNet);
        if(document.getElementById("dash-total-costing")) document.getElementById("dash-total-costing").innerText = fmtBDT(grossCostRaw);
        if(document.getElementById("dash-final-net")) document.getElementById("dash-final-net").innerText = fmtBDT(finalCalculatedProfit);
    }

    // Master Event Listener for Online Cost Table Actions (Delete / Print Row)
    document.getElementById("oc-master-tbody")?.addEventListener("click", function(e) {
        const deleteBtn = e.target.closest(".btn-delete-oc-row");
        const printMonthlyBtn = e.target.closest(".btn-oc-row-print-monthly");
        const printYearlyBtn = e.target.closest(".btn-oc-row-print-yearly");

        if (deleteBtn) {
            const rowId = deleteBtn.getAttribute("data-id");
            if (confirm("আপনি কি নিশ্চিতভাবে এই রো লাইনটি মুছে ফেলতে চান?")) {
                document.getElementById(rowId)?.remove();
                calculateOnlineCostAll();
            }
        }

        if (printMonthlyBtn || printYearlyBtn) {
            const rowId = (printMonthlyBtn || printYearlyBtn).getAttribute("data-id");
            const row = document.getElementById(rowId);
            if (!row) return;

            const date = row.querySelector(".oc-row-date").value;
            const particulars = row.querySelector(".oc-row-particulars").value || "N/A";
            const onlineWork = parseFloat(row.querySelector(".oc-row-online-work").value) || 0;
            const printSale = parseFloat(row.querySelector(".oc-row-print-sale").value) || 0;
            const printCost = parseFloat(row.querySelector(".oc-row-print-cost").value) || 0;
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

    // Bulk / Monthly Report Print for Online Cost Tracker
    document.getElementById("btn-print-oc-monthly")?.addEventListener("click", function() {
        const mText = document.getElementById("oc-filter-month").options[document.getElementById("oc-filter-month").selectedIndex].text;
        const yText = document.getElementById("oc-filter-year").options[document.getElementById("oc-filter-year").selectedIndex].text;

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
        const selectedMonth = document.getElementById("oc-filter-month").value;
        const selectedYear = document.getElementById("oc-filter-year").value;

        document.querySelectorAll("#oc-master-tbody tr").forEach(row => {
            const rowDate = row.querySelector(".oc-row-date").value;
            const txYear = rowDate.substring(0, 4);
            const txMonth = rowDate.substring(5, 7);
            
            if ((selectedMonth === "all" || txMonth === selectedMonth) && (selectedYear === "all" || txYear === selectedYear)) {
                const particulars = row.querySelector(".oc-row-particulars").value || "N/A";
                const onlineWorkVal = parseFloat(row.querySelector(".oc-row-online-work").value) || 0;
                const printSaleVal = parseFloat(row.querySelector(".oc-row-print-sale").value) || 0;
                const printCostVal = parseFloat(row.querySelector(".oc-row-print-cost").value) || 0;

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

    document.getElementById("btn-add-oc-row")?.addEventListener("click", () => addOnlineMasterRow());

    // Initial Demo Records Loading
    addOnlineMasterRow('2026-07-02', 'Logo Design & Vector Work', 4000, 0, 0);
    addOnlineMasterRow('2026-07-06', 'T-Shirt Sublimation Printing', 0, 8500, 3200);

    // Run System Setup On Loaded
    updateCashBookUI();
    calculatePhotocopyMachine(); 
    updatePhotocopyServiceUI();
    calculateOnlineCostAll(); // Run real-time calculation & push to dashboard initially
});