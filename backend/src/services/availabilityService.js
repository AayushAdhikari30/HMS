import { Op } from "sequelize";
import { DoctorAvailability, DoctorTimeOff, Appointment } from "../models/index.js";
import { APPOINTMENT_STATUS } from "../constants.js";

const pad = (n) => String(n).padStart(2, "0");
const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const minutesToTime = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

/**
 * Computes the doctor's open (unbooked) time slots for a given date, based on:
 *  - their recurring weekly availability windows for that day of week
 *  - minus any full day off recorded for that date
 *  - minus slots already booked by a pending/confirmed appointment
 *  - minus slots already in the past, if the date is today
 *
 * @param {string} doctorId
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {Promise<string[]>} sorted list of "HH:MM" slot start times
 */
export const computeAvailableSlots = async (doctorId, dateStr) => {
  const targetDate = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(targetDate.getTime())) {
    throw new Error("INVALID_DATE");
  }
  const dayOfWeek = targetDate.getDay();

  const dayOff = await DoctorTimeOff.findOne({
    where: { doctor_id: doctorId, date: dateStr },
  });
  if (dayOff) return [];

  const windows = await DoctorAvailability.findAll({
    where: { doctor_id: doctorId, day_of_week: dayOfWeek, is_active: true },
  });
  if (windows.length === 0) return [];

  const bookedAppointments = await Appointment.findAll({
    where: {
      doctor_id: doctorId,
      appointment_date: dateStr,
      status: { [Op.in]: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
    },
    attributes: ["start_time"],
  });
  const booked = new Set(bookedAppointments.map((a) => String(a.start_time).slice(0, 5)));

  const now = new Date();
  const isToday = now.toDateString() === targetDate.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = new Set();
  for (const w of windows) {
    const start = timeToMinutes(String(w.start_time).slice(0, 5));
    const end = timeToMinutes(String(w.end_time).slice(0, 5));
    const step = w.slot_duration_minutes || 30;

    for (let m = start; m + step <= end; m += step) {
      if (isToday && m <= nowMinutes) continue;
      const slot = minutesToTime(m);
      if (!booked.has(slot)) slots.add(slot);
    }
  }

  return Array.from(slots).sort();
};