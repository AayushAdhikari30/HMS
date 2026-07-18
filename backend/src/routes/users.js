import { Router } from "express";
import { User, Patient } from "../models/index.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES, HTTP } from "../constants.js";

const router = Router();

router.use(authenticate, authorise(ROLES.ADMIN));

const serializeUser = (user) => ({
  id: user.id,
  identifier: user.identifier,
  name: user.patientProfile?.fullname ?? user.identifier,
  role: user.role,
  department: "—", // placeholder until Doctor/Staff profile models exist
  status: user.is_active ? "Active" : "On Leave",
  is_active: user.is_active,
  createdAt: user.createdAt,
});

// GET /api/v1/hms/users
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};

    const users = await User.findAll({
      where,
      attributes: { exclude: ["password_hash"] },
      include: [{ model: Patient, as: "patientProfile", required: false }],
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({
      success: true,
      users: users.map(serializeUser),
    });
  } catch (err) {
    console.error("[users/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
});

// PATCH /api/v1/hms/users/:id/toggle-status
router.patch("/:id/toggle-status", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(HTTP.NOT_FOUND).json({ message: "User not found" });
    }

    await user.update({ is_active: !user.is_active });
    return res.status(HTTP.OK).json({
      success: true,
      is_active: user.is_active,
      status: user.is_active ? "Active" : "On Leave",
    });
  } catch (err) {
    console.error("[users/toggle]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
});

// DELETE /api/v1/hms/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(HTTP.NOT_FOUND).json({ message: "User not found" });
    }

    await user.destroy();
    return res.status(HTTP.OK).json({ success: true, message: "User removed" });
  } catch (err) {
    console.error("[users/delete]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
});

export default router;