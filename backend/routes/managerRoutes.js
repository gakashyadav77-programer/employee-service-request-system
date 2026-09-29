const express = require("express");

const db = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all service requests
router.get(
  "/requests",
  authenticateToken,
  authorizeRoles("manager", "admin"),
  async (req, res) => {
    try {
      const [requests] = await db.query(`
        SELECT
          sr.id,
          sr.category,
          sr.subject,
          sr.description,
          sr.priority,
          sr.status,
          sr.assigned_to,
          sr.sla_due_at,
          sr.created_at,
          sr.updated_at,
          u.name AS employee_name,
          u.email AS employee_email,
          u.department AS employee_department
        FROM service_requests sr
        JOIN users u ON sr.user_id = u.id
        ORDER BY sr.created_at DESC
      `);

      res.json({
        requests,
      });
    } catch (error) {
      console.error("Get manager requests error:", error.message);

      res.status(500).json({
        message: "Server error while fetching service requests",
      });
    }
  }
);

// Assign a service request
router.put(
  "/requests/:id/assign",
  authenticateToken,
  authorizeRoles("manager", "admin"),
  async (req, res) => {
    try {
      const requestId = req.params.id;
      const { assignedTo } = req.body;

      if (!assignedTo) {
        return res.status(400).json({
          message: "assignedTo is required",
        });
      }

      const [users] = await db.query(
        "SELECT id, name, role FROM users WHERE id = ?",
        [assignedTo]
      );

      if (users.length === 0) {
        return res.status(404).json({
          message: "Assigned user not found",
        });
      }

      const [requests] = await db.query(
        "SELECT id, status FROM service_requests WHERE id = ?",
        [requestId]
      );

      if (requests.length === 0) {
        return res.status(404).json({
          message: "Service request not found",
        });
      }

      await db.query(
        `UPDATE service_requests
         SET assigned_to = ?, status = 'Assigned'
         WHERE id = ?`,
        [assignedTo, requestId]
      );

      await db.query(
        `INSERT INTO request_activity
         (request_id, user_id, action, old_status, new_status, comment)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          requestId,
          req.user.id,
          "Request Assigned",
          requests[0].status,
          "Assigned",
          `Request assigned to user ${users[0].name}`,
        ]
      );

      res.json({
        message: "Service request assigned successfully",
      });
    } catch (error) {
      console.error("Assign request error:", error.message);

      res.status(500).json({
        message: "Server error while assigning service request",
      });
    }
  }
);

// Update service request status
router.put(
  "/requests/:id/status",
  authenticateToken,
  authorizeRoles("manager", "admin"),
  async (req, res) => {
    try {
      const requestId = req.params.id;
      const { status, comment } = req.body;

      const allowedStatuses = [
        "Open",
        "Assigned",
        "In Progress",
        "Resolved",
        "Closed",
      ];

      if (!status) {
        return res.status(400).json({
          message: "Status is required",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }

      const [requests] = await db.query(
        "SELECT id, status FROM service_requests WHERE id = ?",
        [requestId]
      );

      if (requests.length === 0) {
        return res.status(404).json({
          message: "Service request not found",
        });
      }

      const oldStatus = requests[0].status;

      await db.query(
        `UPDATE service_requests
         SET status = ?
         WHERE id = ?`,
        [status, requestId]
      );

      await db.query(
        `INSERT INTO request_activity
         (request_id, user_id, action, old_status, new_status, comment)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          requestId,
          req.user.id,
          "Status Updated",
          oldStatus,
          status,
          comment || null,
        ]
      );

      res.json({
        message: "Service request status updated successfully",
      });
    } catch (error) {
      console.error("Update status error:", error.message);

      res.status(500).json({
        message: "Server error while updating request status",
      });
    }
  }
);

// Get request activity / audit history
router.get(
  "/requests/:id/activity",
  authenticateToken,
  authorizeRoles("manager", "admin"),
  async (req, res) => {
    try {
      const requestId = req.params.id;

      const [activities] = await db.query(
        `SELECT
          ra.id,
          ra.action,
          ra.old_status,
          ra.new_status,
          ra.comment,
          ra.created_at,
          u.name AS user_name,
          u.role AS user_role
         FROM request_activity ra
         JOIN users u ON ra.user_id = u.id
         WHERE ra.request_id = ?
         ORDER BY ra.created_at ASC`,
        [requestId]
      );

      res.json({
        activities,
      });
    } catch (error) {
      console.error("Get activity error:", error.message);

      res.status(500).json({
        message: "Server error while fetching request activity",
      });
    }
  }
);

module.exports = router;