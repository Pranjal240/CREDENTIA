import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  Outlet,
} from "react-router-dom";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  UserCheck,
  Globe,
  LogOut,
  Search,
  Filter,
  Eye,
  CheckCircle,
  UploadCloud,
  Link as LinkIcon,
  Loader,
  Lock,
  ChevronRight,
  User,
  Briefcase,
  ArrowRight,
  Home,
} from "lucide-react";
import "./App.css";
import logo from "./logo.jpeg";

// --- 1. DATA GENERATOR ---
const generateData = () => {
  const firstNames = [
    "Aarav",
    "Vivaan",
    "Aditya",
    "Vihaan",
    "Arjun",
    "Sai",
    "Reyansh",
    "Ayan",
    "Krishna",
    "Ishaan",
    "Diya",
    "Saanvi",
    "Anaya",
    "Aadhya",
    "Pari",
    "Anvi",
    "Myra",
    "Riya",
    "Aanya",
    "Kiara",
  ];
  const lastNames = [
    "Sharma",
    "Verma",
    "Patel",
    "Singh",
    "Gupta",
    "Malhotra",
    "Bhatia",
    "Saxena",
    "Reddy",
    "Nair",
    "Joshi",
    "Mehta",
    "Desai",
    "Jain",
    "Chopra",
  ];
  const types = [
    "Resume Check",
    "Police Verification",
    "Aadhaar KYC",
    "Global DB Check",
  ];
  const statuses = ["Verified", "Pending", "Rejected"];

  const data = Array.from({ length: 50 }, (_, i) => ({
    id: `REQ-${1000 + i}`,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    date: `2026-02-${(i % 28) + 1}`,
    email: `student${i}@example.com`,
    trustScore: Math.floor(Math.random() * (100 - 60) + 60),
    owner: "admin",
  }));

  // Demo User Data
  data.unshift(
    {
      id: "REQ-9991",
      name: "Pranjal (You)",
      type: "Resume Check",
      status: "Verified",
      date: "2026-02-12",
      trustScore: 98,
      owner: "user",
    },
    {
      id: "REQ-9992",
      name: "Pranjal (You)",
      type: "Police Verification",
      status: "Pending",
      date: "2026-02-11",
      trustScore: 0,
      owner: "user",
    },
    {
      id: "REQ-9993",
      name: "Pranjal (You)",
      type: "Global DB Check",
      status: "Rejected",
      date: "2026-02-10",
      trustScore: 45,
      owner: "user",
    },
  );
  return data;
};

const ALL_DATA = generateData();

// --- 2. PUBLIC COMPONENTS ---
const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="public-nav">
      <div className="nav-container">
        <Link to="/" className="brand">
          <img src={logo} alt="Credentia" className="nav-logo" />
          <span>CREDENTIA</span>
        </Link>

        {/* Desktop Links */}
        <div className={`nav-links ${isOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setIsOpen(false)}>
            Home
          </Link>
          <a href="/#services" onClick={() => setIsOpen(false)}>
            Services
          </a>
          <Link
            to="/login-selection"
            className="btn-primary small"
            onClick={() => setIsOpen(false)}
          >
            Login / Sign Up
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

// --- 3. LOGIN PAGES ---
const LoginSelection = () => (
  <div className="login-bg">
    <div className="selection-container fade-in">
      <Link to="/" className="back-link">
        ← Back to Home
      </Link>
      <h1>Select Portal</h1>
      <p className="subtitle">Choose your access level to continue</p>
      <div className="login-options-grid">
        <Link to="/login/user" className="login-option-card">
          <div className="icon-circle green">
            <User size={28} />
          </div>
          <h3>Student / User</h3>
          <p>Track your verification status.</p>
          <span className="fake-btn">Login as User →</span>
        </Link>
        <Link to="/login/admin" className="login-option-card">
          <div className="icon-circle blue">
            <Briefcase size={28} />
          </div>
          <h3>Admin / Partner</h3>
          <p>Manage student records.</p>
          <span className="fake-btn">Login as Admin →</span>
        </Link>
      </div>
    </div>
  </div>
);

const LoginPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const isUser = role === "user";

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem("userRole", role);
    navigate(isUser ? "/user-dashboard" : "/admin-dashboard");
  };

  return (
    <div className="login-bg">
      <div className="login-card fade-in">
        <div className="login-header">
          <img src={logo} alt="Logo" className="login-logo-img" />
          <h2>{isUser ? "User Portal" : "Admin Console"}</h2>
          <p>Secure Access for {isUser ? "Students" : "Staff"}</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder={isUser ? "user@example.com" : "admin@credentia.com"}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required />
          </div>
          <button className="btn-primary full">Sign In</button>
        </form>
        <div className="login-footer">
          <Link to="/login-selection">Switch Account Type</Link>
        </div>
      </div>
    </div>
  );
};

// --- 4. UPLOAD PAGE ---
const ServiceTool = () => {
  const { type } = useParams();
  const [mode, setMode] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const info = {
    resume: { title: "Resume Check", icon: FileText, color: "blue" },
    police: { title: "Police Check", icon: Shield, color: "red" },
    aadhaar: { title: "Aadhaar KYC", icon: UserCheck, color: "green" },
    global: { title: "Global DB", icon: Globe, color: "purple" },
  }[type] || { title: "Verification", icon: Shield, color: "blue" };

  const handleVerify = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResult("success");
    }, 2000);
  };

  const Icon = info.icon;

  return (
    <div className="tool-page fade-in">
      <PublicNavbar />
      <div className="tool-container">
        <div className="tool-header">
          <div className={`icon-circle ${info.color}`}>
            <Icon size={32} />
          </div>
          <h1>{info.title}</h1>
          <p>Upload documents or link for instant AI verification.</p>
        </div>
        <div className="tool-card">
          <div className="tool-tabs">
            <button
              className={`tab-btn ${mode === "upload" ? "active" : ""}`}
              onClick={() => {
                setMode("upload");
                setResult(null);
              }}
            >
              <UploadCloud size={18} /> Upload
            </button>
            <button
              className={`tab-btn ${mode === "link" ? "active" : ""}`}
              onClick={() => {
                setMode("link");
                setResult(null);
              }}
            >
              <LinkIcon size={18} /> Link
            </button>
          </div>
          <div className="tool-body">
            {loading ? (
              <div className="status-box">
                <Loader className="spin" size={48} />
                <h3>Verifying...</h3>
              </div>
            ) : result === "success" ? (
              <div className="status-box success">
                <CheckCircle size={56} className="text-success" />
                <h3>Verified!</h3>
                <button
                  className="btn-secondary"
                  onClick={() => setResult(null)}
                >
                  Check Another
                </button>
              </div>
            ) : mode === "upload" ? (
              <div className="drop-zone" onClick={handleVerify}>
                <div className="upload-circle">
                  <UploadCloud size={32} />
                </div>
                <h3>Click to Upload</h3>
                <p>PDF, JPG, PNG</p>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="link-form">
                <input type="url" placeholder="Paste Link Here" required />
                <button className="btn-primary full">Check Link</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 5. DASHBOARD COMPONENTS ---
const Sidebar = ({ role, isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={toggleSidebar}
      ></div>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Logo" className="sidebar-logo" />
          <span className="brand-name">CREDENTIA</span>
          <button className="menu-btn mobile-close" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-menu">
          {role === "admin" ? (
            <>
              <Link
                to="/admin-dashboard"
                className="nav-item"
                onClick={toggleSidebar}
              >
                <LayoutDashboard size={20} /> Dashboard
              </Link>
              <Link
                to="/admin-dashboard/records"
                className="nav-item"
                onClick={toggleSidebar}
              >
                <Users size={20} /> Records
              </Link>
            </>
          ) : (
            <Link
              to="/user-dashboard"
              className="nav-item"
              onClick={toggleSidebar}
            >
              <User size={20} /> My Status
            </Link>
          )}
          <div className="sidebar-footer">
            <button
              onClick={() => {
                localStorage.removeItem("userRole");
                navigate("/login-selection");
              }}
              className="logout-btn"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

// ** USER DASHBOARD **
const UserDashboard = () => {
  const myData = ALL_DATA.filter((d) => d.owner === "user");
  return (
    <div className="fade-in">
      <div className="dashboard-head">
        <h1>My Verifications</h1>
        <p>Track the live status of your submitted documents.</p>
      </div>
      <div className="user-grid">
        {myData.map((d) => (
          <div key={d.id} className="user-card">
            <div className="card-header-row">
              <span className="req-id">{d.id}</span>
              <span className={`status-pill ${d.status.toLowerCase()}`}>
                {d.status}
              </span>
            </div>
            <div className="card-body">
              <h3>{d.type}</h3>
              <div className="score-row">
                <span>
                  Trust Score: <strong>{d.trustScore}%</strong>
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${d.trustScore}%`,
                    backgroundColor:
                      d.trustScore > 80
                        ? "#10b981"
                        : d.trustScore > 50
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                ></div>
              </div>
            </div>
            <div className="card-footer">
              <button className="view-details-btn">
                View Details <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ** ADMIN RECORDS **
const AdminRecords = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const filtered = ALL_DATA.filter(
    (d) =>
      (filter === "All" || d.status === filter) &&
      d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fade-in">
      <div className="flex-head">
        <h1>Student Records</h1>
        <div className="filters">
          <input
            className="search-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td className="mono">{d.id}</td>
                <td className="bold">{d.name}</td>
                <td>{d.type}</td>
                <td>{d.trustScore}%</td>
                <td>
                  <span className={`status-pill ${d.status.toLowerCase()}`}>
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Layout & Other Components
const DashboardLayout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem("userRole") !== role) navigate("/login-selection");
  }, [role, navigate]);

  return (
    <div className="dashboard-layout">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(false)}
      />
      <div className="dashboard-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="user-badge">
            <div className="avatar">{role[0].toUpperCase()}</div>{" "}
            {role === "admin" ? "Admin" : "User"}
          </div>
        </header>
        <div className="p-30">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AdminOverview = () => (
  <div className="fade-in">
    <h1>Admin Overview</h1>
    <div className="stats-row">
      <div className="stat-box">
        <h3>{ALL_DATA.length}</h3>
        <p>Total Records</p>
      </div>
      <div className="stat-box success">
        <h3>{ALL_DATA.filter((d) => d.status === "Verified").length}</h3>
        <p>Verified</p>
      </div>
      <div className="stat-box warning">
        <h3>{ALL_DATA.filter((d) => d.status === "Pending").length}</h3>
        <p>Pending</p>
      </div>
    </div>
  </div>
);

// --- 6. HOME PAGE (Fixed) ---
const HomePage = () => (
  <div className="fade-in">
    <PublicNavbar />
    <header className="hero">
      <div className="hero-content">
        <h1>
          Trust, But <span className="text-primary">Verify.</span>
        </h1>
        <p className="hero-sub">
          The global standard for background checks. Authenticate Resumes,
          Police Records, and IDs with AI-powered precision.
        </p>
        <div className="hero-actions">
          <a href="#services" className="btn-primary large">
            Start Verification
          </a>
          <Link to="/login-selection" className="btn-secondary large">
            Login
          </Link>
        </div>
      </div>
    </header>

    <section id="services" className="section-pad">
      <div className="text-center">
        <h2>Our Services</h2>
        <p>Select a tool to begin.</p>
      </div>
      <div className="grid-4">
        <Link to="/service/resume" className="service-box">
          <div className="icon blue">
            <FileText />
          </div>
          <h3>Resume Check</h3>
          <p>Verify history.</p>
          <span className="link">
            Start <ChevronRight size={16} />
          </span>
        </Link>
        <Link to="/service/police" className="service-box">
          <div className="icon red">
            <Shield />
          </div>
          <h3>Police Check</h3>
          <p>Criminal records.</p>
          <span className="link">
            Start <ChevronRight size={16} />
          </span>
        </Link>
        <Link to="/service/aadhaar" className="service-box">
          <div className="icon green">
            <UserCheck />
          </div>
          <h3>Aadhaar KYC</h3>
          <p>Valid ID check.</p>
          <span className="link">
            Start <ChevronRight size={16} />
          </span>
        </Link>
        <Link to="/service/global" className="service-box">
          <div className="icon purple">
            <Globe />
          </div>
          <h3>Global DB</h3>
          <p>World screening.</p>
          <span className="link">
            Start <ChevronRight size={16} />
          </span>
        </Link>
      </div>
    </section>
  </div>
);

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login-selection" element={<LoginSelection />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/service/:type" element={<ServiceTool />} />
      <Route path="/admin-dashboard" element={<DashboardLayout role="admin" />}>
        <Route index element={<AdminOverview />} />
        <Route path="records" element={<AdminRecords />} />
      </Route>
      <Route path="/user-dashboard" element={<DashboardLayout role="user" />}>
        <Route index element={<UserDashboard />} />
      </Route>
    </Routes>
  </Router>
);

export default App;
