import { Patient, User, LabTest } from "../models/index.js";
import { notify, notifyMany } from "../services/notificationService.js";
import { ROLES, HTTP, LAB_TEST_STATUS, LAB_TEST_STATUS_LIST, NOTIFICATION_TYPE } from "../constants.js";

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
  orderedBy: test.orderedBy
    ? { id: test.orderedBy.id, identifier: test.orderedBy.identifier }
    : undefined,
  createdAt: test.createdAt,
});

const labTestInclude = [
  { model: Patient, as: "patient", required: false },
  { model: User, as: "labAssistant", required: false, attributes: ["id", "identifier"] },
  { model: User, as: "orderedBy", required: false, attributes: ["id", "identifier"] },
];

// POST /labs — patient checks in for a lab test, or a doctor orders one for a patient they treat
export const createLabTest = async (req, res) => {
  try {
    const { testName, notes, patientId } = req.body;

    if (!testName || !testName.trim()) {
      return res.status(HTTP.BAD_REQUEST).json({ message: "testName is required" });
    }

    let patient;
    let orderedById = null;

    if (req.user.role === ROLES.PATIENT) {
      patient = await getPatientForUser(req.user.id);
      if (!patient) {
        return res.status(HTTP.BAD_REQUEST).json({ message: "Patient profile not found" });
      }
    } else if (req.user.role === ROLES.DOCTOR) {
      if (!patientId) {
        return res.status(HTTP.BAD_REQUEST).json({ message: "patientId is required" });
      }
      patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(HTTP.NOT_FOUND).json({ message: "Patient not found" });
      }
      orderedById = req.user.id;
    } else {
      return res.status(HTTP.FORBIDDEN).json({ message: "Not allowed to request lab tests" });
    }

    const labTest = await LabTest.create({
      patient_id: patient.id,
      test_name: testName.trim(),
      notes: notes || null,
      status: LAB_TEST_STATUS.REQUESTED,
      ordered_by_id: orderedById,
    });

    // Notify the patient if a doctor ordered on their behalf
    if (orderedById && patient.user_id) {
      notify({
        userId: patient.user_id,
        type: NOTIFICATION_TYPE.LAB_TEST,
        title: "Lab test ordered for you",
        body: `Your doctor ordered a "${testName.trim()}".`,
        link: "/patient-dashboard/lab-tests",
      });
    }

    // Notify all active lab assistants that a new request is on the queue
    const labAssistants = await User.findAll({
      where: { role: ROLES.LAB_ASSISTANT, is_active: true },
      attributes: ["id"],
    });
    notifyMany(
      labAssistants.map((u) => u.id),
      {
        type: NOTIFICATION_TYPE.LAB_TEST,
        title: "New lab request",
        body: `"${testName.trim()}" requested for ${patient.fullname}.`,
        link: "/lab-dashboard/queue",
      },
    );

    const created = await LabTest.findByPk(labTest.id, { include: labTestInclude });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: "Lab test requested",
      labTest: serializeLabTest(created),
    });
  } catch (err) {
    console.error("[labs/create]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /labs — scoped by role: patient sees own, doctor sees tests they personally ordered,
// lab_assistant/admin see all (optionally filtered by status)
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
    } else if (req.user.role === ROLES.DOCTOR) {
      where.ordered_by_id = req.user.id;
    }
    // lab_assistant, admin: no extra scoping — see all requests

    const labTests = await LabTest.findAll({
      where,
      include: labTestInclude,
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

    // Notify the patient (and ordering doctor, if any) when a test completes
    if (status === LAB_TEST_STATUS.COMPLETED) {
      const patient = await Patient.findByPk(labTest.patient_id);
      if (patient?.user_id) {
        notify({
          userId: patient.user_id,
          type: NOTIFICATION_TYPE.LAB_TEST,
          title: "Lab results ready",
          body: `Results for "${labTest.test_name}" are available.`,
          link: "/patient-dashboard/lab-tests",
        });
      }
      if (labTest.ordered_by_id) {
        notify({
          userId: labTest.ordered_by_id,
          type: NOTIFICATION_TYPE.LAB_TEST,
          title: "Lab results ready",
          body: `Results for "${labTest.test_name}" are available.`,
          link: "/doctor-dashboard/patients",
        });
      }
    }

    return res.status(HTTP.OK).json({ success: true, labTest: serializeLabTest(labTest) });
  } catch (err) {
    console.error("[labs/updateStatus]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// DELETE /labs/:id — patient cancels their own still-pending request,
// or a doctor cancels a test they personally ordered
export const cancelLabTest = async (req, res) => {
  try {
    const labTest = await LabTest.findByPk(req.params.id);
    if (!labTest) {
      return res.status(HTTP.NOT_FOUND).json({ message: "Lab test not found" });
    }

    let owns = false;
    if (req.user.role === ROLES.PATIENT) {
      const patient = await getPatientForUser(req.user.id);
      owns = !!patient && labTest.patient_id === patient.id;
    } else if (req.user.role === ROLES.DOCTOR) {
      owns = labTest.ordered_by_id === req.user.id;
    }

    if (!owns) {
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
