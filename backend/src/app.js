import path from "path";
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
import uploadsRoutes from "./routes/uploads.js";
import profileRoutes from "./routes/profile.js";
import roomRoutes from "./routes/room.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", uploadsRoutes);

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
app.use("/api/v1/hms/profile", profileRoutes);
app.use("/api/v1/hms/rooms",roomRoutes)
app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ message: `Route ${req.path} not found` }));

app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
