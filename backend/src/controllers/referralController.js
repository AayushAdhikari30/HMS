import { Op } from "sequelize";
import { Patient, User, StaffProfile, Referral } from "../models/index.js";
import { notify } from "../services/notificationService.js";
import { ROLES, HTTP, REFERRAL_STATUS, REFERRAL_STATUS_LIST, NOTIFICATION_TYPE } from "../constants.js";

const getPatientForUser = (userId) => Patient.findOne({ where: { user_id: userId } });

const serializeDoctor = (u) =>
  u
    ? {
        id: u.id,
        identifier: u.identifier,
        name: u.staffProfile?.fullname ?? u.identifier,
        department: u.staffProfile?.department ?? null,
        specialization: u.staffProfile?.specialization ?? null,
      }
    : undefined;

const serializeReferral = (ref) => ({
  id: ref.id,
  reason: ref.reason,
  notes: ref.notes,
  status: ref.status,
  patient: ref.patient ? { id: ref.patient.id, name: ref.patient.fullname } : undefined,
  referringDoctor: serializeDoctor(ref.referringDoctor),
  referredDoctor: serializeDoctor(ref.referredDoctor),
  createdAt: ref.createdAt,
});

const referralInclude = [
  { model: Patient, as: "patient", required: false },
  {
    model: User,
    as: "referringDoctor",
    required: false,
    attributes: ["id", "identifier"],
    include: [{ model: StaffProfile, as: "staffProfile", required: false }],
  },
  {
    model: User,
    as: "referredDoctor",
    required: false,
    attributes: ["id", "identifier"],
    include: [{ model: StaffProfile, as: "staffProfile", required: false }],
  },
];

// POST /referrals — doctor refers a patient to another doctor
export const createReferral = async (req, res) => {
  try {
    const { patientId, referredDoctorId, reason, notes } = req.body;

    if (!patientId) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "patientId is required" });
    }
    if (!referredDoctorId) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "referredDoctorId is required" });
    }
    if (!reason || !reason.trim()) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "reason is required" });
    }
    if (referredDoctorId === req.user.id) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "You cannot refer a patient to yourself" });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Patient not found" });
    }

    const referredDoctor = await User.findOne({
      where: { id: referredDoctorId, role: ROLES.DOCTOR },
    });
    if (!referredDoctor) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Referred doctor not found" });
    }

    const referral = await Referral.create({
      patient_id: patientId,
      referring_doctor_id: req.user.id,
      referred_doctor_id: referredDoctorId,
      reason: reason.trim(),
      notes: notes || null,
      status: REFERRAL_STATUS.PENDING,
    });

    // Notify the receiving doctor + the patient
    notify({
      userId: referredDoctorId,
      type: NOTIFICATION_TYPE.REFERRAL,
      title: "New patient referral",
      body: `${patient.fullname} was referred to you: ${reason.trim()}`,
      link: "/doctor-dashboard/referrals",
    });
    if (patient.user_id) {
      notify({
        userId: patient.user_id,
        type: NOTIFICATION_TYPE.REFERRAL,
        title: "You have been referred",
        body: `You were referred to another specialist.`,
        link: "/patient-dashboard",
      });
    }

    const created = await Referral.findByPk(referral.id, { include: referralInclude });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Referral sent",
      referral: serializeReferral(created),
    });
  } catch (err) {
    console.error("[referrals/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /referrals — scoped: patient -> own, doctor -> sent + received (or filtered via ?direction=),
// admin -> all
export const listReferrals = async (req, res) => {
  try {
    const { direction, status } = req.query;
    let where = {};

    if (status) where.status = status;

    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient) {
        return res.status(HTTP.OK).json({ success: true, referrals: [] });
      }
      where.patient_id = patient.id;
    } else if (req.user.role === ROLES.DOCTOR) {
      if (direction === "sent") {
        where.referring_doctor_id = req.user.id;
      } else if (direction === "received") {
        where.referred_doctor_id = req.user.id;
      } else {
        where = {
          ...where,
          [Op.or]: [{ referring_doctor_id: req.user.id }, { referred_doctor_id: req.user.id }],
        };
      }
    }
    // admin: no extra scoping — sees all referrals

    const referrals = await Referral.findAll({
      where,
      include: referralInclude,
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({ success: true, referrals: referrals.map(serializeReferral) });
  } catch (err) {
    console.error("[referrals/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /referrals/:id/status — the referred doctor (or admin) moves the referral through its workflow
export const updateReferralStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status || !REFERRAL_STATUS_LIST.includes(status)) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: `status must be one of: ${REFERRAL_STATUS_LIST.join(", ")}`,
      });
    }

    const referral = await Referral.findByPk(req.params.id);
    if (!referral) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Referral not found" });
    }

    const isReceivingDoctor = req.user.role === ROLES.DOCTOR && referral.referred_doctor_id === req.user.id;
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isReceivingDoctor && !isAdmin) {
      return res.status(HTTP.FORBIDDEN).json({ message: "Only the referred doctor can update this referral" });
    }

    await referral.update({
      status,
      notes: notes !== undefined ? notes : referral.notes,
    });

    const updated = await Referral.findByPk(referral.id, { include: referralInclude });

    return res.status(HTTP.OK).json({ success: true, referral: serializeReferral(updated) });
  } catch (err) {
    console.error("[referrals/updateStatus]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
