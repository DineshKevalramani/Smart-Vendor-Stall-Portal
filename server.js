const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Fake "database"
const USERS = {
    "3421": {
        empId: "3421",
        password: "test123", // demo only
        name: "Shree Snacks",
        zone: "A",
        stallId: "A-02",
        stallType: "Food",
        email: "vendor@example.com",
        phone: "+91-98765-43210",
        altPhone: "+91-98765-00000",
        city: "Ahmedabad",
        state: "Gujarat",
        businessCategory: "Food Stall Vendor",
        docs: [
            {
                type: "Aadhaar",
                id: "XXXX-XXXX-1234",
                uploadedOn: "15 Jan 2026",
                status: "Verified"
            },
            {
                type: "PAN",
                id: "ABCDE1234F",
                uploadedOn: "15 Jan 2026",
                status: "Verified"
            }
        ],
        history: [
            { date: "03 Apr 2026", time: "10:00 AM", action: "Check-in", stall: "A-02", zone: "Zone A" },
            { date: "02 Apr 2026", time: "09:10 PM", action: "Check-out", stall: "A-02", zone: "Zone A" },
            { date: "01 Apr 2026", time: "10:05 AM", action: "Check-in", stall: "A-02", zone: "Zone A" }
        ]
    }
};

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

function authMiddleware(req, res, next) {
    const empId = req.cookies.empId;
    if (!empId || !USERS[empId]) {
        return res.status(401).json({ error: "Not logged in" });
    }
    req.user = USERS[empId];
    next();
}

// Routes

// POST /login
app.post("/login", (req, res) => {
    const { empId, password } = req.body;
    const user = USERS[empId];
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    // Set simple cookie session
    res.cookie("empId", empId, { httpOnly: true });
    res.json({ success: true });
});

// POST /signup
app.post("/signup", (req, res) => {
    const userData = req.body;
    // Generate a simple Emp ID for demo
    const empId = Math.floor(1000 + Math.random() * 9000).toString();
    
    USERS[empId] = {
        empId: empId,
        password: "password123", // Default password for new signups in this demo
        name: `${userData.firstName} ${userData.lastName}`,
        zone: userData.preferredZones || "Pending",
        stallId: "Unassigned",
        stallType: "N/A",
        email: userData.email,
        phone: userData.phone || "N/A",
        history: [],
        ...userData
    };

    res.json({ success: true, empId: empId });
});

// POST /logout
app.post("/logout", (req, res) => {
    res.clearCookie("empId");
    res.json({ success: true });
});

// GET /api/dashboard
app.get("/api/dashboard", authMiddleware, (req, res) => {
    const u = req.user;
    res.json({
        empId: u.empId,
        name: u.name,
        zone: u.zone,
        stallId: u.stallId,
        stallType: u.stallType,
        history: u.history || [],
        maintenance: u.maintenance || [],
        availableStalls: [
            { stall: "A-05", type: "Food", equipment: "Counter, Sockets, Fan", status: "Available" },
            { stall: "A-09", type: "General", equipment: "Counter, Shelves, Light", status: "Available" },
            { stall: "A-11", type: "Food", equipment: "Fridge, Burner, Sockets", status: "Available" }
        ]
    });
});

// GET /api/profile
app.get("/api/profile", authMiddleware, (req, res) => {
    const u = req.user;
    res.json({
        empId: u.empId,
        name: u.name,
        zone: u.zone,
        stallId: u.stallId,
        stallType: u.stallType,
        email: u.email,
        phone: u.phone,
        altPhone: u.altPhone,
        city: u.city,
        state: u.state,
        businessCategory: u.businessCategory,
        accountStatus: "Active",
        docs: u.docs || []
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});