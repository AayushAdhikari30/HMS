import { Patient, User, LabTest } from "../models/index.js";
import { ROLES, HTTP, LAB_TEST_STATUS, LAB_TEST_STATUS_LIST } from "../constants.js";

const getPatientForUser = (userId) => Patient.findOne({ where: { user_id: userId } });

const serializeLabTest = (test) => ({
  id: test.id,
  testName: test.test_name,
  status: test.status,
  result: test.result,
  notes: test.notes,
  completedAt: test.completed_at,
  patient: test.patient ? { id: test.patient.id, name: test.patient.fullname } : undefined,
  labAssistant: test.labAssistant
    ? { id: test.labAssistant.id, identifier: test.labAssistant.identifier }
    : undefined,
  createdAt: test.createdAt,
});

// POST /labs — patient checks in for a lab test
export const createLabTest = async (req, res) => {
  try {
    const { testName, notes } = req.body;

    if (!testName || !testName.trim()) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "testName is required" });
    }

    const patient = await getPatientForUser(req.user.id);
    if (!patient) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "Patient profile not found" });
    }

    const labTest = await LabTest.create({
      patient_id: patient.id,
      test_name: testName.trim(),
      notes: notes || null,
      status: LAB_TEST_STATUS.REQUESTED,
    });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Lab test requested",
      labTest: serializeLabTest(labTest),
    });
  } catch (err) {
    console.error("[labs/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /labs — scoped by role: patient sees own, lab_assistant/admin see all (optionally filtered by status)
export const listLabTests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      if (!patient) {
        return res.status(HTTP.OK).json({ success: true, labTests: [] });
      }
      where.patient_id = patient.id;
    }
    // lab_assistant, admin: no extra scoping — see all requests

    const labTests = await LabTest.findAll({
      where,
      include: [
        { model: Patient, as: "patient", required: false },
        { model: User, as: "labAssistant", required: false, attributes: ["id", "identifier"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(HTTP.OK).json({ success: true, labTests: labTests.map(serializeLabTest) });
  } catch (err) {
    console.error("[labs/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /labs/:id/status — lab_assistant/admin moves a request through the workflow
export const updateLabTestStatus = async (req, res) => {
  try {
    const { status, result, notes } = req.body;

    if (!status || !LAB_TEST_STATUS_LIST.includes(status)) {
      return res.status(HTTP.BAD_REQUEST).json({
        message: `status must be one of: ${LAB_TEST_STATUS_LIST.join(", ")}`,
      });
    }

    const labTest = await LabTest.findByPk(req.params.id);
    if (!labTest) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Lab test not found" });
    }

    if (status === LAB_TEST_STATUS.COMPLETED && !(result && result.trim())) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "result is required to complete a lab test" });
    }

    await labTest.update({
      status,
      result: result !== undefined ? result : labTest.result,
      notes: notes !== undefined ? notes : labTest.notes,
      lab_assistant_id: labTest.lab_assistant_id || req.user.id,
      completed_at: status === LAB_TEST_STATUS.COMPLETED ? new Date() : labTest.completed_at,
    });

    return res.status(HTTP.OK).json({ success: true, labTest: serializeLabTest(labTest) });
  } catch (err) {
    console.error("[labs/updateStatus]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// DELETE /labs/:id — patient cancels their own still-pending request
export const cancelLabTest = async (req, res) => {
  try {
    const patient = await getPatientForUser(req.user.id);
    const labTest = await LabTest.findByPk(req.params.id);

    if (!labTest || !patient || labTest.patient_id !== patient.id) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Lab test not found" });
    }
    if (labTest.status !== LAB_TEST_STATUS.REQUESTED) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "This request can no longer be cancelled" });
    }

    await labTest.update({ status: LAB_TEST_STATUS.CANCELLED });

    return res.status(HTTP.OK).json({ success: true, message: "Lab test request cancelled" });
  } catch (err) {
    console.error("[labs/cancel]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
