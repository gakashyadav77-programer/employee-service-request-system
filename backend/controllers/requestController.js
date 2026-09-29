const db = require("../config/db");

const getSlaHours = (priority) => {
  const slaHours = {
    Low: 48,
    Medium: 24,
    High: 8,
    Critical: 4,
  };

  return slaHours[priority] || 24;
};

const createRequest = async (req, res) => {
  try {
    const { category, subject, description, priority } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({
        message: "Category, subject and description are required",
      });
    }

    const allowedCategories = ["IT", "HR", "Facility"];
    const allowedPriorities = ["Low", "Medium", "High", "Critical"];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid request category",
      });
    }

    const requestPriority = priority || "Medium";

    if (!allowedPriorities.includes(requestPriority)) {
      return res.status(400).json({
        message: "Invalid priority",
      });
    }

    if (subject.trim().length < 3) {
      return res.status(400).json({
        message: "Subject must contain at least 3 characters",
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        message: "Description must contain at least 10 characters",
      });
    }

    const slaHours = getSlaHours(requestPriority);

    const slaDueAt = new Date(
      Date.now() + slaHours * 60 * 60 * 1000
    );

    const [result] = await db.query(
      `INSERT INTO service_requests
       (user_id, category, subject, description, priority, sla_due_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        category,
        subject.trim(),
        description.trim(),
        requestPriority,
        slaDueAt,
      ]
    );

    await db.query(
      `INSERT INTO request_activity
       (request_id, user_id, action, new_status, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [
        result.insertId,
        req.user.id,
        "Request Created",
        "Open",
        `Service request created with ${requestPriority} priority. SLA: ${slaHours} hours.`,
      ]
    );

    res.status(201).json({
      message: "Service request created successfully",
      requestId: result.insertId,
      slaDueAt,
      slaHours,
    });
  } catch (error) {
    console.error("Create request error:", error.message);

    res.status(500).json({
      message: "Server error while creating service request",
    });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT
        id,
        category,
        subject,
        description,
        priority,
        status,
        assigned_to,
        sla_due_at,
        created_at,
        updated_at
       FROM service_requests
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      requests,
    });
  } catch (error) {
    console.error("Get requests error:", error.message);

    res.status(500).json({
      message: "Server error while fetching requests",
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
};