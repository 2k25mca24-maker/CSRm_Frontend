import { useEffect, useState } from "react";
import api, { errMsg } from "./api";
import "./booking.css";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const pad = (n) => String(n).padStart(2, "0");
const today = () => new Date().toISOString().slice(0, 10);

export default function Booking({ user }) {
  const [resources, setResources] = useState([]);
  const [resourceId, setResourceId] = useState("");
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [mine, setMine] = useState([]);
  const [notes, setNotes] = useState([]); 
  const [error, setError] = useState("");

  const notify = (text) => setNotes((old) => [text, ...old]);

  const loadResources = async () => {
    try {
      const res = await api.get("/resources");
      // students cannot book classrooms
      const list = res.data.filter(
        (r) => r.availability && !(user.role === "STUDENT" && r.type === "CLASSROOM")
      );
      setResources(list);
      if (list.length > 0 && !resourceId) setResourceId(list[0].id);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const loadSlots = async () => {
    if (!resourceId) return;
    try {
      const res = await api.get("/bookings/slots", { params: { resourceId, date } });
      setSlots(res.data);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const loadMine = async () => {
    try {
      const res = await api.get("/bookings");
      setMine(res.data);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    loadResources();
    loadMine();
  }, []);

  useEffect(() => {
    loadSlots();
  }, [resourceId, date]);

  const isTaken = (h) => {
    const s = new Date(`${date}T${pad(h)}:00:00`);
    const e = new Date(`${date}T${pad(h + 1)}:00:00`);
    return slots.some((b) => new Date(b.startTime) < e && new Date(b.endTime) > s);
  };

  const book = async (h) => {
    setError("");
    try {
      await api.post("/bookings", {
        resourceId,
        startTime: `${date}T${pad(h)}:00`,
        endTime: `${date}T${pad(h + 1)}:00`,
      });
      notify(`Booking confirmed for ${date} at ${pad(h)}:00 (email/SMS notification sent)`);
      loadSlots();
      loadMine();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const cancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await api.delete("/bookings/" + id);
      notify(`Booking #${id} cancelled (email/SMS notification sent)`);
      loadSlots();
      loadMine();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const modify = async (id) => {
    const startTime = prompt("Enter new start time (e.g. 2026-10-05T10:00)");
    const endTime = prompt("Enter new end time (e.g. 2026-10-05T11:00)");
    if (!startTime || !endTime) return;
    try {
      await api.put("/bookings/" + id, { startTime, endTime });
      notify(`Booking #${id} modified successfully (email/SMS notification sent)`);
      loadSlots();
      loadMine();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const statusOf = (b) => {
    if (b.status === "CANCELLED") return "CANCELLED";
    const now = new Date();
    if (new Date(b.endTime) < now) return "PAST";
    if (new Date(b.startTime) <= now) return "ONGOING";
    return "UPCOMING";
  };

  const nameOf = (id) => resources.find((r) => r.id === id)?.name || "Resource #" + id;

  const selectedResource = resources.find((r) => r.id === Number(resourceId));

  return (
    <div className="booking-container">
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Book a Resource Card */}
      <div className="booking-card">
        <div className="booking-card-header">
          <h3>Reserve a Campus Resource</h3>
          {selectedResource && (
            <span className="badge badge-type">
              {selectedResource.type} • {selectedResource.location}
            </span>
          )}
        </div>

        <div className="booking-controls-bar">
          <div className="control-field">
            <label htmlFor="resource-select">Select Resource</label>
            <select
              id="resource-select"
              value={resourceId}
              onChange={(e) => setResourceId(Number(e.target.value))}
            >
              {resources.length === 0 ? (
                <option value="">No resources available</option>
              ) : (
                resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type} - {r.location})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="control-field">
            <label htmlFor="booking-date">Reservation Date</label>
            <input
              id="booking-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="slots-table">
            <thead>
              <tr>
                <th>Time Window</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {HOURS.map((h) => {
                const taken = isTaken(h);
                return (
                  <tr key={h} className={taken ? "taken" : "free"}>
                    <td>
                      <div className="time-cell">
                        <span>🕒</span>
                        <span>{pad(h)}:00 - {pad(h + 1)}:00</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${taken ? "badge-danger" : "badge-success"}`}>
                        {taken ? "● Booked" : "✓ Available"}
                      </span>
                    </td>
                    <td>
                      {!taken && (
                        <button
                          className="btn-book-slot"
                          onClick={() => book(h)}
                        >
                          Book Slot
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Bookings Card */}
      <div className="booking-card">
        <div className="booking-card-header">
          <h3>My Reservations</h3>
          <span className="badge badge-info">{mine.length} reservation(s)</span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Resource</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mine.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-msg">
                    You haven't made any bookings yet. Select a resource and slot above to book.
                  </td>
                </tr>
              ) : (
                mine.map((b) => {
                  const status = statusOf(b);
                  return (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td><strong>{nameOf(b.resourceId)}</strong></td>
                      <td>{b.startTime.replace("T", " ")}</td>
                      <td>{b.endTime.replace("T", " ")}</td>
                      <td>
                        <span className={`badge badge-${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        {b.status === "BOOKED" && (
                          <div className="booking-actions">
                            <button
                              className="btn-modify-booking"
                              onClick={() => modify(b.id)}
                            >
                              ✏️ Modify
                            </button>
                            <button
                              className="btn-cancel-booking"
                              onClick={() => cancel(b.id)}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notifications Card */}
      <div className="booking-card">
        <div className="booking-card-header">
          <h3>Activity & Notification Log</h3>
          {notes.length > 0 && (
            <span className="badge badge-info">{notes.length} new</span>
          )}
        </div>

        <div className="notifications-list">
          {notes.length === 0 ? (
            <div className="notification-empty">
              No recent notifications. Booking confirmations and updates will appear here.
            </div>
          ) : (
            notes.map((n, i) => (
              <div key={i} className="notification-card">
                <span className="notification-icon">🔔</span>
                <span className="notification-text">{n}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

