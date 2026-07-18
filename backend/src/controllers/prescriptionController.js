import { Patient, User, StaffProfile, Appointment, Prescription } from "../models/index.js";
import { ROLES, HTTP } from "../constants.js";

const getPatientForUser = (userId) => Patient.findOne({ where: { user_id: userId } });

const serializePrescription = (rx) => ({
  id: rx.id,
  diagnosis: rx.diagnosis,
  medications: rx.medications,
  notes: rx.notes,
  appointmentId: rx.appointment_id,
  patient: rx.patient
    ? { id: rx.patient.id, name: rx.patient.fullname }
    : undefined,
  doctor: rx.doctor
    ? {
        id: rx.doctor.id,
        name: rx.doctor.staffProfile?.fullname ?? rx.doctor.identifier,
        department: rx.doctor.staffProfile?.department ?? null,
        specialization: rx.doctor.staffProfile?.specialization ?? null,
      }
    : undefined,
  createdAt: rx.createdAt,
});

const isNonEmptyMedicationList = (medications) =>
  Array.isArray(medications) &&
  medications.length > 0 &&
  medications.every((m) => typeof m?.name === "string" && m.name.trim().length > 0);

// POST /prescriptions — doctor writes a prescription for a patient,
// optionally tied to one of their own appointments with that patient.
export const createPrescription = async (req, res) => {
  try {
    const { patientId, appointmentId, diagnosis, medications, notes } = req.body;

    if (!patientId) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "patientId is required" });
    }
    if (!isNonEmptyMedicationList(medications)) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: "medications must be a non-empty array of { name, dosage, frequency, duration, instructions }",
      });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Patient not found" });
    }

    if (appointmentId) {
      const appointment = await Appointment.findByPk(appointmentId);
      if (
        !appointment ||
        appointment.doctor_id !== req.user.id ||
        appointment.patient_id !== patientId
      ) {
        return res.status(HTTP.BAD_REQUEST).json({
          message: "appointmentId must refer to one of your own appointments with this patient",
        });
      }
    }

    const prescription = await Prescription.create({
      patient_id: patientId,
      doctor_id: req.user.id,
      appointment_id: appointmentId || null,
      diagnosis: diagnosis || null,
      medications,
      notes: notes || null,
    });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Prescription created",
      prescription: serializePrescription(prescription),
    });
  } catch (err) {
    console.error("[prescriptions/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /prescriptions — scoped by role: patient sees own, doctor sees own-written, admin sees all
export const listPrescriptions = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient) {
        return res.status(HTTP.OK).json({ success: true, prescriptions: [] });
      }
      where.patient_id = patient.id;
    } else if (req.user.role === ROLES.DOCTOR) {
      where.doctor_id = req.user.id;
    }
    // admin: no extra scoping — sees all

    const prescriptions = await Prescription.findAll({
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
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({
      success: true,
      prescriptions: prescriptions.map(serializePrescription),
    });
  } catch (err) {
    console.error("[prescriptions/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};