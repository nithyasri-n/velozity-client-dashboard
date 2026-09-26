import { useEffect, useState } from "react";
import "./App.css";
import { connectSocket, socket } from "./socket";

const API_URL = "http://localhost:5000";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>(null);

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    socket.on("activity:history", (data) => {
      setActivities(data);
    });

    socket.on("activity:new", (activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 20));
    });

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socket.on("presence:update", (data) => {
      setOnlineCount(data.onlineCount);
    });

    return () => {
      socket.off("activity:history");
      socket.off("activity:new");
      socket.off("notification:new");
      socket.off("presence:update");
    };
  }, []);

  async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function loadDashboard(accessToken: string) {
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      const [projectResponse, taskResponse, notificationResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/projects`, {
            headers,
            credentials: "include",
          }),
          fetch(`${API_URL}/api/tasks`, {
            headers,
            credentials: "include",
          }),
          fetch(`${API_URL}/api/notifications`, {
            headers,
            credentials: "include",
          }),
        ]);

      const projectData = await projectResponse.json();
      const taskData = await taskResponse.json();
      const notificationData = await notificationResponse.json();

      if (projectResponse.ok) {
        setProjects(projectData.projects || []);
      }

      if (taskResponse.ok) {
        setTasks(taskData.tasks || []);
      }

      if (notificationResponse.ok) {
        setNotifications(notificationData.notifications || []);
        setUnreadCount(notificationData.unreadCount || 0);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      setToken(data.accessToken);
      setUser(data.user);

      connectSocket(data.accessToken);

      await loadDashboard(data.accessToken);
    } catch (error) {
      console.error(error);
      setMessage("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function markNotificationRead(id: number) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  }

  async function markAllNotificationsRead() {
    try {
      await apiFetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  }

  if (!user) {
    return (
      <div className="login-container">
        <h1>Velozity Client Dashboard</h1>
        <p>Full Stack Software Developer Assessment</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && <p className="error">{message}</p>}

        <div className="demo-credentials">
          <p>Demo password: Password@123</p>
          <p>Admin: admin@velozity.com</p>
          <p>PM: ravi.pm@velozity.com</p>
          <p>Developer: arun.dev@velozity.com</p>
        </div>
      </div>
    );
  }

  const todoCount = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const reviewCount = tasks.filter(
    (task) => task.status === "IN_REVIEW"
  ).length;

  const doneCount = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const overdueCount = tasks.filter(
    (task) => task.isOverdue
  ).length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Velozity Client Dashboard</h1>
          <p>
            Welcome, <strong>{user.name}</strong>
          </p>
          <p>Role: {user.role}</p>
        </div>

        <div className="notification-summary">
          <strong>Notifications: {unreadCount}</strong>

          {unreadCount > 0 && (
            <button onClick={markAllNotificationsRead}>
              Mark all read
            </button>
          )}
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <strong>{projects.length}</strong>
          <span>Projects</span>
        </div>

        <div className="stat-card">
          <strong>{tasks.length}</strong>
          <span>Total Tasks</span>
        </div>

        <div className="stat-card">
          <strong>{todoCount}</strong>
          <span>To Do</span>
        </div>

        <div className="stat-card">
          <strong>{inProgressCount}</strong>
          <span>In Progress</span>
        </div>

        <div className="stat-card">
          <strong>{reviewCount}</strong>
          <span>In Review</span>
        </div>

        <div className="stat-card">
          <strong>{doneCount}</strong>
          <span>Done</span>
        </div>

        <div className="stat-card">
          <strong>{overdueCount}</strong>
          <span>Overdue</span>
        </div>

        {user.role === "ADMIN" && (
          <div className="stat-card">
            <strong>{onlineCount}</strong>
            <span>Online Users</span>
          </div>
        )}
      </section>

      <main className="dashboard-content">
        <section className="panel">
          <h2>Projects</h2>

          {projects.length === 0 ? (
            <p>No projects available.</p>
          ) : (
            projects.map((project) => (
              <div className="project-card" key={project.id}>
                <h3>
                  #{project.id} — {project.name}
                </h3>

                <p>{project.description}</p>

                <p>
                  <strong>Client:</strong> {project.clientName}
                </p>

                <p>
                  <strong>Tasks:</strong>{" "}
                  {project.tasks?.length ?? 0}
                </p>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>Tasks</h2>

          {tasks.length === 0 ? (
            <p>No tasks available.</p>
          ) : (
            tasks.map((task) => (
              <div className="task-card" key={task.id}>
                <h3>
                  #{task.id} — {task.title}
                </h3>

                <p>{task.description}</p>

                <p>
                  <strong>Status:</strong> {task.status}
                </p>

                <p>
                  <strong>Priority:</strong> {task.priority}
                </p>

                <p>
                  <strong>Due:</strong>{" "}
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "No due date"}
                </p>

                {task.isOverdue && (
                  <p>
                    <strong>⚠ OVERDUE</strong>
                  </p>
                )}

                {task.developer && (
                  <p>
                    <strong>Developer:</strong>{" "}
                    {task.developer.name}
                  </p>
                )}
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>Live Activity Feed</h2>

          {activities.length === 0 ? (
            <p>No activity yet.</p>
          ) : (
            activities.map((activity) => (
              <div className="activity-item" key={activity.id}>
                <p>
                  <strong>{activity.action}</strong>
                </p>

                <p>{activity.details}</p>

                <small>
                  {activity.user?.name || "User"} ·{" "}
                  {new Date(activity.createdAt).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>Notifications</h2>

          {notifications.length === 0 ? (
            <p>No notifications.</p>
          ) : (
            notifications.map((notification) => (
              <div
                className="notification-item"
                key={notification.id}
              >
                <p>{notification.message}</p>

                <small>
                  {new Date(
                    notification.createdAt
                  ).toLocaleString()}
                </small>

                {!notification.isRead && (
                  <button
                    onClick={() =>
                      markNotificationRead(notification.id)
                    }
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

