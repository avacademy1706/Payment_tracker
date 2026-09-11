"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/vercel.ts
var vercel_exports = {};
__export(vercel_exports, {
  default: () => handler
});
module.exports = __toCommonJS(vercel_exports);

// src/app.ts
var import_express13 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_morgan = __toESM(require("morgan"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);

// src/config/env.ts
var import_config = require("dotenv/config");
function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === void 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
var env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT ?? 5e3),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: required("JWT_SECRET", process.env.NODE_ENV === "test" ? "test-secret" : void 0),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "pt_token",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@paymenttracker.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
  seedAdminName: process.env.SEED_ADMIN_NAME ?? "Admin User"
};

// src/routes/index.ts
var import_express12 = require("express");

// src/services/token.service.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
function signToken(payload) {
  return import_jsonwebtoken.default.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}
function verifyToken(token) {
  return import_jsonwebtoken.default.verify(token, env.jwtSecret);
}

// src/utils/ApiError.ts
var ApiError = class _ApiError extends Error {
  statusCode;
  errors;
  constructor(statusCode, message, errors) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
  static badRequest(message, errors) {
    return new _ApiError(400, message, errors);
  }
  static unauthorized(message = "Not authenticated.") {
    return new _ApiError(401, message);
  }
  static forbidden(message = "Not authorized.") {
    return new _ApiError(403, message);
  }
  static notFound(message = "Resource not found.") {
    return new _ApiError(404, message);
  }
  static conflict(message, errors) {
    return new _ApiError(409, message, errors);
  }
};

// src/middleware/auth.middleware.ts
function extractToken(req) {
  const cookieToken = req.cookies?.[env.cookieName];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return void 0;
}
function requireAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    next(ApiError.unauthorized("Please sign in to continue."));
    return;
  }
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    next(ApiError.unauthorized("Your session has expired. Please sign in again."));
  }
}
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden("You do not have permission to perform this action."));
      return;
    }
    next();
  };
}

// src/routes/auth.routes.ts
var import_express = require("express");

// src/controllers/auth.controller.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);

// src/models/User.ts
var import_mongoose = require("mongoose");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var userSchema = new import_mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "staff"], default: "admin" }
  },
  { timestamps: true }
);
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return import_bcryptjs.default.compare(candidate, this.passwordHash);
};
var User = (0, import_mongoose.model)("User", userSchema, "users");

// src/utils/asyncHandler.ts
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// src/utils/ApiResponse.ts
function sendSuccess(res, data, message, statusCode = 200) {
  res.status(statusCode).json({ success: true, data, message });
}
function sendCreated(res, data, message) {
  sendSuccess(res, data, message, 201);
}

// src/controllers/auth.controller.ts
var COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1e3,
  path: "/"
};
function toSafeUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}
var login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password.");
  }
  const valid = await user.comparePassword(password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password.");
  }
  const token = signToken({ id: String(user._id), email: user.email, name: user.name, role: user.role });
  res.cookie(env.cookieName, token, COOKIE_OPTIONS);
  sendSuccess(res, { user: toSafeUser(user), token }, "Signed in successfully.");
});
var logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.cookieName, { ...COOKIE_OPTIONS, maxAge: void 0 });
  sendSuccess(res, null, "Signed out.");
});
var me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  sendSuccess(res, { user: req.user });
});
var register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists.");
  }
  const passwordHash = await import_bcryptjs2.default.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: "staff" });
  sendCreated(res, { user: toSafeUser(user) }, "User created.");
});

// src/middleware/validate.middleware.ts
function validate(schema, part = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".") || part;
        if (!errors[key]) errors[key] = issue.message;
      }
      next(ApiError.badRequest("Please fix the highlighted fields.", errors));
      return;
    }
    req[part] = result.data;
    next();
  };
}

// src/middleware/rateLimiter.middleware.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var apiLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." }
});
var authLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." }
});

// src/validators/auth.validator.ts
var import_zod = require("zod");
var loginSchema = import_zod.z.object({
  email: import_zod.z.string().trim().email("Enter a valid email address."),
  password: import_zod.z.string().min(1, "Password is required.")
});
var registerSchema = import_zod.z.object({
  name: import_zod.z.string().trim().min(2, "Name must be at least 2 characters."),
  email: import_zod.z.string().trim().email("Enter a valid email address."),
  password: import_zod.z.string().min(8, "Password must be at least 8 characters.")
});

// src/routes/auth.routes.ts
var router = (0, import_express.Router)();
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/register", requireAuth, requireRole("admin"), validate(registerSchema), register);
var auth_routes_default = router;

// src/routes/client.routes.ts
var import_express2 = require("express");

// src/models/Client.ts
var import_mongoose2 = require("mongoose");
var clientSchema = new import_mongoose2.Schema(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    service: { type: String, trim: true, default: "" },
    monthlyFee: { type: Number, required: true, min: 0 },
    defaultDueDay: { type: Number, required: true, min: 1, max: 28, default: 5 },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);
clientSchema.index({ name: "text", company: "text", email: "text" });
var Client = (0, import_mongoose2.model)("Client", clientSchema, "clients");

// src/models/Invoice.ts
var import_mongoose3 = require("mongoose");
var invoiceSchema = new import_mongoose3.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    client: { type: import_mongoose3.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    billingMonth: { type: String, required: true, index: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String, trim: true, default: "" },
    isArchived: { type: Boolean, default: false }
  },
  { timestamps: true }
);
invoiceSchema.index(
  { client: 1, billingMonth: 1 },
  { unique: true, partialFilterExpression: { isArchived: false } }
);
var Invoice = (0, import_mongoose3.model)("Invoice", invoiceSchema, "invoices");

// src/models/Counter.ts
var import_mongoose4 = require("mongoose");
var counterSchema = new import_mongoose4.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, required: true, default: 0 }
});
var Counter = (0, import_mongoose4.model)("Counter", counterSchema);
async function nextSequence(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}

// src/services/clientId.service.ts
async function generateClientId() {
  const seq = await nextSequence("client");
  return `CL-${String(seq).padStart(4, "0")}`;
}

// src/models/Payment.ts
var import_mongoose5 = require("mongoose");

// ../shared/types/enums.ts
var PAYMENT_MODES = ["Cash", "Bank Transfer", "UPI", "Card", "Cheque", "Other"];

// src/models/Payment.ts
var paymentSchema = new import_mongoose5.Schema(
  {
    invoice: { type: import_mongoose5.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    client: { type: import_mongoose5.Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, index: true },
    paymentMode: { type: String, enum: PAYMENT_MODES, required: true },
    transactionReference: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
    isVoided: { type: Boolean, default: false },
    createdBy: { type: import_mongoose5.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);
var Payment = (0, import_mongoose5.model)("Payment", paymentSchema, "payments");

// src/services/status.service.ts
function computeStatus(amountDue, amountPaid, dueDate, now = /* @__PURE__ */ new Date()) {
  const balance = roundCurrency(amountDue - amountPaid);
  if (balance <= 0) return "Paid";
  if (isPastDueDate(dueDate, now)) return "Overdue";
  if (amountPaid > 0) return "Partial";
  return "Pending";
}
function isPastDueDate(dueDate, now = /* @__PURE__ */ new Date()) {
  const dueEndOfDay = new Date(dueDate);
  dueEndOfDay.setUTCHours(23, 59, 59, 999);
  return now.getTime() > dueEndOfDay.getTime();
}
function daysUntilDue(dueDate, now = /* @__PURE__ */ new Date()) {
  const dueStartOfDay = new Date(dueDate);
  dueStartOfDay.setUTCHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  return Math.round((dueStartOfDay.getTime() - todayStart.getTime()) / (1e3 * 60 * 60 * 24));
}
function daysOverdue(dueDate, now = /* @__PURE__ */ new Date()) {
  return Math.max(0, -daysUntilDue(dueDate, now));
}
function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// src/services/client.service.ts
var EMPTY_SUMMARY = {
  totalOutstanding: 0,
  totalPaid: 0,
  totalBilled: 0,
  lastPaymentDate: null,
  currentMonthStatus: null
};
async function getClientFinancialSummaries(clientIds) {
  const summaries = /* @__PURE__ */ new Map();
  if (clientIds.length === 0) return summaries;
  const now = /* @__PURE__ */ new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [invoiceAgg, lastPayments] = await Promise.all([
    Invoice.aggregate([
      { $match: { client: { $in: clientIds }, isArchived: false } },
      {
        $group: {
          _id: "$client",
          totalBilled: { $sum: "$amountDue" },
          totalPaid: { $sum: "$amountPaid" },
          totalOutstanding: { $sum: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } }
        }
      }
    ]),
    Payment.aggregate([
      { $match: { client: { $in: clientIds }, isVoided: false } },
      { $sort: { paymentDate: -1 } },
      { $group: { _id: "$client", lastPaymentDate: { $first: "$paymentDate" } } }
    ])
  ]);
  const currentMonthInvoices = await Invoice.find({
    client: { $in: clientIds },
    billingMonth: currentMonth,
    isArchived: false
  }).select("client amountDue amountPaid dueDate");
  for (const id of clientIds) {
    summaries.set(id.toString(), { ...EMPTY_SUMMARY });
  }
  for (const row of invoiceAgg) {
    summaries.set(row._id.toString(), {
      ...summaries.get(row._id.toString()),
      totalBilled: roundCurrency(row.totalBilled),
      totalPaid: roundCurrency(row.totalPaid),
      totalOutstanding: roundCurrency(row.totalOutstanding)
    });
  }
  for (const row of lastPayments) {
    const key = row._id.toString();
    summaries.set(key, { ...summaries.get(key), lastPaymentDate: row.lastPaymentDate });
  }
  for (const inv of currentMonthInvoices) {
    const key = inv.client.toString();
    const status = computeStatus(inv.amountDue, inv.amountPaid, inv.dueDate, now);
    summaries.set(key, { ...summaries.get(key), currentMonthStatus: status });
  }
  return summaries;
}

// src/services/invoice.service.ts
var import_mongoose6 = __toESM(require("mongoose"), 1);
function withInvoiceComputedFields(invoice, now = /* @__PURE__ */ new Date()) {
  const balance = Math.max(0, roundCurrency(invoice.amountDue - invoice.amountPaid));
  const status = computeStatus(invoice.amountDue, invoice.amountPaid, new Date(invoice.dueDate), now);
  return { ...invoice, balance, status };
}
async function recalculateInvoice(invoiceId, session) {
  const [agg] = await Payment.aggregate([
    { $match: { invoice: new import_mongoose6.default.Types.ObjectId(invoiceId), isVoided: false } },
    { $group: { _id: "$invoice", total: { $sum: "$amount" } } }
  ]).session(session ?? null);
  const amountPaid = roundCurrency(agg?.total ?? 0);
  const invoice = await Invoice.findByIdAndUpdate(
    invoiceId,
    { $set: { amountPaid } },
    { new: true, session }
  );
  if (!invoice) {
    throw new ApiError(404, "Invoice not found while recalculating balance.");
  }
  return invoice;
}
function computeDueDate(billingMonth, billingDay) {
  const [year, month] = billingMonth.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(billingDay, daysInMonth);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}
function computeInvoiceDate(billingMonth) {
  const [year, month] = billingMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}
function startOfToday(now = /* @__PURE__ */ new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}
function statusMatchStage(status, now = /* @__PURE__ */ new Date()) {
  const today = startOfToday(now);
  switch (status) {
    case "Paid":
      return { balance: { $lte: 0 } };
    case "Overdue":
      return { balance: { $gt: 0 }, dueDate: { $lt: today } };
    case "Partial":
      return { balance: { $gt: 0 }, amountPaid: { $gt: 0 }, dueDate: { $gte: today } };
    case "Pending":
      return { balance: { $gt: 0 }, amountPaid: { $lte: 0 }, dueDate: { $gte: today } };
    default:
      return null;
  }
}
var SORT_STAGES = {
  newest: { invoiceDate: -1, createdAt: -1 },
  oldest: { invoiceDate: 1, createdAt: 1 },
  balanceHigh: { balance: -1 },
  balanceLow: { balance: 1 },
  dueDate: { dueDate: 1 }
};

// src/utils/pagination.ts
function getPagination(req, defaultPageSize = 20, maxPageSize = 200) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, Number(req.query.pageSize) || defaultPageSize));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
function buildPaginatedResult(items, total, params) {
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize))
  };
}

// src/controllers/client.controller.ts
var listClients = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);
  const search = req.query.search?.trim();
  const activeOnly = req.query.activeOnly === "true";
  const filter = {};
  if (activeOnly) filter.isActive = true;
  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { clientId: { $regex: escapeRegex(search), $options: "i" } },
      { company: { $regex: escapeRegex(search), $options: "i" } },
      { phone: { $regex: escapeRegex(search), $options: "i" } },
      { email: { $regex: escapeRegex(search), $options: "i" } }
    ];
  }
  const [clients, total] = await Promise.all([
    Client.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.pageSize),
    Client.countDocuments(filter)
  ]);
  const summaries = await getClientFinancialSummaries(clients.map((c) => c._id));
  const items = clients.map((client) => ({
    ...client.toObject(),
    ...summaries.get(client._id.toString())
  }));
  sendSuccess(res, buildPaginatedResult(items, total, pagination));
});
var getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw ApiError.notFound("Client not found.");
  const summaries = await getClientFinancialSummaries([client._id]);
  sendSuccess(res, { ...client.toObject(), ...summaries.get(client._id.toString()) });
});
var createClient = asyncHandler(async (req, res) => {
  const input = req.body;
  const clientId = await generateClientId();
  const client = await Client.create({ ...input, clientId });
  sendCreated(res, client, "Client added successfully.");
});
var updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!client) throw ApiError.notFound("Client not found.");
  sendSuccess(res, client, "Client updated successfully.");
});
var archiveClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!client) throw ApiError.notFound("Client not found.");
  sendSuccess(res, client, "Client archived.");
});
var reactivateClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!client) throw ApiError.notFound("Client not found.");
  sendSuccess(res, client, "Client reactivated.");
});
var getClientInvoices = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) throw ApiError.notFound("Client not found.");
  const filter = { client: client._id, isArchived: false };
  if (req.query.year) {
    filter.billingMonth = { $regex: `^${req.query.year}-` };
  }
  if (req.query.month) {
    filter.billingMonth = req.query.month;
  }
  const invoices = await Invoice.find(filter).sort({ billingMonth: -1 });
  sendSuccess(res, invoices.map((inv) => withInvoiceComputedFields(inv.toObject())));
});
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/validators/client.validator.ts
var import_zod2 = require("zod");
var clientInputSchema = import_zod2.z.object({
  name: import_zod2.z.string().trim().min(2, "Client name must be at least 2 characters."),
  company: import_zod2.z.string().trim().optional().default(""),
  phone: import_zod2.z.string().trim().optional().default("").refine((v) => v === "" || /^[0-9+\-\s()]{7,20}$/.test(v), "Enter a valid phone number."),
  email: import_zod2.z.string().trim().optional().default("").refine((v) => v === "" || import_zod2.z.string().email().safeParse(v).success, "Enter a valid email address."),
  service: import_zod2.z.string().trim().optional().default(""),
  monthlyFee: import_zod2.z.coerce.number().min(0, "Monthly fee cannot be negative."),
  defaultDueDay: import_zod2.z.coerce.number().int().min(1).max(28).default(5),
  notes: import_zod2.z.string().trim().optional().default("")
});
var clientUpdateSchema = clientInputSchema.partial().extend({
  isActive: import_zod2.z.boolean().optional()
});

// src/routes/client.routes.ts
var router2 = (0, import_express2.Router)();
router2.get("/", listClients);
router2.post("/", validate(clientInputSchema), createClient);
router2.get("/:id", getClient);
router2.put("/:id", validate(clientUpdateSchema), updateClient);
router2.delete("/:id", archiveClient);
router2.post("/:id/reactivate", reactivateClient);
router2.get("/:id/invoices", getClientInvoices);
var client_routes_default = router2;

// src/routes/invoice.routes.ts
var import_express3 = require("express");

// src/controllers/invoice.controller.ts
var import_mongoose7 = __toESM(require("mongoose"), 1);

// src/services/invoiceNumber.service.ts
async function generateInvoiceNumber(date = /* @__PURE__ */ new Date()) {
  const year = date.getFullYear();
  const seq = await nextSequence(`invoice-${year}`);
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}

// src/controllers/invoice.controller.ts
var withComputedFields = withInvoiceComputedFields;
var listInvoices = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);
  const now = /* @__PURE__ */ new Date();
  const match = { isArchived: false };
  if (req.query.clientId) {
    match.client = new import_mongoose7.default.Types.ObjectId(req.query.clientId);
  }
  if (req.query.billingMonth) {
    match.billingMonth = req.query.billingMonth;
  }
  if (req.query.dateFrom || req.query.dateTo) {
    match.dueDate = {
      ...req.query.dateFrom ? { $gte: new Date(req.query.dateFrom) } : {},
      ...req.query.dateTo ? { $lte: new Date(req.query.dateTo) } : {}
    };
  }
  const pipeline = [
    { $match: match },
    { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } }
  ];
  const status = req.query.status;
  if (status && status !== "All") {
    const statusStage = statusMatchStage(status, now);
    if (statusStage) pipeline.push({ $match: statusStage });
  }
  pipeline.push({
    $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" }
  });
  pipeline.push({ $unwind: "$client" });
  const search = req.query.search?.trim();
  if (search) {
    const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    pipeline.push({
      $match: {
        $or: [
          { invoiceNumber: rx },
          { "client.name": rx },
          { "client.clientId": rx },
          { "client.company": rx }
        ]
      }
    });
  }
  const sortKey = req.query.sort || "newest";
  pipeline.push({ $sort: SORT_STAGES[sortKey] ?? SORT_STAGES.newest });
  pipeline.push({
    $facet: {
      items: [{ $skip: pagination.skip }, { $limit: pagination.pageSize }],
      totalCount: [{ $count: "count" }]
    }
  });
  const [result] = await Invoice.aggregate(pipeline);
  const items = (result?.items ?? []).map((inv) => withComputedFields(inv, now));
  const total = result?.totalCount?.[0]?.count ?? 0;
  sendSuccess(res, buildPaginatedResult(items, total, pagination));
});
var getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate(
    "client",
    "clientId name company phone email service"
  );
  if (!invoice) throw ApiError.notFound("Invoice not found.");
  sendSuccess(res, withComputedFields(invoice.toObject()));
});
var createInvoice = asyncHandler(async (req, res) => {
  const input = req.body;
  const client = await Client.findById(input.clientId);
  if (!client) throw ApiError.badRequest("Selected client does not exist.");
  const existing = await Invoice.findOne({
    client: client._id,
    billingMonth: input.billingMonth,
    isArchived: false
  });
  if (existing) {
    throw ApiError.conflict(
      `An invoice for ${client.name} already exists for ${input.billingMonth}. Edit the existing invoice instead.`
    );
  }
  const invoiceDate = input.invoiceDate ?? computeInvoiceDate(input.billingMonth);
  const dueDate = input.dueDate ?? computeDueDate(input.billingMonth, client.defaultDueDay);
  const invoiceNumber = await generateInvoiceNumber(invoiceDate);
  const invoice = await Invoice.create({
    invoiceNumber,
    client: client._id,
    billingMonth: input.billingMonth,
    invoiceDate,
    dueDate,
    amountDue: input.amountDue,
    amountPaid: 0,
    notes: input.notes
  });
  sendCreated(res, withComputedFields(invoice.toObject()), "Invoice created successfully.");
});
var updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!invoice) throw ApiError.notFound("Invoice not found.");
  sendSuccess(res, withComputedFields(invoice.toObject()), "Invoice updated successfully.");
});
var archiveInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
  if (!invoice) throw ApiError.notFound("Invoice not found.");
  sendSuccess(res, invoice, "Invoice archived.");
});
var getInvoicePayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ invoice: req.params.id, isVoided: false }).sort({ paymentDate: -1 });
  sendSuccess(res, payments);
});
var recalculateInvoiceBalance = asyncHandler(async (req, res) => {
  const invoice = await recalculateInvoice(req.params.id);
  sendSuccess(res, withComputedFields(invoice.toObject()));
});

// src/validators/invoice.validator.ts
var import_zod3 = require("zod");
var billingMonthSchema = import_zod3.z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing month must be in YYYY-MM format.");
var invoiceInputSchema = import_zod3.z.object({
  clientId: import_zod3.z.string().min(1, "Client is required."),
  billingMonth: billingMonthSchema,
  invoiceDate: import_zod3.z.coerce.date().optional(),
  dueDate: import_zod3.z.coerce.date().optional(),
  amountDue: import_zod3.z.coerce.number().positive("Amount due must be greater than zero."),
  notes: import_zod3.z.string().trim().optional().default("")
});
var invoiceUpdateSchema = import_zod3.z.object({
  dueDate: import_zod3.z.coerce.date().optional(),
  amountDue: import_zod3.z.coerce.number().positive("Amount due must be greater than zero.").optional(),
  notes: import_zod3.z.string().trim().optional()
});
var invoiceQuerySchema = import_zod3.z.object({
  page: import_zod3.z.coerce.number().int().min(1).optional(),
  pageSize: import_zod3.z.coerce.number().int().min(1).max(200).optional(),
  status: import_zod3.z.enum(["Paid", "Partial", "Pending", "Overdue", "All"]).optional(),
  clientId: import_zod3.z.string().optional(),
  search: import_zod3.z.string().optional(),
  billingMonth: import_zod3.z.string().optional(),
  dateFrom: import_zod3.z.coerce.date().optional(),
  dateTo: import_zod3.z.coerce.date().optional(),
  sort: import_zod3.z.enum(["newest", "oldest", "balanceHigh", "balanceLow", "dueDate"]).optional()
});

// src/routes/invoice.routes.ts
var router3 = (0, import_express3.Router)();
router3.get("/", listInvoices);
router3.post("/", validate(invoiceInputSchema), createInvoice);
router3.get("/:id", getInvoice);
router3.put("/:id", validate(invoiceUpdateSchema), updateInvoice);
router3.delete("/:id", archiveInvoice);
router3.get("/:id/payments", getInvoicePayments);
router3.post("/:id/recalculate", recalculateInvoiceBalance);
var invoice_routes_default = router3;

// src/routes/payment.routes.ts
var import_express4 = require("express");

// src/controllers/payment.controller.ts
var import_mongoose9 = __toESM(require("mongoose"), 1);

// src/services/payment.service.ts
var import_mongoose8 = __toESM(require("mongoose"), 1);
async function recordPayment(input, createdBy) {
  const session = await import_mongoose8.default.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(input.invoiceId).session(session);
      if (!invoice || invoice.isArchived) {
        throw ApiError.notFound("Invoice not found.");
      }
      const remainingBalance = roundCurrency(invoice.amountDue - invoice.amountPaid);
      if (roundCurrency(input.amount) > remainingBalance) {
        throw ApiError.badRequest(
          `Payment amount cannot exceed the outstanding balance of \u20B9${remainingBalance.toLocaleString("en-IN")}.`,
          { amount: "Amount exceeds the outstanding balance for this invoice." }
        );
      }
      const [payment] = await Payment.create(
        [
          {
            invoice: invoice._id,
            client: invoice.client,
            amount: input.amount,
            paymentDate: input.paymentDate,
            paymentMode: input.paymentMode,
            transactionReference: input.transactionReference,
            remarks: input.remarks,
            createdBy: createdBy ? new import_mongoose8.default.Types.ObjectId(createdBy) : void 0
          }
        ],
        { session }
      );
      const updatedInvoice = await recalculateInvoice(invoice._id, session);
      result = { payment, invoice: updatedInvoice };
    });
    return result;
  } finally {
    await session.endSession();
  }
}
async function voidPayment(paymentId) {
  const session = await import_mongoose8.default.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment || payment.isVoided) {
        throw ApiError.notFound("Payment not found.");
      }
      payment.isVoided = true;
      await payment.save({ session });
      const invoice = await recalculateInvoice(payment.invoice, session);
      result = { payment, invoice };
    });
    return result;
  } finally {
    await session.endSession();
  }
}
async function updatePayment(paymentId, updates) {
  const session = await import_mongoose8.default.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment || payment.isVoided) {
        throw ApiError.notFound("Payment not found.");
      }
      const invoice = await Invoice.findById(payment.invoice).session(session);
      if (!invoice) throw ApiError.notFound("Invoice not found.");
      if (updates.amount !== void 0) {
        const balanceExcludingThisPayment = roundCurrency(
          invoice.amountDue - invoice.amountPaid + payment.amount
        );
        if (roundCurrency(updates.amount) > balanceExcludingThisPayment) {
          throw ApiError.badRequest(
            `Payment amount cannot exceed the outstanding balance of \u20B9${balanceExcludingThisPayment.toLocaleString("en-IN")}.`,
            { amount: "Amount exceeds the outstanding balance for this invoice." }
          );
        }
        payment.amount = updates.amount;
      }
      if (updates.paymentDate !== void 0) payment.paymentDate = updates.paymentDate;
      if (updates.paymentMode !== void 0) payment.paymentMode = updates.paymentMode;
      if (updates.transactionReference !== void 0) payment.transactionReference = updates.transactionReference;
      if (updates.remarks !== void 0) payment.remarks = updates.remarks;
      await payment.save({ session });
      const updatedInvoice = await recalculateInvoice(invoice._id, session);
      result = { payment, invoice: updatedInvoice };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

// src/controllers/payment.controller.ts
var createPayment = asyncHandler(async (req, res) => {
  const input = req.body;
  const { payment, invoice } = await recordPayment(input, req.user?.id);
  sendCreated(res, { payment, invoice }, "Payment recorded successfully.");
});
var listPayments = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);
  const filter = { isVoided: false };
  if (req.query.clientId) filter.client = new import_mongoose9.default.Types.ObjectId(req.query.clientId);
  if (req.query.invoiceId) filter.invoice = new import_mongoose9.default.Types.ObjectId(req.query.invoiceId);
  if (req.query.paymentMode) filter.paymentMode = req.query.paymentMode;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.paymentDate = {
      ...req.query.dateFrom ? { $gte: new Date(req.query.dateFrom) } : {},
      ...req.query.dateTo ? { $lte: new Date(req.query.dateTo) } : {}
    };
  }
  const [payments, total] = await Promise.all([
    Payment.find(filter).populate("invoice", "invoiceNumber billingMonth amountDue amountPaid dueDate").populate("client", "clientId name company").sort({ paymentDate: -1 }).skip(pagination.skip).limit(pagination.pageSize),
    Payment.countDocuments(filter)
  ]);
  sendSuccess(res, buildPaginatedResult(payments, total, pagination));
});
var getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("invoice", "invoiceNumber billingMonth amountDue amountPaid dueDate").populate("client", "clientId name company");
  if (!payment) throw ApiError.notFound("Payment not found.");
  sendSuccess(res, payment);
});
var editPayment = asyncHandler(async (req, res) => {
  const { payment, invoice } = await updatePayment(req.params.id, req.body);
  sendSuccess(res, { payment, invoice }, "Payment updated successfully.");
});
var deletePayment = asyncHandler(async (req, res) => {
  const { payment, invoice } = await voidPayment(req.params.id);
  sendSuccess(res, { payment, invoice }, "Payment voided.");
});

// src/validators/payment.validator.ts
var import_zod4 = require("zod");
var paymentInputSchema = import_zod4.z.object({
  invoiceId: import_zod4.z.string().min(1, "Invoice is required."),
  amount: import_zod4.z.coerce.number().positive("Amount must be greater than zero."),
  paymentDate: import_zod4.z.coerce.date({ message: "Enter a valid payment date." }),
  paymentMode: import_zod4.z.enum(PAYMENT_MODES),
  transactionReference: import_zod4.z.string().trim().optional().default(""),
  remarks: import_zod4.z.string().trim().optional().default("")
});
var paymentUpdateSchema = paymentInputSchema.partial().omit({ invoiceId: true });

// src/routes/payment.routes.ts
var router4 = (0, import_express4.Router)();
router4.get("/", listPayments);
router4.post("/", validate(paymentInputSchema), createPayment);
router4.get("/:id", getPayment);
router4.put("/:id", validate(paymentUpdateSchema), editPayment);
router4.delete("/:id", deletePayment);
var payment_routes_default = router4;

// src/routes/dashboard.routes.ts
var import_express5 = require("express");

// src/services/dashboard.service.ts
function pad(n) {
  return String(n).padStart(2, "0");
}
function monthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
function periodMatch(filter, now) {
  const currentKey = monthKey(now);
  switch (filter.period) {
    case "currentMonth":
      return { billingMonth: currentKey };
    case "previousMonth": {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { billingMonth: monthKey(prev) };
    }
    case "currentYear":
      return { billingMonth: { $regex: `^${now.getFullYear()}-` } };
    case "custom":
      return {
        invoiceDate: {
          ...filter.dateFrom ? { $gte: filter.dateFrom } : {},
          ...filter.dateTo ? { $lte: filter.dateTo } : {}
        }
      };
    default:
      return {};
  }
}
async function getDashboard(filter) {
  const now = /* @__PURE__ */ new Date();
  const today = startOfToday(now);
  const match = { isArchived: false, ...periodMatch(filter, now) };
  const [clientCounts, statusAgg, monthlyAgg, topOutstandingAgg, dueSoonAgg] = await Promise.all([
    Client.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } } } }
    ]),
    Invoice.aggregate([
      { $match: match },
      { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
      {
        $addFields: {
          computedStatus: {
            $switch: {
              branches: [
                { case: { $lte: ["$balance", 0] }, then: "Paid" },
                { case: { $lt: ["$dueDate", today] }, then: "Overdue" },
                { case: { $gt: ["$amountPaid", 0] }, then: "Partial" }
              ],
              default: "Pending"
            }
          }
        }
      },
      {
        $group: {
          _id: "$computedStatus",
          count: { $sum: 1 },
          amount: { $sum: "$balance" },
          amountDue: { $sum: "$amountDue" },
          amountPaid: { $sum: "$amountPaid" }
        }
      }
    ]),
    Invoice.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: "$billingMonth", expected: { $sum: "$amountDue" }, collected: { $sum: "$amountPaid" } } },
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]),
    Invoice.aggregate([
      { $match: { isArchived: false } },
      { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
      { $match: { balance: { $gt: 0 } } },
      { $group: { _id: "$client", outstanding: { $sum: "$balance" } } },
      { $sort: { outstanding: -1 } },
      { $limit: 5 },
      { $lookup: { from: "clients", localField: "_id", foreignField: "_id", as: "client" } },
      { $unwind: "$client" }
    ]),
    Invoice.aggregate([
      { $match: { isArchived: false } },
      { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
      {
        $match: {
          balance: { $gt: 0 },
          dueDate: { $gte: today, $lte: new Date(today.getTime() + 7 * 864e5) }
        }
      },
      { $count: "count" }
    ])
  ]);
  const totalClients = clientCounts[0]?.total ?? 0;
  const activeClients = clientCounts[0]?.active ?? 0;
  const statusMap = /* @__PURE__ */ new Map();
  for (const row of statusAgg) {
    statusMap.set(row._id, row);
  }
  const expectedRevenue = roundCurrency(
    ["Paid", "Partial", "Pending", "Overdue"].reduce((sum, s) => sum + (statusMap.get(s)?.amountDue ?? 0), 0)
  );
  const collectedRevenue = roundCurrency(
    ["Paid", "Partial", "Pending", "Overdue"].reduce((sum, s) => sum + (statusMap.get(s)?.amountPaid ?? 0), 0)
  );
  const pendingAmount = roundCurrency(statusMap.get("Pending")?.amount ?? 0);
  const overdueAmount = roundCurrency(statusMap.get("Overdue")?.amount ?? 0);
  const partialAmount = roundCurrency(statusMap.get("Partial")?.amount ?? 0);
  const outstandingBalance = roundCurrency(pendingAmount + overdueAmount + partialAmount);
  const collectionRate = expectedRevenue > 0 ? roundCurrency(collectedRevenue / expectedRevenue * 100) : 0;
  const summary = {
    totalClients,
    activeClients,
    expectedRevenue,
    collectedRevenue,
    pendingAmount,
    overdueAmount,
    partialAmount,
    outstandingBalance,
    collectionRate,
    dueSoonCount: dueSoonAgg[0]?.count ?? 0
  };
  const monthlyRevenue = monthlyAgg.map((row) => ({
    month: row._id,
    label: formatMonthLabel(row._id),
    expected: roundCurrency(row.expected),
    collected: roundCurrency(row.collected)
  })).reverse();
  const statusBreakdown = ["Paid", "Partial", "Pending", "Overdue"].map((status) => ({
    status,
    count: statusMap.get(status)?.count ?? 0,
    amount: roundCurrency(
      status === "Paid" ? statusMap.get(status)?.amountPaid ?? 0 : statusMap.get(status)?.amount ?? 0
    )
  }));
  const topOutstanding = topOutstandingAgg.map((row) => ({
    id: row.client._id.toString(),
    clientId: row.client.clientId,
    name: row.client.name,
    company: row.client.company,
    outstanding: roundCurrency(row.outstanding)
  }));
  return { summary, monthlyRevenue, statusBreakdown, topOutstanding };
}
function formatMonthLabel(billingMonth) {
  const [year, month] = billingMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
function parseDashboardFilter(query) {
  const period = query.period ?? "currentMonth";
  return {
    period,
    dateFrom: query.dateFrom ? new Date(query.dateFrom) : void 0,
    dateTo: query.dateTo ? new Date(query.dateTo) : void 0
  };
}

// src/controllers/dashboard.controller.ts
var getDashboardData = asyncHandler(async (req, res) => {
  const filter = parseDashboardFilter(req.query);
  const data = await getDashboard(filter);
  sendSuccess(res, data);
});

// src/routes/dashboard.routes.ts
var router5 = (0, import_express5.Router)();
router5.get("/", getDashboardData);
var dashboard_routes_default = router5;

// src/routes/overdue.routes.ts
var import_express6 = require("express");

// src/controllers/overdue.controller.ts
var listOverdue = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);
  const now = /* @__PURE__ */ new Date();
  const today = startOfToday(now);
  const pipeline = [
    { $match: { isArchived: false } },
    { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
    { $match: { balance: { $gt: 0 }, dueDate: { $lt: today } } },
    { $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" } },
    { $unwind: "$client" },
    { $sort: { dueDate: 1 } },
    {
      $facet: {
        items: [{ $skip: pagination.skip }, { $limit: pagination.pageSize }],
        totalCount: [{ $count: "count" }]
      }
    }
  ];
  const [result] = await Invoice.aggregate(pipeline);
  const items = (result?.items ?? []).map((inv) => ({
    ...inv,
    daysOverdue: daysOverdue(new Date(inv.dueDate), now)
  }));
  const total = result?.totalCount?.[0]?.count ?? 0;
  sendSuccess(res, buildPaginatedResult(items, total, pagination));
});

// src/routes/overdue.routes.ts
var router6 = (0, import_express6.Router)();
router6.get("/", listOverdue);
var overdue_routes_default = router6;

// src/routes/upcoming.routes.ts
var import_express7 = require("express");

// src/controllers/upcoming.controller.ts
var listUpcoming = asyncHandler(async (req, res) => {
  const now = /* @__PURE__ */ new Date();
  const today = startOfToday(now);
  const withinDays = Math.min(90, Math.max(1, Number(req.query.days) || 30));
  const horizon = new Date(today.getTime() + withinDays * 864e5);
  const pipeline = [
    { $match: { isArchived: false } },
    { $addFields: { balance: { $max: [{ $subtract: ["$amountDue", "$amountPaid"] }, 0] } } },
    { $match: { balance: { $gt: 0 }, dueDate: { $gte: today, $lte: horizon } } },
    { $lookup: { from: "clients", localField: "client", foreignField: "_id", as: "client" } },
    { $unwind: "$client" },
    { $sort: { dueDate: 1 } }
  ];
  const invoices = await Invoice.aggregate(pipeline);
  const items = invoices.map((inv) => ({ ...inv, daysRemaining: daysUntilDue(new Date(inv.dueDate), now) }));
  sendSuccess(res, items);
});

// src/routes/upcoming.routes.ts
var router7 = (0, import_express7.Router)();
router7.get("/", listUpcoming);
var upcoming_routes_default = router7;

// src/routes/report.routes.ts
var import_express8 = require("express");

// src/controllers/report.controller.ts
function dateRangeFilter(req, field) {
  if (!req.query.dateFrom && !req.query.dateTo) return {};
  return {
    [field]: {
      ...req.query.dateFrom ? { $gte: new Date(req.query.dateFrom) } : {},
      ...req.query.dateTo ? { $lte: new Date(req.query.dateTo) } : {}
    }
  };
}
var monthlyCollectionReport = asyncHandler(async (req, res) => {
  const rows = await Invoice.aggregate([
    { $match: { isArchived: false, ...dateRangeFilter(req, "invoiceDate") } },
    {
      $group: {
        _id: "$billingMonth",
        expected: { $sum: "$amountDue" },
        collected: { $sum: "$amountPaid" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const data = rows.map((row) => {
    const expected = roundCurrency(row.expected);
    const collected = roundCurrency(row.collected);
    return {
      month: row._id,
      expected,
      collected,
      outstanding: roundCurrency(expected - collected),
      collectionRate: expected > 0 ? roundCurrency(collected / expected * 100) : 0
    };
  });
  sendSuccess(res, data);
});
var clientWiseReport = asyncHandler(async (req, res) => {
  const rows = await Invoice.aggregate([
    { $match: { isArchived: false, ...dateRangeFilter(req, "invoiceDate") } },
    {
      $group: {
        _id: "$client",
        totalBilled: { $sum: "$amountDue" },
        totalPaid: { $sum: "$amountPaid" }
      }
    },
    { $lookup: { from: "clients", localField: "_id", foreignField: "_id", as: "client" } },
    { $unwind: "$client" },
    { $sort: { totalBilled: -1 } }
  ]);
  const data = rows.map((row) => ({
    clientId: row.client.clientId,
    name: row.client.name,
    company: row.client.company,
    totalBilled: roundCurrency(row.totalBilled),
    totalPaid: roundCurrency(row.totalPaid),
    outstanding: roundCurrency(row.totalBilled - row.totalPaid)
  }));
  sendSuccess(res, data);
});
var paymentModeReport = asyncHandler(async (req, res) => {
  const rows = await Payment.aggregate([
    { $match: { isVoided: false, ...dateRangeFilter(req, "paymentDate") } },
    { $group: { _id: "$paymentMode", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);
  const data = rows.map((row) => ({
    paymentMode: row._id,
    total: roundCurrency(row.total),
    count: row.count
  }));
  sendSuccess(res, data);
});

// src/routes/report.routes.ts
var router8 = (0, import_express8.Router)();
router8.get("/monthly", monthlyCollectionReport);
router8.get("/clients", clientWiseReport);
router8.get("/payment-modes", paymentModeReport);
var report_routes_default = router8;

// src/routes/import.routes.ts
var import_express9 = require("express");

// src/services/excelImport.service.ts
var XLSX = __toESM(require("xlsx"), 1);
var import_mongoose10 = __toESM(require("mongoose"), 1);

// src/utils/excelParsing.ts
var MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
];
function excelSerialToDate(serial) {
  const utcMs = Math.round((serial - 25569) * 86400 * 1e3);
  return new Date(utcMs);
}
function parseCell(value) {
  if (value === null || value === void 0) return "";
  return String(value).trim();
}
function parseCurrency(value) {
  const str = parseCell(value).replace(/[₹,\s]/g, "");
  if (str === "") return null;
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}
function parseDateCell(value) {
  if (value === null || value === void 0 || value === "") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const date = excelSerialToDate(value);
    return isNaN(date.getTime()) ? null : date;
  }
  const str = parseCell(value);
  const slashMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashMatch) {
    const [, d, m, y] = slashMatch;
    const year = y.length === 2 ? Number(y) + 2e3 : Number(y);
    const date = new Date(Date.UTC(year, Number(m) - 1, Number(d)));
    if (!isNaN(date.getTime())) return date;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}
function parseBillingMonth(value) {
  if (value === null || value === void 0 || value === "") return null;
  if (value instanceof Date) return toMonthKey(value);
  if (typeof value === "number") return toMonthKey(excelSerialToDate(value));
  const str = parseCell(value);
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}`;
  const slashMatch = str.match(/^(\d{1,2})[/-](\d{4})$/);
  if (slashMatch) return `${slashMatch[2]}-${slashMatch[1].padStart(2, "0")}`;
  const wordMatch = str.match(/^([A-Za-z]+)[\s-]+(\d{4})$/);
  if (wordMatch) {
    const monthIndex = MONTH_NAMES.findIndex((m) => m.startsWith(wordMatch[1].toLowerCase().slice(0, 3)));
    if (monthIndex >= 0) return `${wordMatch[2]}-${String(monthIndex + 1).padStart(2, "0")}`;
  }
  const asDate = parseDateCell(value);
  if (asDate) return toMonthKey(asDate);
  return null;
}
function toMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// src/services/excelImport.service.ts
var EXPECTED_COLUMNS = [
  "Client ID",
  "Client Name",
  "Company/Institute",
  "Contact Number",
  "Email",
  "Service/Course",
  "Monthly Fee (\u20B9)",
  "Billing Month",
  "Invoice No.",
  "Payment Due Date",
  "Payment Date",
  "Payment Status",
  "Payment Mode",
  "Amount Paid (\u20B9)",
  "Balance (\u20B9)",
  "Remarks"
];
async function readWorkbookRows(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { headers, rows };
}
function normalizeHeader(header) {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}
function isRowBlank(raw) {
  return EXPECTED_COLUMNS.every((col) => parseCell(raw[col]) === "");
}
function checkColumns(headers) {
  const normalizedActual = new Set(headers.map(normalizeHeader));
  const missing = EXPECTED_COLUMNS.filter((col) => !normalizedActual.has(normalizeHeader(col)));
  return { valid: missing.length === 0, missing };
}
async function parseAndValidate(buffer) {
  const { headers, rows } = await readWorkbookRows(buffer);
  const { valid: columnsValid, missing: missingColumns } = checkColumns(headers);
  if (!columnsValid) {
    return { columnsValid, missingColumns, rows: [] };
  }
  const existingInvoiceNumbers = new Set(
    (await Invoice.find({ isArchived: false }).select("invoiceNumber").lean()).map((i) => i.invoiceNumber)
  );
  const existingClientMonths = new Set(
    (await Invoice.find({ isArchived: false }).select("client billingMonth").lean()).map(
      (i) => `${i.client.toString()}|${i.billingMonth}`
    )
  );
  const existingClients = await Client.find().select("clientId name company email").lean();
  const clientByLegacyId = new Map(existingClients.filter((c) => c.clientId).map((c) => [c.clientId, c]));
  const clientByNameKey = new Map(existingClients.map((c) => [nameKey(c.name, c.company, c.email), c]));
  const seenInBatch = /* @__PURE__ */ new Set();
  const seenInvoiceNumbers = /* @__PURE__ */ new Set();
  const results = rows.map((raw, index) => ({ raw, rowNumber: index + 2 })).filter(({ raw }) => !isRowBlank(raw)).map(({ raw, rowNumber }) => {
    const errors = [];
    const clientName = parseCell(raw["Client Name"]);
    const company = parseCell(raw["Company/Institute"]);
    const phone = parseCell(raw["Contact Number"]);
    const email = parseCell(raw["Email"]);
    const service = parseCell(raw["Service/Course"]);
    const rawClientId = parseCell(raw["Client ID"]);
    const invoiceNoRaw = parseCell(raw["Invoice No."]);
    const remarks = parseCell(raw["Remarks"]);
    if (!clientName) errors.push("Client Name is required.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email is not a valid address.");
    const monthlyFee = parseCurrency(raw["Monthly Fee (\u20B9)"]);
    if (monthlyFee === null) errors.push("Monthly Fee (\u20B9) is missing or not a valid number.");
    else if (monthlyFee < 0) errors.push("Monthly Fee (\u20B9) cannot be negative.");
    const billingMonth = parseBillingMonth(raw["Billing Month"]);
    if (!billingMonth) errors.push('Billing Month could not be parsed (expected e.g. "2026-09" or "September 2026").');
    const dueDate = parseDateCell(raw["Payment Due Date"]);
    if (raw["Payment Due Date"] && !dueDate) errors.push("Payment Due Date is not a valid date.");
    const paymentDate = parseDateCell(raw["Payment Date"]);
    if (raw["Payment Date"] && !paymentDate) errors.push("Payment Date is not a valid date.");
    let amountPaid = parseCurrency(raw["Amount Paid (\u20B9)"]);
    if (amountPaid === null) amountPaid = 0;
    else if (amountPaid < 0) errors.push("Amount Paid (\u20B9) cannot be negative.");
    const paymentModeRaw = parseCell(raw["Payment Mode"]);
    let paymentMode;
    if (amountPaid > 0) {
      if (!paymentDate) errors.push("Payment Date is required when Amount Paid is greater than zero.");
      const match = PAYMENT_MODES.find((m) => m.toLowerCase() === paymentModeRaw.toLowerCase());
      if (!match) {
        errors.push(`Payment Mode "${paymentModeRaw || "(blank)"}" must be one of: ${PAYMENT_MODES.join(", ")}.`);
      } else {
        paymentMode = match;
      }
    }
    if (monthlyFee !== null && amountPaid > monthlyFee) {
      errors.push("Amount Paid (\u20B9) cannot exceed Monthly Fee (\u20B9).");
    }
    if (errors.length > 0) {
      return { rowNumber, status: "error", errors, raw };
    }
    const groupKey = rawClientId ? `id:${rawClientId}` : `name:${nameKey(clientName, company, email)}`;
    const existingClient = rawClientId ? clientByLegacyId.get(rawClientId) : clientByNameKey.get(nameKey(clientName, company, email));
    if (invoiceNoRaw && (existingInvoiceNumbers.has(invoiceNoRaw) || seenInvoiceNumbers.has(invoiceNoRaw))) {
      return { rowNumber, status: "duplicate", errors: [`Invoice number ${invoiceNoRaw} already exists.`], raw };
    }
    const clientDedupeKey = existingClient ? existingClient._id.toString() : groupKey;
    const monthDedupeKey = `${clientDedupeKey}|${billingMonth}`;
    if (existingClient && existingClientMonths.has(`${existingClient._id.toString()}|${billingMonth}`) || seenInBatch.has(monthDedupeKey)) {
      return {
        rowNumber,
        status: "duplicate",
        errors: [`${clientName} already has an invoice for ${billingMonth}.`],
        raw
      };
    }
    seenInBatch.add(monthDedupeKey);
    if (invoiceNoRaw) seenInvoiceNumbers.add(invoiceNoRaw);
    return {
      rowNumber,
      status: "valid",
      errors: [],
      raw,
      resolved: {
        clientGroupKey: groupKey,
        clientId: existingClient?.clientId,
        clientName,
        company,
        phone,
        email,
        service,
        monthlyFee,
        billingMonth,
        invoiceNumber: invoiceNoRaw || void 0,
        dueDate: dueDate ?? void 0,
        amountDue: monthlyFee,
        amountPaid,
        paymentDate: paymentDate ?? void 0,
        paymentMode,
        remarks
      }
    };
  });
  return { columnsValid, missingColumns, rows: results };
}
function nameKey(name, company, email) {
  return `${name.trim().toLowerCase()}|${company.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
}
async function commitImport(parseResult) {
  const validRows = parseResult.rows.filter((r) => r.status === "valid" && r.resolved);
  const summary = {
    imported: 0,
    skipped: parseResult.rows.length - validRows.length,
    errors: parseResult.rows.filter((r) => r.status === "error").length,
    clientsCreated: 0
  };
  if (validRows.length === 0) return summary;
  const session = await import_mongoose10.default.startSession();
  try {
    await session.withTransaction(async () => {
      let imported = 0;
      let clientsCreated = 0;
      const clientCache = /* @__PURE__ */ new Map();
      for (const row of validRows) {
        const r = row.resolved;
        let clientObjectId = clientCache.get(r.clientGroupKey);
        if (!clientObjectId) {
          let clientDoc = r.clientId ? await Client.findOne({ clientId: r.clientId }).session(session) : await Client.findOne({
            name: r.clientName,
            company: r.company,
            email: r.email
          }).session(session);
          if (!clientDoc) {
            const newClientId = await generateClientId();
            [clientDoc] = await Client.create(
              [
                {
                  clientId: newClientId,
                  name: r.clientName,
                  company: r.company,
                  phone: r.phone,
                  email: r.email,
                  service: r.service,
                  monthlyFee: r.monthlyFee,
                  defaultDueDay: 5,
                  isActive: true
                }
              ],
              { session }
            );
            clientsCreated += 1;
          }
          clientObjectId = clientDoc._id;
          clientCache.set(r.clientGroupKey, clientObjectId);
        }
        const invoiceDate = computeInvoiceDate(r.billingMonth);
        const dueDate = r.dueDate ?? computeDueDate(r.billingMonth, 5);
        const invoiceNumber = r.invoiceNumber ?? await generateInvoiceNumber(invoiceDate);
        const [invoice] = await Invoice.create(
          [
            {
              invoiceNumber,
              client: clientObjectId,
              billingMonth: r.billingMonth,
              invoiceDate,
              dueDate,
              amountDue: r.amountDue,
              amountPaid: 0,
              notes: r.remarks
            }
          ],
          { session }
        );
        if (r.amountPaid > 0 && r.paymentDate && r.paymentMode) {
          await Payment.create(
            [
              {
                invoice: invoice._id,
                client: clientObjectId,
                amount: r.amountPaid,
                paymentDate: r.paymentDate,
                paymentMode: r.paymentMode,
                remarks: r.remarks
              }
            ],
            { session }
          );
          await recalculateInvoice(invoice._id, session);
        }
        imported += 1;
      }
      summary.imported = imported;
      summary.clientsCreated = clientsCreated;
    });
  } finally {
    await session.endSession();
  }
  return summary;
}

// src/controllers/import.controller.ts
var previewImport = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("Please choose an Excel file to import.");
  const result = await parseAndValidate(req.file.buffer);
  if (!result.columnsValid) {
    throw ApiError.badRequest(
      `The uploaded file is missing required columns: ${result.missingColumns.join(", ")}.`
    );
  }
  const valid = result.rows.filter((r) => r.status === "valid").length;
  const duplicates = result.rows.filter((r) => r.status === "duplicate").length;
  const errors = result.rows.filter((r) => r.status === "error").length;
  sendSuccess(res, {
    totalRows: result.rows.length,
    valid,
    duplicates,
    errors,
    rows: result.rows
  });
});
var confirmImport = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("Please choose an Excel file to import.");
  const result = await parseAndValidate(req.file.buffer);
  if (!result.columnsValid) {
    throw ApiError.badRequest(
      `The uploaded file is missing required columns: ${result.missingColumns.join(", ")}.`
    );
  }
  const summary = await commitImport(result);
  sendSuccess(
    res,
    summary,
    `Imported ${summary.imported} record(s). Skipped ${summary.skipped}. ${summary.errors} row(s) had errors.`
  );
});

// src/middleware/upload.middleware.ts
var import_multer = __toESM(require("multer"), 1);
var ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
]);
var excelUpload = (0, import_multer.default)({
  storage: import_multer.default.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !file.originalname.match(/\.(xlsx|xls)$/i)) {
      cb(ApiError.badRequest("Only .xlsx or .xls files are supported."));
      return;
    }
    cb(null, true);
  }
});

// src/routes/import.routes.ts
var router9 = (0, import_express9.Router)();
router9.post("/excel/preview", excelUpload.single("file"), previewImport);
router9.post("/excel/confirm", excelUpload.single("file"), confirmImport);
var import_routes_default = router9;

// src/routes/export.routes.ts
var import_express10 = require("express");

// src/services/excelExport.service.ts
var XLSX2 = __toESM(require("xlsx"), 1);
function toWorkbookBuffer(rows, sheetName) {
  const worksheet = XLSX2.utils.json_to_sheet(rows);
  const workbook = XLSX2.utils.book_new();
  XLSX2.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX2.write(workbook, { type: "buffer", bookType: "xlsx" });
}
function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN");
}
async function exportClients() {
  const clients = await Client.find().sort({ createdAt: 1 }).lean();
  const rows = clients.map((c) => ({
    "Client ID": c.clientId,
    "Client Name": c.name,
    "Company/Institute": c.company,
    "Contact Number": c.phone,
    Email: c.email,
    "Service/Course": c.service,
    "Monthly Fee (\u20B9)": c.monthlyFee,
    "Default Due Day": c.defaultDueDay,
    Status: c.isActive ? "Active" : "Archived",
    Notes: c.notes ?? ""
  }));
  return toWorkbookBuffer(rows, "Clients");
}
async function exportInvoices(filter) {
  const match = { isArchived: false };
  if (filter.billingMonth) match.billingMonth = filter.billingMonth;
  if (filter.dateFrom || filter.dateTo) {
    match.invoiceDate = {
      ...filter.dateFrom ? { $gte: filter.dateFrom } : {},
      ...filter.dateTo ? { $lte: filter.dateTo } : {}
    };
  }
  const invoices = await Invoice.find(match).populate("client", "clientId name company phone email service").sort({ invoiceDate: -1 });
  const now = /* @__PURE__ */ new Date();
  const today = startOfToday(now);
  const rows = invoices.map((inv) => {
    const client = inv.client;
    const balance = roundCurrency(inv.amountDue - inv.amountPaid);
    const status = computeStatus(inv.amountDue, inv.amountPaid, inv.dueDate, now);
    return { inv, client, balance, status };
  }).filter((row) => {
    if (filter.onlyOverdue && !(row.balance > 0 && row.inv.dueDate < today)) return false;
    if (filter.onlyOutstanding && row.balance <= 0) return false;
    return true;
  }).map(({ inv, client, balance, status }) => ({
    "Client ID": client.clientId,
    "Client Name": client.name,
    "Company/Institute": client.company,
    "Contact Number": client.phone,
    Email: client.email,
    "Service/Course": client.service,
    "Invoice No.": inv.invoiceNumber,
    "Billing Month": inv.billingMonth,
    "Monthly Fee (\u20B9)": inv.amountDue,
    "Payment Due Date": formatDate(inv.dueDate),
    "Amount Paid (\u20B9)": inv.amountPaid,
    "Balance (\u20B9)": balance,
    "Payment Status": status,
    Remarks: inv.notes ?? ""
  }));
  return toWorkbookBuffer(rows, "Invoices");
}
async function exportPayments(filter) {
  const match = { isVoided: false };
  if (filter.dateFrom || filter.dateTo) {
    match.paymentDate = {
      ...filter.dateFrom ? { $gte: filter.dateFrom } : {},
      ...filter.dateTo ? { $lte: filter.dateTo } : {}
    };
  }
  const payments = await Payment.find(match).populate("client", "clientId name company").populate("invoice", "invoiceNumber billingMonth").sort({ paymentDate: -1 });
  const rows = payments.map((p) => {
    const client = p.client;
    const invoice = p.invoice;
    return {
      "Client ID": client.clientId,
      "Client Name": client.name,
      "Company/Institute": client.company,
      "Invoice No.": invoice.invoiceNumber,
      "Billing Month": invoice.billingMonth,
      "Payment Date": formatDate(p.paymentDate),
      "Amount Paid (\u20B9)": p.amount,
      "Payment Mode": p.paymentMode,
      "Transaction Reference": p.transactionReference ?? "",
      Remarks: p.remarks ?? ""
    };
  });
  return toWorkbookBuffer(rows, "Payments");
}

// src/controllers/export.controller.ts
function sendXlsx(res, buffer, filename) {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
var exportClientsFile = asyncHandler(async (_req, res) => {
  const buffer = await exportClients();
  sendXlsx(res, buffer, "clients.xlsx");
});
var exportPaymentsFile = asyncHandler(async (req, res) => {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : void 0;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : void 0;
  const buffer = await exportPayments({ dateFrom, dateTo });
  sendXlsx(res, buffer, "payments.xlsx");
});
var exportInvoicesFile = asyncHandler(async (req, res) => {
  const scope = req.query.scope || "all";
  const now = /* @__PURE__ */ new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const filter = {};
  if (scope === "currentMonth") filter.billingMonth = currentMonth;
  if (scope === "overdue") filter.onlyOverdue = true;
  if (scope === "outstanding") filter.onlyOutstanding = true;
  if (scope === "custom") {
    if (req.query.dateFrom) filter.dateFrom = new Date(req.query.dateFrom);
    if (req.query.dateTo) filter.dateTo = new Date(req.query.dateTo);
  }
  const buffer = await exportInvoices(filter);
  sendXlsx(res, buffer, `invoices-${scope}.xlsx`);
});

// src/routes/export.routes.ts
var router10 = (0, import_express10.Router)();
router10.get("/clients", exportClientsFile);
router10.get("/payments", exportPaymentsFile);
router10.get("/invoices", exportInvoicesFile);
var export_routes_default = router10;

// src/routes/settings.routes.ts
var import_express11 = require("express");

// src/models/Settings.ts
var import_mongoose11 = require("mongoose");
var settingsSchema = new import_mongoose11.Schema(
  {
    businessName: { type: String, required: true, default: "My Business" },
    businessEmail: { type: String, default: "" },
    businessPhone: { type: String, default: "" },
    businessAddress: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    defaultPaymentTerms: { type: String, default: "Due within 5 days of billing." },
    defaultDueDay: { type: Number, default: 5, min: 1, max: 28 }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);
var Settings = (0, import_mongoose11.model)("Settings", settingsSchema, "settings");
var SETTINGS_SINGLETON_FILTER = {};
async function getOrCreateSettings() {
  const existing = await Settings.findOne(SETTINGS_SINGLETON_FILTER);
  if (existing) return existing;
  return Settings.create({});
}

// src/controllers/settings.controller.ts
var getSettings = asyncHandler(async (_req, res) => {
  const settings = await getOrCreateSettings();
  sendSuccess(res, settings);
});
var updateSettings = asyncHandler(async (req, res) => {
  const existing = await getOrCreateSettings();
  Object.assign(existing, req.body);
  await existing.save();
  sendSuccess(res, existing, "Settings updated.");
});

// src/validators/settings.validator.ts
var import_zod5 = require("zod");
var settingsUpdateSchema = import_zod5.z.object({
  businessName: import_zod5.z.string().trim().min(1, "Business name is required."),
  businessEmail: import_zod5.z.string().trim().optional().default(""),
  businessPhone: import_zod5.z.string().trim().optional().default(""),
  businessAddress: import_zod5.z.string().trim().optional().default(""),
  gstNumber: import_zod5.z.string().trim().optional().default(""),
  logoUrl: import_zod5.z.string().trim().optional().default(""),
  currency: import_zod5.z.string().trim().min(1).default("INR"),
  defaultPaymentTerms: import_zod5.z.string().trim().optional().default(""),
  defaultDueDay: import_zod5.z.coerce.number().int().min(1).max(28).default(5)
});

// src/routes/settings.routes.ts
var router11 = (0, import_express11.Router)();
router11.get("/", getSettings);
router11.put("/", validate(settingsUpdateSchema), updateSettings);
var settings_routes_default = router11;

// src/routes/index.ts
var router12 = (0, import_express12.Router)();
router12.use("/auth", auth_routes_default);
router12.use(requireAuth);
router12.use("/clients", client_routes_default);
router12.use("/invoices", invoice_routes_default);
router12.use("/payments", payment_routes_default);
router12.use("/dashboard", dashboard_routes_default);
router12.use("/overdue", overdue_routes_default);
router12.use("/upcoming-dues", upcoming_routes_default);
router12.use("/reports", report_routes_default);
router12.use("/import", import_routes_default);
router12.use("/export", export_routes_default);
router12.use("/settings", settings_routes_default);
var routes_default = router12;

// src/middleware/error.middleware.ts
var import_mongoose12 = __toESM(require("mongoose"), 1);
function notFoundMiddleware(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}
function errorMiddleware(err, _req, res, _next) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors });
    return;
  }
  if (err instanceof import_mongoose12.default.Error.ValidationError) {
    const errors = {};
    for (const [field, validatorError] of Object.entries(err.errors)) {
      errors[field] = validatorError.message;
    }
    res.status(400).json({ success: false, message: "Validation failed.", errors });
    return;
  }
  if (err instanceof import_mongoose12.default.Error.CastError) {
    res.status(400).json({ success: false, message: `Invalid value for field "${err.path}".` });
    return;
  }
  if (isMongoDuplicateKeyError(err)) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    res.status(409).json({ success: false, message: `A record with this ${field} already exists.` });
    return;
  }
  console.error("[unhandled error]", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    ...env.isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }
  });
}
function isMongoDuplicateKeyError(err) {
  return typeof err === "object" && err !== null && "code" in err && err.code === 11e3;
}

// src/app.ts
function createApp() {
  const app = (0, import_express13.default)();
  app.disable("x-powered-by");
  app.use((0, import_helmet.default)());
  app.use(
    (0, import_cors.default)({
      origin: env.clientOrigin,
      credentials: true
    })
  );
  app.use((0, import_cookie_parser.default)());
  app.use(import_express13.default.json({ limit: "2mb" }));
  app.use(import_express13.default.urlencoded({ extended: true }));
  if (!env.isTest) {
    app.use((0, import_morgan.default)(env.isProduction ? "combined" : "dev"));
  }
  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() } });
  });
  app.use("/api", apiLimiter, routes_default);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}

// src/config/db.ts
var import_mongoose13 = __toESM(require("mongoose"), 1);
var memoryServerHandle = null;
async function connectDatabase() {
  if (import_mongoose13.default.connection.readyState === 1) return;
  let uri = env.mongodbUri;
  if (!uri) {
    if (env.isProduction) {
      throw new Error("MONGODB_URI must be set in production.");
    }
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, dbName: "payment_tracker" } });
    memoryServerHandle = replSet;
    uri = replSet.getUri();
    console.log("[db] MONGODB_URI not set \u2014 started an in-memory MongoDB replica set for local development.");
  }
  import_mongoose13.default.set("strictQuery", true);
  await import_mongoose13.default.connect(uri);
  console.log(`[db] Connected to MongoDB (${env.isProduction ? "production" : "development"} mode).`);
}

// src/seed/bootstrap.ts
var import_bcryptjs3 = __toESM(require("bcryptjs"), 1);
async function bootstrapEssentials() {
  const existingUser = await User.findOne({});
  if (!existingUser) {
    const passwordHash = await import_bcryptjs3.default.hash(env.seedAdminPassword, 12);
    await User.create({
      name: env.seedAdminName,
      email: env.seedAdminEmail.toLowerCase(),
      passwordHash,
      role: "admin"
    });
  }
  const existingSettings = await Settings.findOne({});
  if (!existingSettings) {
    await Settings.create({});
  }
}

// src/vercel.ts
var appPromise = null;
async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDatabase();
      await bootstrapEssentials();
      return createApp();
    })().catch((err) => {
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}
async function handler(req, res) {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err) {
    console.error("[vercel] Failed to initialize app:", err);
    const message = err instanceof Error ? err.message : "Unknown startup error";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: `Server failed to start: ${message}` }));
  }
}
