import { Op } from "sequelize";
import { LabTest, Patient, User, StaffProfile } from "../models/index.js";
import { ROLES, HTTP, LAB_TEST_STATUS_LIST } from "../constants.js";

const getPatientForUser = (userId) => Patient.findOne({ where: { user_id: userId } });

const serializeLabTest = (t) => ({
  id: t.id,
  testType: t.test_type,
  status: t.status,
  notes: t.notes,
  result: t.result,
  critical: t.critical,
  requestedAt: t.createdAt,
  collectedAt: t.collected_at,
  completedAt: t.completed_at,
  patient: t.patient
    ? {
        id: t.patient.id,
        name: t.patient.fullname,
        phone: t.patient.phone,
        // Patients log in with email — used here as their searchable "ID"
        identifier: t.patient.account?.identifier ?? null,
      }
    : undefined,
  doctor: t.doctor
    ? {
        id: t.doctor.id,
        name: t.doctor.staffProfile?.fullname ?? t.doctor.identifier,
        department: t.doctor.staffProfile?.department ?? null,
      }
    : undefined,
});

const withRelationsInclude = [
  {
    model: Patient,
    as: "patient",
    required: true,
    include: [{ model: User, as: "account", attributes: ["identifier"], required: false }],
  },
  {
    model: User,
    as: "doctor",
    required: false,
    attributes: ["id", "identifier"],
    include: [{ model: StaffProfile, as: "staffProfile", required: false }],
  },
];

export const createLabTest = async (req, res) => {
  try {
    const { patientId, testType, notes } = req.body;

    if (!patientId || !testType?.trim()) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "patientId and testType are required" });
    }

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Patient not found" });
    }

    const labTest = await LabTest.create({
      patient_id: patientId,
      doctor_id: req.user.id,
      test_type: testType.trim(),
      notes: notes?.trim() || null,
    });

    const withRelations = await LabTest.findByPk(labTest.id, { include: withRelationsInclude });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Lab test requested",
      labTest: serializeLabTest(withRelations),
    });
  } catch (err) {
    console.error("[labTests/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const listLabTests = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status) {
      if (!LAB_TEST_STATUS_LIST.includes(status)) {
        return res.status(HTTP.BAD_REQUEST).json({
          message: `status must be one of: ${LAB_TEST_STATUS_LIST.join(", ")}`,
        });
      }
      where.status = status;
    }

    if (req.user.role === ROLES.DOCTOR) {
      where.doctor_id = req.user.id;
    } else if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient) {
        return res.status(HTTP.OK).json({ success: true, labTests: [] });
      }
      where.patient_id = patient.id;
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.and] = [
        {
          [Op.or]: [
            { "$patient.fullname$": { [Op.like]: term } },
            { "$patient.account.identifier$": { [Op.like]: term } },
            { "$patient.id$": search.trim() },
          ],
        },
      ];
    }

    const labTests = await LabTest.findAll({
      where,
      include: withRelationsInclude,
      subQuery: false,
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({
      success: true,
      labTests: labTests.map(serializeLabTest),
    });
  } catch (err) {
    console.error("[labTests/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const collectSample = async (req, res) => {
  try {
    const labTest = await LabTest.findByPk(req.params.id);
    if (!labTest) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Lab test not found" });
    }
    if (labTest.status !== "pending") {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Only pending tests can be marked collected" });
    }

    await labTest.update({ status: "collected", collected_at: new Date() });

    return res.status(HTTP.OK).json({ success: true, labTest: serializeLabTest(await labTest.reload({ include: withRelationsInclude })) });
  } catch (err) {
    console.error("[labTests/collect]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

export const submitResult = async (req, res) => {
  try {
    const { result, critical } = req.body;
    if (!result?.trim()) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "result is required" });
    }

    const labTest = await LabTest.findByPk(req.params.id);
    if (!labTest) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Lab test not found" });
    }
    if (labTest.status === "completed") {
      return res.status(HTTP.BAD_REQUEST).json({ message: "This test already has a result" });
    }

    await labTest.update({
      status: "completed",
      result: result.trim(),
      critical: Boolean(critical),
      completed_at: new Date(),
    });

    return res.status(HTTP.OK).json({ success: true, labTest: serializeLabTest(await labTest.reload({ include: withRelationsInclude })) });
  } catch (err) {
    console.error("[labTests/result]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};