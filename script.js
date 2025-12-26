let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editIndex = null;

const form = document.getElementById("transactionForm");
const table = document.getElementById("transactionTable");

const investedEl = document.getElementById("invested");
const realizedEl = document.getElementById("realized");
const unrealizedEl = document.getElementById("unrealized");
const dividendsEl = document.getElementById("dividends");
const netProfitEl = document.getElementById("netProfit");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const transaction = {
        date: date.value,
        stock: stock.value.toUpperCase(),
        type: type.value,
        quantity: Number(quantity.value) || 0,
        price: Number(price.value)
    };

    if (editIndex === null) {
        transactions.push(transaction);
    } else {
        transactions[editIndex] = transaction;
        editIndex = null;
    }

    localStorage.setItem("transactions", JSON.stringify(transactions));
    form.reset();
    render();
});

function render() {
    table.innerHTML = "";

    let invested = 0;
    let realizedProfit = 0;
    let dividends = 0;
    let unrealizedValue = 0;

    let holdings = {};

    transactions.forEach((t, index) => {

        // BUY
        if (t.type === "buy") {
            const amount = t.quantity * t.price;
            invested += amount;

            if (!holdings[t.stock]) {
                holdings[t.stock] = { qty: 0, avg: 0 };
            }

            const stock = holdings[t.stock];
            stock.avg =
                (stock.avg * stock.qty + amount) /
                (stock.qty + t.quantity);
            stock.qty += t.quantity;
        }

        // SELL
        if (t.type === "sell") {
            const stock = holdings[t.stock];
            if (stock) {
                realizedProfit += (t.price - stock.avg) * t.quantity;
                stock.qty -= t.quantity;
            }
        }

        // DIVIDEND
        if (t.type === "dividend") {
            dividends += t.price;
        }

        const amount = t.type === "dividend"
            ? t.price
            : t.quantity * t.price;

        table.innerHTML += `
            <tr>
                <td>${t.date}</td>
                <td>${t.stock}</td>
                <td>${t.type}</td>
                <td>${t.quantity || "-"}</td>
                <td>${t.price}</td>
                <td>${amount}</td>
                <td>
                    <button onclick="editTransaction(${index})">✏️</button>
                    <button onclick="deleteTransaction(${index})">🗑</button>
                </td>
            </tr>
        `;
    });

    Object.values(holdings).forEach(stock => {
        unrealizedValue += stock.qty * stock.avg;
    });

    investedEl.textContent = invested.toFixed(2);
unrealizedEl.textContent = unrealizedValue.toFixed(2);
dividendsEl.textContent = dividends.toFixed(2);

realizedEl.textContent = `₹${realizedProfit.toFixed(2)}`;
netProfitEl.textContent = `₹${(realizedProfit + dividends).toFixed(2)}`;

// Color logic
realizedEl.className =
    realizedProfit >= 0 ? "profit" : "loss";

netProfitEl.className =
    (realizedProfit + dividends) >= 0 ? "profit" : "loss";

}

// DELETE
function deleteTransaction(index) {
    if (confirm("Delete this transaction?")) {
        transactions.splice(index, 1);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        render();
    }
}

// EDIT
function editTransaction(index) {
    const t = transactions[index];

    date.value = t.date;
    stock.value = t.stock;
    type.value = t.type;
    quantity.value = t.quantity;
    price.value = t.price;

    editIndex = index;
}

render();
// ===== ACCOUNT SUMMARY =====

const accountInputs = [
    "totalDeposit",
    "totalWithdraw",
    "paidStocks",
    "receivedStocks",
    "currentInvested",
    "brokerageBalance"
];

const overallProfitEl = document.getElementById("overallProfit");

// Load saved account data
let accountData = JSON.parse(localStorage.getItem("accountData")) || {};

accountInputs.forEach(id => {
    const input = document.getElementById(id);

    // Restore saved values
    if (accountData[id]) {
        input.value = accountData[id];
    }

    // Listen for changes
    input.addEventListener("input", () => {
        accountData[id] = Number(input.value) || 0;
        localStorage.setItem("accountData", JSON.stringify(accountData));
        calculateOverallProfit();
    });
});

function calculateOverallProfit() {
    const totalDeposit = accountData.totalDeposit || 0;
    const totalWithdraw = accountData.totalWithdraw || 0;
    const currentInvested = accountData.currentInvested || 0;
    const brokerageBalance = accountData.brokerageBalance || 0;

    const netDeposits = totalDeposit - totalWithdraw;
    const currentValue = currentInvested + brokerageBalance;
    const profit = currentValue - netDeposits;

    overallProfitEl.textContent = `₹${profit.toFixed(2)}`;
    overallProfitEl.className = profit >= 0 ? "profit" : "loss";
}

// Initial calculation
calculateOverallProfit();

