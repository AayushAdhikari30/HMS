import { DoctorAvailability, DoctorTimeOff, User } from "../models/index.js";
import { computeAvailableSlots } from "../services/availabilityService.js";
import { HTTP, ROLES } from "../constants.js";

const DAY_MIN = 0;
const DAY_MAX = 6;

export const setAvailability = async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, slotDurationMinutes } = req.body;

    if (dayOfWeek === undefined || dayOfWeek === null || !startTime || !endTime) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: "dayOfWeek, startTime, and endTime are required",
      });
    }

    const day = Number(dayOfWeek);
    if (Number.isNaN(day) || day < DAY_MIN || day > DAY_MAX) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "dayOfWeek must be 0 (Sunday) through 6 (Saturday)" });
    }
    if (startTime >= endTime) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "startTime must be before endTime" });
    }

    const availability = await DoctorAvailability.create({
      doctor_id: req.user.id,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: slotDurationMinutes || 30,
    });

    return res.status(HTTP.CREATED).json({ success: true, availability });
  } catch (err) {
    console.error("[availability/set]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /doctors/availability — doctor's own recurring windows
export const listMyAvailability = async (req, res) => {
  try {
    const availability = await DoctorAvailability.findAll({
      where: { doctor_id: req.user.id },
      order: [
        ["day_of_week", "ASC"],
        ["start_time", "ASC"],
      ],
    });
    return res.status(HTTP.OK).json({ success: true, availability });
  } catch (err) {
    console.error("[availability/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    const availability = await DoctorAvailability.findOne({
      where: { id: req.params.id, doctor_id: req.user.id },
    });
    if (!availability) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Availability window not found" });
    }
    await availability.destroy();
    return res.status(HTTP.OK).json({ success: true, message: "Availability window removed" });
  } catch (err) {
    console.error("[availability/delete]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const addTimeOff = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "date is required" });
    }

    const existing = await DoctorTimeOff.findOne({ where: { doctor_id: req.user.id, date } });
    if (existing) {
      return res.status(HTTP.CONFLICT).json({ message: "Time off already recorded for this date" });
    }

    const timeOff = await DoctorTimeOff.create({
      doctor_id: req.user.id,
      date,
      reason: reason || null,
    });

    return res.status(HTTP.CREATED).json({ success: true, timeOff });
  } catch (err) {
    console.error("[availability/timeOff/add]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const listMyTimeOff = async (req, res) => {
  try {
    const timeOff = await DoctorTimeOff.findAll({
      where: { doctor_id: req.user.id },
      order: [["date", "ASC"]],
    });
    return res.status(HTTP.OK).json({ success: true, timeOff });
  } catch (err) {
    console.error("[availability/timeOff/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const deleteTimeOff = async (req, res) => {
  try {
    const timeOff = await DoctorTimeOff.findOne({
      where: { id: req.params.id, doctor_id: req.user.id },
    });
    if (!timeOff) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Time off entry not found" });
    }
    await timeOff.destroy();
    return res.status(HTTP.OK).json({ success: true, message: "Time off removed" });
  } catch (err) {
    console.error("[availability/timeOff/delete]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "date query param (YYYY-MM-DD) is required" });
    }

    const doctor = await User.findOne({ where: { id: doctorId, role: ROLES.DOCTOR, is_active: true } });
    if (!doctor) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Doctor not found" });
    }

    const slots = await computeAvailableSlots(doctorId, date);
    return res.status(HTTP.OK).json({ success: true, date, slots });
  } catch (err) {
    if (err.message === "INVALID_DATE") {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Invalid date" });
    }
    console.error("[availability/slots]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};