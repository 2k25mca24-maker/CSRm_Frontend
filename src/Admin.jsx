import { useEffect, useState } from "react";
import api, { errMsg } from "./api";
import "./admin.css";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState([]);
  const [error, setError] = useState("");

  const [newRes, setNewRes] = useState({ name: "", type: "LAB", location: "" });
  const [logUser, setLogUser] = useState("");
  const [logDate, setLogDate] = useState("");
  const [repDate, setRepDate] = useState(new Date().toISOString().slice(0, 10));

  const run = async (fn) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const loadAll = () =>
    run(async () => {
      const [usersRes, resourcesRes, bookingsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/resources"),
        api.get("/bookings")
      ]);
      setUsers(usersRes.data);
      setResources(resourcesRes.data);
      setBookings(bookingsRes.data);
    });

  useEffect(() => {
    loadAll();
  }, []);

  const setStatus = (id, status) =>
    run(async () => {
      await api.put(`/admin/users/${id}?status=${status}`);
      loadAll();
    });

  const addResource = () =>
    run(async () => {
      if (!newRes.name.trim() || !newRes.location.trim()) {
        setError("Please enter resource name and location.");
        return;
      }
      await api.post("/resources", newRes);
      setNewRes({ name: "", type: "LAB", location: "" });
      loadAll();
    });

  const deleteResource = (id) =>
    run(async () => {
      if (window.confirm("Are you sure you want to delete this resource?")) {
        await api.delete("/resources/" + id);
        loadAll();
      }
    });

  const cancelBooking = (id) =>
    run(async () => {
      if (window.confirm("Are you sure you want to cancel this booking?")) {
        await api.delete("/bookings/" + id);
        loadAll();
      }
    });

  const loadLogs = () =>
    run(async () => {
      const params = {};
      if (logUser) params.userId = logUser;
      if (logDate) params.date = logDate;
      const res = await api.get("/audit", { params });
      setLogs(res.data);
    });

  const loadReport = () =>
    run(async () => {
      const res = await api.get("/admin/report", { params: { date: repDate } });
      setReport(res.data);
    });

  const pending = users.filter((u) => u.status === "PENDING").length;
  const active = bookings.filter((b) => b.status === "BOOKED").length;

  return (
    <div className="admin-container">
      {/* Overview Stats */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon resources">📦</div>
          <div className="stat-info">
            <span className="stat-value">{resources.length}</span>
            <span className="stat-label">Total Resources</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{pending}</span>
            <span className="stat-label">Pending Approvals</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">📅</div>
          <div className="stat-info">
            <span className="stat-value">{active}</span>
            <span className="stat-label">Active Bookings</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* User Management */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>User Management</h3>
          <span className="badge badge-info">{users.length} registered</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-msg">No users registered yet.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td>
                      <span className={`badge-role ${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.status.toLowerCase()}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u.role !== "ADMIN" ? (
                        <div className="action-btn-group">
                          {u.status !== "APPROVED" && (
                            <button
                              className="btn-action-approve"
                              onClick={() => setStatus(u.id, "APPROVED")}
                            >
                              ✓ Approve
                            </button>
                          )}
                          {u.status !== "REJECTED" && (
                            <button
                              className="btn-action-reject"
                              onClick={() => setStatus(u.id, "REJECTED")}
                            >
                              ✕ Reject
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Admin</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Management */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Campus Resources</h3>
          <span className="badge badge-info">{resources.length} available</span>
        </div>

        <form
          className="admin-form-row"
          onSubmit={(e) => {
            e.preventDefault();
            addResource();
          }}
        >
          <input
            placeholder="Resource Name (e.g. Lab 201)"
            value={newRes.name}
            onChange={(e) => setNewRes({ ...newRes, name: e.target.value })}
            required
          />
          <select
            value={newRes.type}
            onChange={(e) => setNewRes({ ...newRes, type: e.target.value })}
          >
            <option value="CLASSROOM">CLASSROOM</option>
            <option value="LAB">LAB</option>
            <option value="LOCKER">LOCKER</option>
            <option value="EQUIPMENT">EQUIPMENT</option>
          </select>
          <input
            placeholder="Location / Building (e.g. Block A, 2nd Fl)"
            value={newRes.location}
            onChange={(e) => setNewRes({ ...newRes, location: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary-action">
            + Add Resource
          </button>
        </form>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Resource Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-msg">No resources created yet.</td>
                </tr>
              ) : (
                resources.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>
                      <span className="badge badge-type">{r.type}</span>
                    </td>
                    <td>{r.location}</td>
                    <td>
                      <button
                        className="btn-action-delete"
                        onClick={() => deleteResource(r.id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Bookings */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Reservations</h3>
          <span className="badge badge-info">{bookings.length} total</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Resource ID</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-msg">No bookings recorded yet.</td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id}>
                    <td>#{b.id}</td>
                    <td>User #{b.userId}</td>
                    <td>Resource #{b.resourceId}</td>
                    <td>{b.startTime.replace("T", " ")}</td>
                    <td>{b.endTime.replace("T", " ")}</td>
                    <td>
                      <span className={`badge badge-${b.status.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.status === "BOOKED" && (
                        <button
                          className="btn-action-cancel"
                          onClick={() => cancelBooking(b.id)}
                        >
                          ✕ Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Utilization Report */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Daily Utilization Report</h3>
        </div>
        <form
          className="admin-form-row"
          onSubmit={(e) => {
            e.preventDefault();
            loadReport();
          }}
        >
          <input
            type="date"
            value={repDate}
            onChange={(e) => setRepDate(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary-action">
            📊 Generate Report
          </button>
        </form>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Bookings Count</th>
              </tr>
            </thead>
            <tbody>
              {report.length === 0 ? (
                <tr>
                  <td colSpan="2" className="empty-table-msg">
                    Select a date and click "Generate Report" to view utilization statistics.
                  </td>
                </tr>
              ) : (
                report.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.resource}</strong></td>
                    <td>
                      <span className="badge badge-info">{r.bookings} booking(s)</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>System Audit Logs</h3>
        </div>
        <form
          className="admin-form-row"
          onSubmit={(e) => {
            e.preventDefault();
            loadLogs();
          }}
        >
          <input
            placeholder="User ID (optional)"
            value={logUser}
            onChange={(e) => setLogUser(e.target.value)}
          />
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
          />
          <button type="submit" className="btn-primary-action">
            🔍 Search Logs
          </button>
        </form>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Action Description</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-table-msg">
                    No logs found. Use search filters above to retrieve audit entries.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td>#{l.id}</td>
                    <td><strong>User #{l.userId}</strong></td>
                    <td>{l.action}</td>
                    <td>{l.timestamp.replace("T", " ")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

