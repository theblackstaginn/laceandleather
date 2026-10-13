/***************************************
* Lace & Leather — Order Intake (Sheets)
* Code.gs (single file)
*
* Deploy as Web App:
* - Execute as: Me
* - Who has access: Anyone
*
* Supports:
* 1) Create order: POST payload=<json> (server validates SKUs/prices)
* 2) Payment submitted: POST action=payment_submitted&order_id=...
*
* Backward compatibility:
* - The current website may still send action=paid.
* - Public action=paid is treated ONLY as payment_submitted.
* - A public request can NEVER mark an order actually paid.
*
* Actual PAID status:
* - Verify payment directly in Venmo.
* - Select the matching row in the Sheet.
* - Use: L&L Orders → Mark selected order PAID
*
* Emails:
* - On NEW order: emails YOU (optional)
* - On PAYMENT SUBMITTED: emails YOU to verify Venmo
* - On VERIFIED PAID: emails YOU + CUSTOMER
***************************************/

const SHEET_NAME = "Sheet1";

const OWNER_EMAIL = "lace.and.leather65@gmail.com";
const EMAIL_SUBJECT_PREFIX = "[Lace & Leather Order]";
const EMAIL_OWNER_ON_NEW = true;
const EMAIL_CUSTOMER_ON_PAID = false;
const OWNER_TOKEN_PROPERTY = "LACE_OWNER_TOKEN";
const OWNER_ORDER_LIMIT = 75;

/* =========================
TRUSTED PRODUCT CATALOG
Server-side authority for pricing
========================= */

const SERVER_CATALOG = Object.freeze({
"grimoire": Object.freeze({
id: "grimoire",
name: "Grimoire Pages",
price: 5.00
}),
"mapmaker": Object.freeze({
id: "mapmaker",
name: "Mapmaker Sheets",
price: 5.00
}),
"volone": Object.freeze({
id: "volone",
name: "Light Aged Parchment - Vol. One",
price: 5.00,
aliases: ["Light Aged Parchment — Vol. One"]
}),
"smithy": Object.freeze({
id: "smithy",
name: "Smithy Textures",
price: 5.00
}),
"button-amber-bronze": Object.freeze({
id: "button-amber-bronze",
name: "Amber Bronze",
price: 1.00
}),
"button-amethyst-frame": Object.freeze({
id: "button-amethyst-frame",
name: "Amethyst Frame",
price: 1.00
}),
"button-amethyst-rectangle": Object.freeze({
id: "button-amethyst-rectangle",
name: "Amethyst Rectangle",
price: 1.00
}),
"button-emerald-oval": Object.freeze({
id: "button-emerald-oval",
name: "Emerald Oval",
price: 1.00
}),
"button-emerald-x": Object.freeze({
id: "button-emerald-x",
name: "Emerald X",
price: 1.00
}),
"button-green-moon": Object.freeze({
id: "button-green-moon",
name: "Green Moon",
price: 1.00
}),
"button-grn-wax-book": Object.freeze({
id: "button-grn-wax-book",
name: "Grn Wax Book",
price: 1.00
}),
"button-lantern": Object.freeze({
id: "button-lantern",
name: "Lantern",
price: 1.00
}),
"button-moon-green": Object.freeze({
id: "button-moon-green",
name: "Moon Green",
price: 1.00
}),
"button-moon-parch-clean": Object.freeze({
id: "button-moon-parch-clean",
name: "Moon Parch Clean",
price: 1.00
}),
"button-purple-arrow": Object.freeze({
id: "button-purple-arrow",
name: "Purple Arrow",
price: 1.00
}),
"button-purple-wax-crystal": Object.freeze({
id: "button-purple-wax-crystal",
name: "Purple Wax Crystal",
price: 1.00
}),
"button-purple-x-shield": Object.freeze({
id: "button-purple-x-shield",
name: "Purple X Shield",
price: 1.00
}),
"button-red-arrow": Object.freeze({
id: "button-red-arrow",
name: "Red Arrow",
price: 1.00
}),
"button-red-parch-arrow": Object.freeze({
id: "button-red-parch-arrow",
name: "Red Parch Arrow",
price: 1.00
}),
"button-red-stag": Object.freeze({
id: "button-red-stag",
name: "Red Stag",
price: 1.00
}),
"button-red-wax-feather": Object.freeze({
id: "button-red-wax-feather",
name: "Red Wax Feather",
price: 1.00
}),
"button-red-x-bronze": Object.freeze({
id: "button-red-x-bronze",
name: "Red X Bronze",
price: 1.00
}),
"button-red-x-shield": Object.freeze({
id: "button-red-x-shield",
name: "Red X Shield",
price: 1.00
}),
"button-red-x": Object.freeze({
id: "button-red-x",
name: "Red X",
price: 1.00
}),
"button-ruby-plate": Object.freeze({
id: "button-ruby-plate",
name: "Ruby Plate",
price: 1.00
}),
"button-sapphire-arrow": Object.freeze({
id: "button-sapphire-arrow",
name: "Sapphire Arrow",
price: 1.00
}),
"button-sapphire-plate": Object.freeze({
id: "button-sapphire-plate",
name: "Sapphire Plate",
price: 1.00
}),
"button-skull-bronze-plate": Object.freeze({
id: "button-skull-bronze-plate",
name: "Skull Bronze Plate",
price: 1.00
}),
"button-skull-plate": Object.freeze({
id: "button-skull-plate",
name: "Skull Plate",
price: 1.00
}),
"button-skull": Object.freeze({
id: "button-skull",
name: "Skull",
price: 1.00
}),
"button-stag-plate": Object.freeze({
id: "button-stag-plate",
name: "Stag Plate",
price: 1.00
}),
"button-stag-red-wax": Object.freeze({
id: "button-stag-red-wax",
name: "Stag Red Wax",
price: 1.00
}),
"button-wax-green-book-2": Object.freeze({
id: "button-wax-green-book-2",
name: "Wax Green Book 2",
price: 1.00
}),
"button-wax-key": Object.freeze({
id: "button-wax-key",
name: "Wax Key",
price: 1.00
}),
"button-wax-skull": Object.freeze({
id: "button-wax-skull",
name: "Wax Skull",
price: 1.00
})
});

function normalizeProductName_(value) {
return safeStr_(value)
.replace(/[--‒–—―]/g, "-")
.replace(/\s+/g, " ")
.toLowerCase();
}

function findTrustedProduct_(item) {
if (!item || typeof item !== "object") {
return null;
}

const id = safeStr_(item.id);

if (id) {
return SERVER_CATALOG[id] || null;
}
const target = normalizeProductName_(item.name);

if (!target) {
return null;
}

const ids = Object.keys(SERVER_CATALOG);

for (let i = 0; i < ids.length; i++) {
const product = SERVER_CATALOG[ids[i]];

if (normalizeProductName_(product.name) === target) {
return product;
}

if (
Array.isArray(product.aliases)
&& product.aliases.some(
alias => normalizeProductName_(alias) === target
)
) {
return product;
}
}

return null;
}

function normalizeTrustedItems_(rawItems) {
if (!Array.isArray(rawItems) || !rawItems.length) {
throw new Error("Cart is empty.");
}

const merged = {};
const order = [];

rawItems.forEach((item, index) => {
const product = findTrustedProduct_(item);

if (!product) {
throw new Error(
"Unknown product at cart item "
+ (index + 1)
+ "."
);
}

const qty = Number(
item && item.qty !== undefined
? item.qty
: 1
);

if (
!Number.isFinite(qty)
|| Math.floor(qty) !== qty
|| qty < 1
|| qty > 99
) {
throw new Error(
"Invalid quantity for "
+ product.name
+ "."
);
}

if (!merged[product.id]) {
merged[product.id] = {
id: product.id,
name: product.name,
price: product.price,
qty: 0
};

order.push(product.id);
}

merged[product.id].qty += qty;

if (merged[product.id].qty > 99) {
throw new Error(
"Quantity too large for "
+ product.name
+ "."
);
}
});

return order.map(id => merged[id]);
}

function calcTrustedTotal_(items) {
const cents = items.reduce(
(sum, item) => {
const unitCents = Math.round(
Number(item.price) * 100
);
return sum + unitCents * Number(item.qty);
},
0
);

return cents / 100;
}

/**
* Adds owner-only controls to the bound Sheet.
*/
function onOpen() {
SpreadsheetApp.getUi()
.createMenu("L&L Orders")
.addItem("Mark selected order PAID", "markSelectedOrderPaid")
.addSeparator()
.addItem("Setup / rotate Owner Console token", "setupOwnerToken")
.addToUi();
}

/**
* Health check
*/
function doGet(e) {
try {
const sheet = getSheet_();
const col = headerMap_(sheet);
const action = safeStr_(
e && e.parameter && e.parameter.action
? e.parameter.action
: ""
);

if (action === "order_status") {
return jsonOrJsonpResponse_(
handleOrderStatus_(sheet, col, e),
e
);
}

if (action === "owner_orders") {
return jsonOrJsonpResponse_(
handleOwnerOrders_(sheet, col, e),
e
);
}

if (action === "owner_health") {
return jsonOrJsonpResponse_({
ok: ownerAuthorized_(e),
authorized: ownerAuthorized_(e),
now: new Date().toISOString()
}, e);
}

return jsonOrJsonpResponse_({
ok: true,
message: "Order intake endpoint alive. Use POST.",
now: new Date().toISOString()
}, e);

} catch (err) {
return jsonOrJsonpResponse_({
ok: false,
error: "Server error",
details: String(err)
}, e);
}
}

/**
* Main endpoint
*/
function doPost(e) {
try {
const sheet = getSheet_();
const col = headerMap_(sheet);

const action =
(e && e.parameter && e.parameter.action)
? String(e.parameter.action).trim()
: "";

// SECURITY:
// Public requests can submit payment for review,
// but can never mark an order actually paid.
// Owner actions require the bearer token stored in Script Properties.
if (action === "owner_mark_paid") {
return finishResponse_(
handleOwnerMarkPaid_(sheet, col, e),
e
);
}

// Treat legacy public action=paid as payment_submitted.
if (action === "paid" || action === "payment_submitted") {
return finishResponse_(
handlePaymentSubmitted_(sheet, col, e),
e
);
}

return finishResponse_(
handleNewOrder_(sheet, col, e),
e
);

} catch (err) {
return finishResponse_(
jsonResponse_({
ok: false,
error: "Server error",
details: String(err)
}),
e
);
}}

/* =========================
NEW ORDER
========================= */

function handleNewOrder_(sheet, col, e) {
let raw = "";

if (e && e.parameter && e.parameter.payload) {
raw = e.parameter.payload;
} else if (e && e.postData && e.postData.contents) {
raw = e.postData.contents;
}

if (!raw) {
return jsonResponse_({
ok: false,
error: "Empty POST body"
});
}

let payload;

try {
payload = JSON.parse(raw);
} catch (err) {
return jsonResponse_({
ok: false,
error: "Invalid JSON",
details: String(err)
});
}

const createdAt = new Date().toISOString();
const orderId = safeStr_(payload.order_id || payload.orderId || payload.id);

if (!orderId) {
return jsonResponse_({
ok: false,
error: "Missing order_id"
});
}

const rawItems = Array.isArray(payload.items)
? payload.items
: (payload.cart || payload.line_items || []);

let items;

try {
items = normalizeTrustedItems_(rawItems);
} catch (err) {
return jsonResponse_({
ok: false,
error: "Invalid cart",
details: String(err)
});
}

// Browser-supplied prices, total and currency are ignored.
// The server rebuilds them from SERVER_CATALOG.
const total = calcTrustedTotal_(items);
const currency = "USD";

const itemsJson = JSON.stringify(items);

const customer = payload.customer || {};
const custName = safeStr_(
customer.name || payload.customer_name || payload.name
);
const custEmail = safeStr_(
customer.email || payload.customer_email || payload.email
);

if (!isEmail_(custEmail)) {
return jsonResponse_({
ok: false,
error: "Invalid customer email"
});
}

const note = safeStr_(
payload.note ||
payload.message ||
payload.customer_note ||
""
);

const referrer = safeStr_(payload.referrer || "");
// Public callers do not control order status.
const status = "new";

// Kept for compatibility. e.postData.type is content type,
// not a true browser User-Agent.
const userAgent = safeStr_(
payload.user_agent ||
(e && e.parameter && e.parameter.user_agent) ||
(e && e.postData && e.postData.type) ||
""
);

// Idempotency + race protection for checkout retries.
const lock = LockService.getScriptLock();
lock.waitLock(10000);

let nextRow;

try {
const existingRows = findOrderRowIndexes_(sheet, col, orderId);

if (existingRows.length) {
if (existingRows.length !== 1) {
return jsonResponse_({
ok: false,
error: "Duplicate order_id. Manual review required.",
order_id: orderId
});
}

const existing = readOrderRow_(sheet, col, existingRows[0]);

return jsonResponse_({
ok: true,
saved: false,
duplicate: true,
order_id: existing.order_id,
created_at: existing.created_at,
total: existing.total,
currency: existing.currency,
items: existing.items,
status: existing.status
});
}

nextRow = Math.max(2, sheet.getLastRow() + 1);

setCellIf_(sheet, nextRow, col.created_at, createdAt);
setCellIf_(sheet, nextRow, col.order_id, orderId);
setCellIf_(sheet, nextRow, col.total, total);
setCellIf_(sheet, nextRow, col.currency, currency);
setCellIf_(sheet, nextRow, col.customer_name, custName);
setCellIf_(sheet, nextRow, col.customer_email, custEmail);
setCellIf_(sheet, nextRow, col.items_json, itemsJson);
setCellIf_(sheet, nextRow, col.note, note);
setCellIf_(sheet, nextRow, col.user_agent, userAgent);
setCellIf_(sheet, nextRow, col.referrer, referrer);
setCellIf_(sheet, nextRow, col.status, status);
setCellIf_(sheet, nextRow, col.payment_submitted_at, "");
setCellIf_(sheet, nextRow, col.paid, "");
setCellIf_(sheet, nextRow, col.paid_at, "");
setCellIf_(sheet, nextRow, col.payment_method, "");
setCellIf_(sheet, nextRow, col.delivery_sent_at, "");
setCellIf_(sheet, nextRow, col.delivery_files, "");
setCellIf_(sheet, nextRow, col.delivery_error, "");

} finally {
lock.releaseLock();
}

let ownerEmailOk = false;
let ownerEmailErr = "";

try {
if (EMAIL_OWNER_ON_NEW && isEmail_(OWNER_EMAIL)) {
sendOwnerEmailNew_(OWNER_EMAIL, {
created_at: createdAt,
order_id: orderId,
total,
currency,
items,
customer_name: custName,
customer_email: custEmail,
note,
status,
referrer,
user_agent: userAgent
});

ownerEmailOk = true;
}
} catch (mailErr) {
ownerEmailOk = false;
ownerEmailErr = String(mailErr);
}
return jsonResponse_({
ok: true,
saved: true,
order_id: orderId,
created_at: createdAt,
total: total,
currency: currency,
items: items,
owner_email_ok: ownerEmailOk,
owner_email_error: ownerEmailErr
});
}

/* =========================
PAYMENT SUBMITTED
Public request — NOT proof of payment
========================= */

function handlePaymentSubmitted_(sheet, col, e) {
const orderId = safeStr_(
e && e.parameter && e.parameter.order_id
? e.parameter.order_id
: ""
);

if (!orderId) {
return jsonResponse_({
ok: false,
error: "Missing order_id"
});
}

const rows = findOrderRowIndexes_(sheet, col, orderId);

if (!rows.length) {
return jsonResponse_({
ok: false,
error: "Order not found",
order_id: orderId
});
}

// Never let a public request guess which duplicate row to modify.
if (rows.length !== 1) {
return jsonResponse_({
ok: false,
error: "Duplicate order_id. Manual review required.",
order_id: orderId
});
}

const rowIndex = rows[0];
const rowObj = readOrderRow_(sheet, col, rowIndex);

// Already owner-verified and finalized.
if (rowObj.paid === true || rowObj.status === "paid") {
return jsonResponse_({
ok: true,
order_id: orderId,
status: "paid",
already_finalized: true
});
}

// Idempotent: retries do not resend notifications.
if (rowObj.status === "payment_submitted") {
return jsonResponse_({
ok: true,
order_id: orderId,
status: "payment_submitted",
already_submitted: true
});
}

setCellIf_(
sheet,
rowIndex,
col.status,
"payment_submitted"
);
setCellIf_(
sheet,
rowIndex,
col.payment_submitted_at,
formatLocal_(new Date())
);

const updated = readOrderRow_(sheet, col, rowIndex);

let ownerOk = false;
let ownerErr = "";

try {
if (isEmail_(OWNER_EMAIL)) {
sendOwnerEmailPaymentSubmitted_(OWNER_EMAIL, updated);
ownerOk = true;
}
} catch (err) {
ownerOk = false;
ownerErr = String(err);
}

return jsonResponse_({
ok: true,
updated: true,
order_id: orderId,
status: "payment_submitted",
message: "Payment submitted for verification.",
owner_email_ok: ownerOk,
owner_email_error: ownerErr
});
}

/* =========================
ORDER STATUS + OWNER API
========================= */

function handleOrderStatus_(sheet, col, e) {
const orderId = safeStr_(
e && e.parameter && e.parameter.order_id
? e.parameter.order_id
: ""
);

if (!orderId) {
return {
ok: false,
error: "Missing order_id"
};
}

const rows = findOrderRowIndexes_(sheet, col, orderId);

if (!rows.length) {
return {
ok: true,
found: false,
order_id: orderId
};
}

if (rows.length !== 1) {
return {
ok: false,
found: true,
error: "Duplicate order_id. Manual review required.",
order_id: orderId
};
}

const rowObj = readOrderRow_(sheet, col, rows[0]);

return {
ok: true,
found: true,
order_id: rowObj.order_id,
status: rowObj.status,
paid: rowObj.paid,
payment_submitted_at: rowObj.payment_submitted_at,
paid_at: rowObj.paid_at,
payment_method: rowObj.payment_method,
delivery_sent_at: rowObj.delivery_sent_at,
delivery_error: rowObj.delivery_error
};
}

function ownerOrderView_(rowObj) {
return {
created_at: rowObj.created_at,
order_id: rowObj.order_id,
total: rowObj.total,
currency: rowObj.currency,
items: rowObj.items,
venmo_handle: rowObj.customer_name,
customer_email: rowObj.customer_email,
note: rowObj.note,
status: rowObj.status,
payment_submitted_at: rowObj.payment_submitted_at,
paid: rowObj.paid,
paid_at: rowObj.paid_at,
payment_method: rowObj.payment_method,
delivery_sent_at: rowObj.delivery_sent_at,
delivery_error: rowObj.delivery_error
};
}

function handleOwnerOrders_(sheet, col, e) {
if (!ownerAuthorized_(e)) {
return {
ok: false,
error: "Unauthorized"
};
}

const lastRow = sheet.getLastRow();
const orders = [];

for (
let rowIndex = lastRow;
rowIndex >= 2 && orders.length < OWNER_ORDER_LIMIT;
rowIndex--
) {
const rowObj = readOrderRow_(sheet, col, rowIndex);

if (!rowObj.order_id) {
continue;
}

orders.push(ownerOrderView_(rowObj));
}

return {
ok: true,
orders: orders,
counts: {
payment_submitted: orders.filter(
o => o.status === "payment_submitted" && !o.paid
).length,
awaiting_payment: orders.filter(
o => o.status === "new" && !o.paid
).length,
paid: orders.filter(
o => o.status === "paid" || o.paid
).length,
delivery_errors: orders.filter(
o => !!o.delivery_error
).length
},
now: new Date().toISOString()
};
}

function finalizePaidOrder_(sheet, col, rowIndex) {
let rowObj = readOrderRow_(sheet, col, rowIndex);

if (rowObj.paid === true || rowObj.status === "paid") {
return {
ok: true,
already_paid: true,
order: ownerOrderView_(rowObj)
};
}

const paidAt = formatLocal_(new Date());

setCellIf_(sheet, rowIndex, col.status, "paid");
setCellIf_(sheet, rowIndex, col.paid, true);
setCellIf_(sheet, rowIndex, col.paid_at, paidAt);
setCellIf_(sheet, rowIndex, col.payment_method, "Venmo");

rowObj = readOrderRow_(sheet, col, rowIndex);

let ownerEmailError = "";
let customerEmailError = "";

try {
if (isEmail_(OWNER_EMAIL)) {
sendOwnerEmailPaid_(OWNER_EMAIL, rowObj);
}
} catch (err) {
ownerEmailError = String(err);
}

try {
if (
EMAIL_CUSTOMER_ON_PAID
&& isEmail_(rowObj.customer_email)
) {
sendCustomerReceiptPaid_(
rowObj.customer_email,
rowObj
);
}
} catch (err) {
customerEmailError = String(err);
}

return {
ok: true,
order: ownerOrderView_(rowObj),
owner_email_error: ownerEmailError,
customer_email_error: customerEmailError
};
}

function handleOwnerMarkPaid_(sheet, col, e) {
if (!ownerAuthorized_(e)) {
return jsonResponse_({
ok: false,
error: "Unauthorized"
});
}

const orderId = safeStr_(
e && e.parameter && e.parameter.order_id
? e.parameter.order_id
: ""
);

if (!orderId) {
return jsonResponse_({
ok: false,
error: "Missing order_id"
});
}

const rows = findOrderRowIndexes_(sheet, col, orderId);

if (rows.length !== 1) {
return jsonResponse_({
ok: false,
error: rows.length
? "Duplicate order_id. Manual review required."
: "Order not found",
order_id: orderId
});
}

const rowIndex = rows[0];
const rowObj = readOrderRow_(sheet, col, rowIndex);

if (rowObj.paid === true || rowObj.status === "paid") {
return jsonResponse_({
ok: true,
already_paid: true,
order: ownerOrderView_(rowObj)
});
}

const venmoHandle = normalizeVenmoHandle_(
e && e.parameter && e.parameter.venmo_handle
? e.parameter.venmo_handle
: ""
);

if (venmoHandle && isValidVenmoHandle_(venmoHandle)) {
setCellIf_(
sheet,
rowIndex,
col.customer_name,
venmoHandle
);
}

return jsonResponse_(
finalizePaidOrder_(sheet, col, rowIndex)
);
}

/* =========================
OWNER-ONLY PAYMENT CONTROL
========================= */

/**
* Select an order row in the Sheet and use:
* L&L Orders → Mark selected order PAID
*
* Only use after verifying payment directly in Venmo.
*/
function markSelectedOrderPaid() {
const sheet = getSheet_();
const col = headerMap_(sheet);
const ui = SpreadsheetApp.getUi();

const activeRange = sheet.getActiveRange();

if (!activeRange) {
ui.alert("Select an order row first.");
return;
}

const rowIndex = activeRange.getRow();

if (rowIndex < 2) {
ui.alert("Select an order row first.");
return;
}

let rowObj = readOrderRow_(sheet, col, rowIndex);

if (!rowObj.order_id) {
ui.alert("The selected row has no order ID.");
return;
}

if (rowObj.paid === true || rowObj.status === "paid") {
ui.alert("This order is already marked paid.");
return;
}
const answer = ui.alert(
"Verify Venmo first",
"Mark order " +
rowObj.order_id +
" as PAID?\n\n" +
"Only continue after you have confirmed the payment in Venmo.",
ui.ButtonSet.YES_NO
);

if (answer !== ui.Button.YES) {
return;
}

const paidAt = formatLocal_(new Date());

setCellIf_(sheet, rowIndex, col.status, "paid");
setCellIf_(sheet, rowIndex, col.paid, true);
setCellIf_(sheet, rowIndex, col.paid_at, paidAt);
setCellIf_(sheet, rowIndex, col.payment_method, "Venmo");

rowObj = readOrderRow_(sheet, col, rowIndex);

let ownerErr = "";
let customerErr = "";

try {
if (isEmail_(OWNER_EMAIL)) {
sendOwnerEmailPaid_(OWNER_EMAIL, rowObj);
}
} catch (err) {
ownerErr = String(err);
}

try {
if (
EMAIL_CUSTOMER_ON_PAID
&& isEmail_(rowObj.customer_email)
) {
sendCustomerReceiptPaid_(rowObj.customer_email, rowObj);
}
} catch (err) {
customerErr = String(err);
}

let message =
"Order " +
rowObj.order_id +
" marked PAID.";

if (ownerErr) {
message += "\n\nOwner email error:\n" + ownerErr;
}

if (customerErr) {
message += "\n\nCustomer email error:\n" + customerErr;
}

ui.alert(message);
}

/* =========================
SHEET + HEADER MAPPING
========================= */

function getSheet_() {
const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet = ss.getSheetByName(SHEET_NAME);

if (!sheet) {
throw new Error(`Sheet tab not found: ${SHEET_NAME}`);
}

return sheet;
}

function headerMap_(sheet) {
const lastCol = Math.max(1, sheet.getLastColumn());

const headers = sheet
.getRange(1, 1, 1, lastCol)
.getValues()[0]
.map(h => String(h || "").trim());

const m = {};

headers.forEach((h, i) => {
if (h) {
m[h] = i + 1;
}
});

const noteCol = m["note"] || m["customer_note"] || 0;
const uaCol = m["user_agent"] || 0;

const required = [
"order_id",
"status",
"paid",
"paid_at",
"payment_method",
"total",
"currency",
"items_json",
"created_at",
"referrer"
];

required.forEach(k => {
if (!m[k]) {
throw new Error("Missing required header column: " + k);
}
});

return {
created_at: m["created_at"],
order_id: m["order_id"],
total: m["total"],
currency: m["currency"],
customer_name: m["customer_name"] || 0,
customer_email: m["customer_email"] || 0,items_json: m["items_json"],
note: noteCol,
user_agent: uaCol,
referrer: m["referrer"],
status: m["status"],
paid: m["paid"],
paid_at: m["paid_at"],
payment_method: m["payment_method"],
payment_submitted_at: m["payment_submitted_at"] || 0,
delivery_sent_at: m["delivery_sent_at"] || 0,
delivery_files: m["delivery_files"] || 0,
delivery_error: m["delivery_error"] || 0
};
}

/**
* Legacy first-match helper retained for compatibility.
*/
function findOrderRowIndex_(sheet, col, orderId) {
const lastRow = sheet.getLastRow();

if (lastRow < 2) {
return -1;
}

const values = sheet
.getRange(2, col.order_id, lastRow - 1, 1)
.getValues();

for (let i = 0; i < values.length; i++) {
if (String(values[i][0]).trim() === orderId) {
return i + 2;
}
}

return -1;
}

/**
* Duplicate-aware lookup used by public payment submission.
*/
function findOrderRowIndexes_(sheet, col, orderId) {
const lastRow = sheet.getLastRow();

if (lastRow < 2) {
return [];
}

const values = sheet
.getRange(2, col.order_id, lastRow - 1, 1)
.getValues();

const rows = [];

for (let i = 0; i < values.length; i++) {
if (String(values[i][0]).trim() === orderId) {
rows.push(i + 2);
}
}

return rows;
}

function readOrderRow_(sheet, col, rowIndex) {
const get = c => (
c
? sheet.getRange(rowIndex, c).getValue()
: ""
);

const itemsRaw = String(get(col.items_json) || "[]");

let items = [];

try {
items = JSON.parse(itemsRaw);
} catch {
items = [];
}

return {
created_at: String(get(col.created_at) || ""),
order_id: String(get(col.order_id) || ""),
total: Number(get(col.total) || 0),
currency: String(get(col.currency) || "USD"),
items,
customer_name: String(get(col.customer_name) || ""),
customer_email: String(get(col.customer_email) || ""),
note: String(get(col.note) || ""),
referrer: String(get(col.referrer) || ""),
status: String(get(col.status) || ""),
paid: Boolean(get(col.paid)),
paid_at: String(get(col.paid_at) || ""),
payment_method: String(get(col.payment_method) || ""),
payment_submitted_at: String(get(col.payment_submitted_at) || ""),
delivery_sent_at: String(get(col.delivery_sent_at) || ""),
delivery_files: String(get(col.delivery_files) || ""),
delivery_error: String(get(col.delivery_error) || "")
};
}

/* =========================
SAFE SETTERS + UTIL
========================= */

function setCellIf_(sheet, row, colIndex, value) {
if (!colIndex) {
return;
}

sheet.getRange(row, colIndex).setValue(value);
}

function jsonResponse_(obj) {
return ContentService
.createTextOutput(JSON.stringify(obj))
.setMimeType(ContentService.MimeType.JSON);
}

/**
* Hidden-iframe bridge response used by pay.html.
*
* The checkout page cannot read a cross-origin Apps Script response directly,
* so the iframe posts the normal JSON payload back to its parent window.
*/
function iframeBridgeResponse_(obj, nonce) {
const message = {
source: "lace-leather-appscript",
nonce: safeStr_(nonce),
payload: obj
};

// Escape characters that could break out of the inline <script> block.
const serialized = JSON.stringify(message)
.replace(/</g, "\\u003c")
.replace(/>/g, "\\u003e")
.replace(/&/g, "\\u0026")
.replace(/\u2028/g, "\\u2028")
.replace(/\u2029/g, "\\u2029");

const html =
'<!doctype html><html><head><meta charset="utf-8"></head><body>' +
'<script>' +
'window.parent.postMessage(' + serialized + ', "*");' +
'<\/script>' +
'</body></html>';

return HtmlService
.createHtmlOutput(html)
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
* Keep normal JSON responses for direct/API use, but translate iframe checkout
* responses into postMessage callbacks that pay.html can receive.
*/
function finishResponse_(response, e) {
const transport = safeStr_(
e && e.parameter && e.parameter.transport
? e.parameter.transport
: ""
);

if (transport !== "iframe") {
return response;
}

const nonce = safeStr_(
e && e.parameter && e.parameter.bridge_nonce
? e.parameter.bridge_nonce
: ""
);

let payload;

try {
if (response && typeof response.getContent === "function") {
payload = JSON.parse(response.getContent());
} else if (response && typeof response === "object") {
payload = response;
} else {
payload = {
ok: false,
error: "Invalid server response"
};
}
} catch (err) {
payload = {
ok: false,
error: "Server response parse error",
details: String(err)
};
}

if (!nonce) {
payload = {
ok: false,
error: "Missing bridge_nonce"
};
}

return iframeBridgeResponse_(payload, nonce);
}

function safeStr_(v) {
if (v === null || v === undefined) {
return "";
}

return String(v).trim();
}

function normalizeVenmoHandle_(value) {
const raw = safeStr_(value);

if (!raw) {
return "";
}

return raw.charAt(0) === "@"
? raw
: "@" + raw;
}

function isValidVenmoHandle_(value) {
const handle = normalizeVenmoHandle_(value);
return /^@[A-Za-z0-9._-]{2,64}$/.test(handle);
}

function ownerToken_() {
return safeStr_(
PropertiesService
.getScriptProperties()
.getProperty(OWNER_TOKEN_PROPERTY)
);
}

function setupOwnerToken() {
const token = (
Utilities.getUuid().replace(/-/g, "")
+ Utilities.getUuid().replace(/-/g, "")
);

PropertiesService
.getScriptProperties()
.setProperty(OWNER_TOKEN_PROPERTY, token);

SpreadsheetApp.getUi().alert(
"Owner Console token",
"Copy this token into the Lace & Leather Owner Console on your device. Keep it private. Rotating it signs out existing devices.\n\n" + token,
SpreadsheetApp.getUi().ButtonSet.OK
);

return token;
}

function ownerAuthorized_(e) {
const expected = ownerToken_();
const provided = safeStr_(
e && e.parameter && e.parameter.owner_token
? e.parameter.owner_token
: ""
);

return !!expected && !!provided && expected === provided;
}

function jsonOrJsonpResponse_(obj, e) {
const callback = safeStr_(
e && e.parameter && e.parameter.callback
? e.parameter.callback
: ""
);

if (!callback) {
return jsonResponse_(obj);
}

if (!/^[A-Za-z_$][A-Za-z0-9_$\\.]{0,100}$/.test(callback)) {
return jsonResponse_({
ok: false,
error: "Invalid callback"
});
}

return ContentService
.createTextOutput(
callback + "(" + JSON.stringify(obj) + ");"
)
.setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function safeNum_(v) {
const n = Number(v);
return Number.isFinite(n) ? n : 0;
}

function isEmail_(s) {
const v = safeStr_(s);
return v && v.includes("@") && v.includes(".");
}

function formatLocal_(d) {
return Utilities.formatDate(
d,
Session.getScriptTimeZone(),
"M/d/yyyy HH:mm:ss"
);
}

/* =========================
EMAILS
========================= */

function itemsPreview_(items) {
if (!items || !items.length) {
return "(no items)";
}

return items.map(it => {
const name =
(it && it.name)
? String(it.name)
: "Item";

const qty = Number(
it && it.qty
? it.qty
: 1
);

const price = Number(
it && it.price
? it.price
: 0
);

return `- ${name} x${qty} @ $${price.toFixed(2)}`;
}).join("\n");
}

function sendOwnerEmailNew_(toEmail, rowObj) {
const body =
`New order confirmed (NOT yet paid).

Order ID: ${rowObj.order_id}
Total: $${Number(rowObj.total).toFixed(2)} ${rowObj.currency}
Status: ${rowObj.status}
Time: ${rowObj.created_at}
Customer: ${rowObj.customer_name || ""}${rowObj.customer_email ? " <" +
rowObj.customer_email + ">" : ""}

Note:
${rowObj.note || ""}

Items:
${itemsPreview_(rowObj.items)}

Referrer: ${rowObj.referrer || ""}

(Logged to Google Sheets.)`;

MailApp.sendEmail({
to: toEmail,
subject:
`${EMAIL_SUBJECT_PREFIX} CONFIRMED ` +
`${rowObj.order_id} — ` +
`$${Number(rowObj.total).toFixed(2)}`,
body
});
}

function sendOwnerEmailPaymentSubmitted_(toEmail, rowObj) {
const body =
`PAYMENT SUBMITTED — VERIFY IN VENMO.

This order has NOT been marked paid yet.

Order ID: ${rowObj.order_id}
Total: $${Number(rowObj.total).toFixed(2)} ${rowObj.currency}
Status: payment_submitted

Customer: ${rowObj.customer_name || ""}${rowObj.customer_email ? " <" +
rowObj.customer_email + ">" : ""}

Items:
${itemsPreview_(rowObj.items)}

IMPORTANT:
Verify the payment directly in Venmo.

Then select this order row in the Sheet and use:

L&L Orders → Mark selected order PAID`;

MailApp.sendEmail({
to: toEmail,
subject:
`${EMAIL_SUBJECT_PREFIX} VERIFY PAYMENT ` +
`${rowObj.order_id} — ` +
`$${Number(rowObj.total).toFixed(2)}`,
body
});
}

function sendOwnerEmailPaid_(toEmail, rowObj) {
const body =
`PAID confirmed.

Order ID: ${rowObj.order_id}
Total: $${Number(rowObj.total).toFixed(2)} ${rowObj.currency}
Paid At: ${rowObj.paid_at}
Method: ${rowObj.payment_method}
Status: ${rowObj.status}

Customer: ${rowObj.customer_name || ""}${rowObj.customer_email ? " <" +
rowObj.customer_email + ">" : ""}

Items:
${itemsPreview_(rowObj.items)}

(Logged to Google Sheets.)`;

MailApp.sendEmail({
to: toEmail,
subject:
`${EMAIL_SUBJECT_PREFIX} PAID ` +
`${rowObj.order_id} — ` +
`$${Number(rowObj.total).toFixed(2)}`,
body
});
}

function sendCustomerReceiptPaid_(toEmail, rowObj) {
const body =
`Thanks for your purchase from Lace & Leather.

Receipt:
Order ID: ${rowObj.order_id}
Total: $${Number(rowObj.total).toFixed(2)} ${rowObj.currency}
Paid At: ${rowObj.paid_at}
Payment Method: ${rowObj.payment_method}

Items:
${itemsPreview_(rowObj.items)}
If you need help, reply to this email.

— Lace & Leather`;

MailApp.sendEmail({
to: toEmail,
subject: `Your Lace & Leather receipt — ${rowObj.order_id}`,
body
});
}

/**
* One-time authorization helper.
* Run manually from Apps Script editor to grant MailApp permission.
*/
function RUN_EMAIL_AUTH() {
MailApp.sendEmail(
OWNER_EMAIL,
"L&L test",
"Email auth test."
);

return "OK";
}