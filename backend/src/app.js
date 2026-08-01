import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import staffRoutes from "./routes/staff.js";
import appointmentRoutes from "./routes/appointments.js";
import doctorRoutes from "./routes/doctors.js";
import prescriptionRoutes from "./routes/prescriptions.js";
import labRoutes from "./routes/labs.js";
import referralRoutes from "./routes/referrals.js";
import invoiceRoutes from "./routes/invoices.js";
import notificationRoutes from "./routes/notifications.js";
import medicineRoutes from "./routes/medicines.js";

const app = express();

// Behind a reverse proxy (nginx/Docker), use the client's real IP from
// X-Forwarded-For so per-user rate limiting works instead of lumping everyone
// under the proxy's single address. '1' trusts exactly one proxy hop.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/hms", authRoutes);
app.use("/api/v1/hms/users", userRoutes);
app.use("/api/v1/hms/staff", staffRoutes);
app.use("/api/v1/hms/appointments", appointmentRoutes);
app.use("/api/v1/hms/doctors", doctorRoutes);
app.use("/api/v1/hms/prescriptions", prescriptionRoutes);
app.use("/api/v1/hms/labs", labRoutes);
app.use("/api/v1/hms/referrals", referralRoutes);
app.use("/api/v1/hms/invoices", invoiceRoutes);
app.use("/api/v1/hms/notifications", notificationRoutes);
app.use("/api/v1/hms/medicines", medicineRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ message: `Route ${req.path} not found` }));

app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
