import { User, Patient, StaffProfile, Appointment } from "../models/index.js";
import { computeAvailableSlots } from "../services/availabilityService.js";
import { ROLES, HTTP, APPOINTMENT_STATUS } from "../constants.js";

const getPatientForUser = (userId) => Patient.findOne({ where: { user_id: userId } });

const serializeAppointment = (appt) => ({
  id: appt.id,
  appointmentDate: appt.appointment_date,
  startTime: appt.start_time,
  reason: appt.reason,
  status: appt.status,
  notes: appt.notes,
  cancelledBy: appt.cancelled_by,
  patient: appt.patient
    ? {
        id: appt.patient.id,
        name: appt.patient.fullname,
        phone: appt.patient.phone,
      }
    : undefined,
  doctor: appt.doctor
    ? {
        id: appt.doctor.id,
        name: appt.doctor.staffProfile?.fullname ?? appt.doctor.identifier,
        department: appt.doctor.staffProfile?.department ?? null,
        specialization: appt.doctor.staffProfile?.specialization ?? null,
      }
    : undefined,
  createdAt: appt.createdAt,
});

export const listDoctors = async (req, res) => {
  try {
    const { department } = req.query;

    const doctors = await User.findAll({
      where: { role: ROLES.DOCTOR, is_active: true },
      attributes: ["id", "identifier"],
      include: [
        {
          model: StaffProfile,
          as: "staffProfile",
          required: true,
          where: department ? { department } : undefined,
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(HTTP.OK).json({
      success: true,
      doctors: doctors.map((d) => ({
        id: d.id,
        identifier: d.identifier,
        name: d.staffProfile?.fullname ?? d.identifier,
        department: d.staffProfile?.department ?? null,
        specialization: d.staffProfile?.specialization ?? null,
      })),
    });
  } catch (err) {
    console.error("[appointments/doctors]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, startTime, reason } = req.body;

    if (!doctorId || !appointmentDate || !startTime) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: "doctorId, appointmentDate, and startTime are required",
      });
    }

    const requestedDate = new Date(`${appointmentDate}T${startTime}`);
    if (Number.isNaN(requestedDate.getTime())) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Invalid date or time" });
    }
    if (requestedDate.getTime() < Date.now()) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Cannot book an appointment in the past" });
    }

    const doctor = await User.findOne({
      where: { id: doctorId, role: ROLES.DOCTOR, is_active: true },
    });
    if (!doctor) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Doctor not found" });
    }

    const patient = await getPatientForUser(req.user.id);
    if (!patient) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Patient profile not found" });
    }

    // Slot must fall within the doctor's declared availability, not be on a day off,
    // and not already be booked by another pending/confirmed appointment.
    const requestedSlot = startTime.slice(0, 5);
    let openSlots;
    try {
      openSlots = await computeAvailableSlots(doctorId, appointmentDate);
    } catch (e) {
      if (e.message === "INVALID_DATE") {
        return res.status(HTTP.BAD_REQUEST).json({ message: "Invalid date" });
      }
      throw e;
    }
    if (!openSlots.includes(requestedSlot)) {
      return res.status(HTTP.CONFLICT).json({
        message: "This time slot is not available. Check the doctor's open slots and try again.",
      });
    }

    const appointment = await Appointment.create({
      patient_id: patient.id,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      start_time: startTime,
      reason: reason || null,
      status: APPOINTMENT_STATUS.PENDING,
    });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Appointment requested",
      appointment: serializeAppointment(appointment),
    });
  } catch (err) {
    console.error("[appointments/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /appointments — scoped by role: patient sees own, doctor sees own, admin sees all
export const listAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    const where = {};
    if (status) where.status = status;
    if (date) where.appointment_date = date;

    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient) {
        return res.status(HTTP.OK).json({ success: true, appointments: [] });
      }
      where.patient_id = patient.id;
    } else if (req.user.role === ROLES.DOCTOR) {
      where.doctor_id = req.user.id;
    }
    // admin: no extra scoping — sees all

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Patient, as: "patient", required: false },
        {
          model: User,
          as: "doctor",
          required: false,
          attributes: ["id", "identifier"],
          include: [{ model: StaffProfile, as: "staffProfile", required: false }],
        },
      ],
      order: [
        ["appointment_date", "DESC"],
        ["start_time", "DESC"],
      ],
    });

    return res.status(HTTP.OK).json({
      success: true,
      appointments: appointments.map(serializeAppointment),
    });
  } catch (err) {
    console.error("[appointments/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /appointments/:id/status — doctor confirms/completes/cancels; admin can override
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status || !Object.values(APPOINTMENT_STATUS).includes(status)) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: `status must be one of: ${Object.values(APPOINTMENT_STATUS).join(", ")}`,
      });
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Appointment not found" });
    }

    if (req.user.role === ROLES.DOCTOR && appointment.doctor_id !== req.user.id) {
      return res.status(HTTP.FORBIDDEN).json({ message: "Not your appointment" });
    }

    await appointment.update({
      status,
      notes: notes ?? appointment.notes,
      cancelled_by: status === APPOINTMENT_STATUS.CANCELLED ? req.user.role : appointment.cancelled_by,
    });

    return res.status(HTTP.OK).json({
      success: true,
      appointment: serializeAppointment(appointment),
    });
  } catch (err) {
    console.error("[appointments/updateStatus]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// DELETE /appointments/:id — patient cancels their own pending/confirmed appointment
export const cancelOwnAppointment = async (req, res) => {
  try {
    const patient = await getPatientForUser(req.user.id);
    const appointment = await Appointment.findByPk(req.params.id);

    if (!appointment || !patient || appointment.patient_id !== patient.id) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Appointment not found" });
    }
    if (![APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(appointment.status)) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "This appointment can no longer be cancelled" });
    }

    await appointment.update({ status: APPOINTMENT_STATUS.CANCELLED, cancelled_by: "patient" });

    return res.status(HTTP.OK).json({ success: true, message: "Appointment cancelled" });
  } catch (err) {
    console.error("[appointments/cancel]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};