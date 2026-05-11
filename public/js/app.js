// Toggle profile dropdown
document.addEventListener("DOMContentLoaded", () => {
    const avatar = document.getElementById("profileAvatar");
    const menu = document.getElementById("profileMenu");

    if (avatar && menu) {
        avatar.addEventListener("click", () => {
            const visible = menu.style.display === "block";
            menu.style.display = visible ? "none" : "block";
        });

        document.addEventListener("click", (e) => {
            if (!menu.contains(e.target) && !avatar.contains(e.target)) {
                menu.style.display = "none";
            }
        });
    }

    // Login form handler
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const empId = document.getElementById("empId").value.trim();
            const password = document.getElementById("password").value.trim();
            const errorBox = document.getElementById("loginError");
            if (errorBox) errorBox.textContent = "";

            try {
                const res = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ empId, password })
                });
                if (!res.ok) {
                    const data = await res.json();
                    if (errorBox) errorBox.textContent = data.error || "Login failed";
                    return;
                }
                window.location.href = "user-dashboard.html";
            } catch (err) {
                if (errorBox) errorBox.textContent = "Network error";
            }
        });
    }

    // Signup form handler
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());
            const authMessage = document.getElementById("authMessage");

            try {
                const res = await fetch("/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
                const result = await res.json();
                if (res.ok) {
                    if (authMessage) {
                        authMessage.innerHTML = `Registration successful! <br>Your Employee ID is: <strong>${result.empId}</strong><br>Please login with this ID and password 'password123'.`;
                        authMessage.style.display = "block";
                    }
                    if (typeof showLogin === "function") showLogin();
                } else {
                    alert(result.error || "Signup failed");
                }
            } catch (err) {
                alert("Network error during signup");
            }
        });
    }

    // Dashboard Data Fetching
    const hasTopbarInfo = document.querySelector(".topbar-info");
    const isDashboard = window.location.pathname.includes("user-dashboard.html");
    
    if (hasTopbarInfo || isDashboard) {
        fetchDashboardData();
    }

    async function fetchDashboardData() {
        try {
            const res = await fetch("/api/dashboard");
            if (!res.ok) {
                if (res.status === 401) window.location.href = "index.html";
                return;
            }
            const data = await res.json();
            renderDashboard(data);
        } catch (err) {
            console.error("Error fetching dashboard:", err);
        }
    }

    function renderDashboard(data) {
        // Update topbar
        const empIdPill = document.querySelector(".info-pill:nth-child(2)");
        if (empIdPill) empIdPill.textContent = `Emp ID: ${data.empId}`;
        const zonePill = document.querySelector(".info-pill:nth-child(1)");
        if (zonePill) zonePill.textContent = `Zone: ${data.zone}`;

        // Update Stall Details
        const stallName = document.querySelector(".stall-name");
        const stallMeta = document.querySelector(".stall-meta");
        const equipList = document.querySelector(".equipment-list");
        const manualInput = document.getElementById("manualStallInput");

        if (stallName) {
            if (data.stallId === "Unassigned") {
                stallName.textContent = "No Active Stall Assigned";
                if (stallMeta) stallMeta.textContent = "You are currently not checked into any stall.";
                if (equipList) equipList.innerHTML = "<li style='color:var(--muted)'>N/A</li>";
                if (manualInput) manualInput.style.display = "block";
            } else {
                stallName.textContent = `Stall ${data.stallId} · Zone ${data.zone}`;
                if (stallMeta) stallMeta.textContent = `Status: Active · Shift: 10 AM - 9 PM · Type: ${data.stallType || 'Food'}`;
                if (equipList) {
                    equipList.innerHTML = `
                        <li>Power Sockets (6)</li>
                        <li>Lighting (2)</li>
                        <li>Display Counter (1)</li>
                        ${data.stallType === 'Food' ? '<li>Water Connection (1)</li><li>Gas Point (1)</li>' : ''}
                    `;
                }
                if (manualInput) manualInput.style.display = "none";
            }
        }

        // Update History Table
        const historyBody = document.querySelector(".simple-table tbody");
        if (historyBody) {
            if (!data.history || data.history.length === 0) {
                historyBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:var(--muted); padding: 20px;'>No activity history found</td></tr>";
            } else {
                historyBody.innerHTML = data.history.map(h => `
                    <tr>
                        <td>${h.date}</td>
                        <td>${h.time}</td>
                        <td>${h.action}</td>
                        <td>${h.stall}</td>
                        <td>${h.zone}</td>
                    </tr>
                `).join("");
            }
        }

        // Update Available Stalls Table
        const availableStallsBody = document.querySelector("#availableStallsTable tbody");
        if (availableStallsBody && data.availableStalls) {
            availableStallsBody.innerHTML = data.availableStalls.map(s => `
                <tr>
                    <td>${s.stall}</td>
                    <td>${s.type}</td>
                    <td>${s.equipment}</td>
                    <td><span style="color: #2e7d32; font-weight:600;">${s.status}</span></td>
                </tr>
            `).join("");
        }

        // Update Stats
        const statValues = document.querySelectorAll(".stat-value");
        if (statValues.length >= 4) {
            statValues[0].textContent = data.history ? data.history.filter(h => h.action === "Check-in").length : 0;
            statValues[1].textContent = data.history ? data.history.filter(h => h.action === "Check-out").length : 0;
            statValues[2].textContent = data.stallId === "Unassigned" ? "Inactive" : "Active";
            statValues[3].textContent = data.zone;
        }

        // Update Maintenance
        const maintList = document.getElementById("maintenanceLogs");
        if (maintList && data.maintenance) {
            if (data.maintenance.length === 0) {
                maintList.innerHTML = "<li style='color: var(--muted); font-size: 0.85rem;'>No active maintenance issues</li>";
            } else {
                maintList.innerHTML = data.maintenance.map(m => `
                    <li><span class="log-label">${m.issue}</span><span class="log-value">${m.status} (Raised: ${m.raisedOn})</span></li>
                `).join("");
            }
        }
    }

    // Manual Stall Input Handler
    const stallInputForm = document.getElementById("stallInputForm");
    if (stallInputForm) {
        stallInputForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const stallId = document.getElementById("manualStallId").value.trim();
            if (!stallId) return;

            try {
                // In a real app, this would be a POST to /api/check-in
                alert(`Checking in to stall ${stallId}... (Demo only)`);
                // Simulate update
                const res = await fetch("/api/dashboard");
                const data = await res.json();
                data.stallId = stallId;
                data.stallType = "Food"; // Default for demo
                renderDashboard(data);
            } catch (err) {
                console.error(err);
            }
        });
    }

    // Logout link/button
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
        logoutLink.addEventListener("click", async (e) => {
            e.preventDefault();
            await fetch("/logout", { method: "POST" });
            window.location.href = "index.html";
        });
    }
});