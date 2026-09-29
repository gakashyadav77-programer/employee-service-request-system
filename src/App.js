import React, { useEffect, useState } from "react";
import "./index.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

function formatSla(date) {
  if (!date) {
    return "Not assigned";
  }

  const slaDate = new Date(date);

  if (Number.isNaN(slaDate.getTime())) {
    return "Not available";
  }

  return slaDate.toLocaleString();
}

function isOverdue(date, status) {
  if (!date || status === "Resolved" || status === "Closed") {
    return false;
  }

  return new Date(date).getTime() < Date.now();
}

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [requestData, setRequestData] = useState({
    category: "IT",
    subject: "",
    description: "",
    priority: "Medium",
  });

  const [myRequests, setMyRequests] = useState([]);
  const [managerRequests, setManagerRequests] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    if (user && token) {
      if (user.role === "employee") {
        loadMyRequests();
      } else {
        loadManagerRequests();
      }
    }
  }, [user, token]);

  const login = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setMessage("Login successful");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setMyRequests([]);
    setManagerRequests([]);
    setMessage("");
    setError("");
  };

  const loadMyRequests = async () => {
    try {
      const response = await fetch(`${API}/requests/my`, {
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load requests");
      }

      setMyRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadManagerRequests = async () => {
    try {
      const response = await fetch(`${API}/manager/requests`, {
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load requests");
      }

      setManagerRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const createRequest = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/requests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Request creation failed"
        );
      }

      setMessage(
        `Request #${data.requestId} created successfully. SLA: ${data.slaHours} hours.`
      );

      setRequestData({
        category: "IT",
        subject: "",
        description: "",
        priority: "Medium",
      });

      loadMyRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignRequest = async (requestId, assignedTo) => {
    if (!assignedTo) {
      setError("Enter a user ID before assigning.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/manager/requests/${requestId}/assign`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({
            assignedTo: Number(assignedTo),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Assignment failed"
        );
      }

      setMessage(
        `Request #${requestId} assigned successfully`
      );

      loadManagerRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateStatus = async (requestId, status) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API}/manager/requests/${requestId}/status`,
        {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({
            status,
            comment: `Status changed to ${status}`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Status update failed"
        );
      }

      setMessage(
        `Request #${requestId} updated to ${status}`
      );

      loadManagerRequests();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand">
            <div className="brand-icon">ES</div>

            <div>
              <h1>Employee Service</h1>
              <p>Request Management System</p>
            </div>
          </div>

          <h2>Welcome Back</h2>

          <p className="subtitle">
            Sign in to manage your service requests
          </p>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          <form onSubmit={login}>
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={loginData.email}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  email: e.target.value,
                })
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  password: e.target.value,
                })
              }
              required
            />

            <button
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <div className="demo-info">
            <strong>Test Accounts</strong>

            <p>Employee: employee@test.com</p>
            <p>Manager: manager@test.com</p>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "employee") {
    return (
      <div className="app">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">ES</div>

            <div>
              <h1>Employee Service Portal</h1>
              <span>
                Internal Service Request System
              </span>
            </div>
          </div>

          <div className="user-area">
            <div>
              <strong>{user.name}</strong>

              <small>
                {user.role} • {user.department}
              </small>
            </div>

            <button
              className="logout-btn"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard">
          <section className="welcome">
            <div>
              <p className="eyebrow">
                EMPLOYEE PORTAL
              </p>

              <h2>
                How can we help you today?
              </h2>

              <p>
                Raise a service request and track its
                progress from one place.
              </p>
            </div>
          </section>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          <div className="employee-grid">
            <section className="card">
              <h3>Create Service Request</h3>

              <p className="card-description">
                Submit an IT, HR, or Facility request.
              </p>

              <form onSubmit={createRequest}>
                <label>Category</label>

                <select
                  value={requestData.category}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      category: e.target.value,
                    })
                  }
                >
                  <option>IT</option>
                  <option>HR</option>
                  <option>Facility</option>
                </select>

                <label>Subject</label>

                <input
                  type="text"
                  placeholder="Example: Laptop issue"
                  value={requestData.subject}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      subject: e.target.value,
                    })
                  }
                  required
                />

                <label>Description</label>

                <textarea
                  placeholder="Describe your issue clearly..."
                  value={requestData.description}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      description: e.target.value,
                    })
                  }
                  required
                />

                <label>Priority</label>

                <select
                  value={requestData.priority}
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      priority: e.target.value,
                    })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>

                <button
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </form>
            </section>

            <section className="card">
              <div className="section-header">
                <div>
                  <h3>My Requests</h3>

                  <p className="card-description">
                    Track your submitted requests.
                  </p>
                </div>

                <button
                  className="refresh-btn"
                  onClick={loadMyRequests}
                >
                  Refresh
                </button>
              </div>

              <div className="request-list">
                {myRequests.length === 0 ? (
                  <div className="empty">
                    No service requests found.
                  </div>
                ) : (
                  myRequests.map((request) => (
                    <div
                      className="request-item"
                      key={request.id}
                    >
                      <div className="request-top">
                        <div>
                          <span className="request-id">
                            #{request.id}
                          </span>

                          <h4>{request.subject}</h4>
                        </div>

                        <span
                          className={`status ${request.status
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <p>{request.description}</p>

                      <div className="request-meta">
                        <span>
                          {request.category}
                        </span>

                        <span>
                          {request.priority}
                        </span>

                        <span>
                          SLA:{" "}
                          {formatSla(
                            request.sla_due_at
                          )}
                        </span>
                      </div>

                      {isOverdue(
                        request.sla_due_at,
                        request.status
                      ) && (
                        <div className="alert error">
                          SLA deadline exceeded
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">ES</div>

          <div>
            <h1>
              Service Management Dashboard
            </h1>

            <span>
              Employee Service Request System
            </span>
          </div>
        </div>

        <div className="user-area">
          <div>
            <strong>{user.name}</strong>

            <small>{user.role}</small>
          </div>

          <button
            className="logout-btn"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <div>
            <p className="eyebrow">
              MANAGEMENT PORTAL
            </p>

            <h2>
              Service Request Overview
            </h2>

            <p>
              Monitor, assign, and update employee
              service requests.
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={loadManagerRequests}
          >
            Refresh Requests
          </button>
        </section>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="alert success">
            {message}
          </div>
        )}

        <section className="stats">
          <div className="stat-card">
            <span>Total Requests</span>

            <strong>
              {managerRequests.length}
            </strong>
          </div>

          <div className="stat-card">
            <span>Open</span>

            <strong>
              {
                managerRequests.filter(
                  (r) => r.status === "Open"
                ).length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>In Progress</span>

            <strong>
              {
                managerRequests.filter(
                  (r) =>
                    r.status === "In Progress"
                ).length
              }
            </strong>
          </div>

          <div className="stat-card">
            <span>Resolved</span>

            <strong>
              {
                managerRequests.filter(
                  (r) =>
                    r.status === "Resolved"
                ).length
              }
            </strong>
          </div>
        </section>

        <section className="card full-card">
          <div className="section-header">
            <div>
              <h3>Service Requests</h3>

              <p className="card-description">
                Manage employee requests and their
                status.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Deadline</th>
                  <th>Assign</th>
                  <th>Update</th>
                </tr>
              </thead>

              <tbody>
                {managerRequests.map(
                  (request) => (
                    <ManagerRow
                      key={request.id}
                      request={request}
                      onAssign={assignRequest}
                      onStatus={updateStatus}
                    />
                  )
                )}
              </tbody>
            </table>

            {managerRequests.length === 0 && (
              <div className="empty">
                No service requests found.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ManagerRow({
  request,
  onAssign,
  onStatus,
}) {
  const [assignedTo, setAssignedTo] = useState(
    request.assigned_to || ""
  );

  const overdue = isOverdue(
    request.sla_due_at,
    request.status
  );

  return (
    <tr>
      <td>#{request.id}</td>

      <td>
        <strong>
          {request.employee_name}
        </strong>

        <small className="table-small">
          {request.employee_department}
        </small>
      </td>

      <td>{request.category}</td>

      <td>
        <strong>{request.subject}</strong>
      </td>

      <td>
        <span className="priority">
          {request.priority}
        </span>
      </td>

      <td>
        <span
          className={`status ${request.status
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          {request.status}
        </span>
      </td>

      <td>
        <div>
          <small>
            {formatSla(request.sla_due_at)}
          </small>

          {overdue && (
            <div className="alert error">
              Overdue
            </div>
          )}
        </div>
      </td>

      <td>
        <div className="assign-box">
          <input
            type="number"
            min="1"
            placeholder="User ID"
            value={assignedTo}
            onChange={(e) =>
              setAssignedTo(e.target.value)
            }
          />

          <button
            className="small-btn"
            onClick={() =>
              onAssign(
                request.id,
                assignedTo
              )
            }
          >
            Assign
          </button>
        </div>
      </td>

      <td>
        <select
          value={request.status}
          onChange={(e) =>
            onStatus(
              request.id,
              e.target.value
            )
          }
        >
          <option>Open</option>
          <option>Assigned</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>
      </td>
    </tr>
  );
}

export default App;