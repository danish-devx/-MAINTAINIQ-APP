const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXZqZGhmeHB6YXdubGl1YmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjE4NDEsImV4cCI6MjA5NjEzNzg0MX0.Qe30ARc6N73YbqLg2YxGgj5fv4jOz9tk-Xa0ycyhxKc";
const supabaseUrl = "https://diivjdhfxpzawnliubbk.supabase.co";
const client = supabase.createClient(supabaseUrl, supabaseKey);

const STATUS_COLORS = {
    "Operational": "#10b981",
    "Issue Reported": "#ef4444",
    "Under Inspection": "#f59e0b",
    "Under Maintenance": "#7c5dfa",
    "Out of Service": "#f97316",
    "Retired": "#6b6578"
};

const PRIORITY_COLORS = {
    "Low": "#10b981",
    "Medium": "#f59e0b",
    "High": "#f97316",
    "Critical": "#ef4444"
};

let assetsChartInstance = null;
let issuesChartInstance = null;


const getAlertConfig = (icon, title, text, timer = null) => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#0e0b16' : '#f1edf8';
    const textColor = isDark ? '#f3efff' : '#2a2438';
    const accentButton = '#7c5dfa';

    return {
        icon: icon,
        iconColor: icon === 'success' ? '#b3a4ff' : (icon === 'warning' ? '#7c5dfa' : '#ef4444'),
        title: title,
        text: text,
        timer: timer,
        showConfirmButton: timer ? false : true,
        background: bgColor,
        color: textColor,
        confirmButtonColor: accentButton,
        customClass: {
            popup: 'premium-swal-popup',
            icon: 'premium-swal-icon',
            confirmButton: 'premium-swal-button',
            cancelButton: 'premium-swal-cancel-button'
        },
        backdrop: `rgba(14, 11, 22, 0.5) cubic-bezier(0.4, 0, 0.2, 1) blur(6px)`
    };
};

async function guardAdminSession() {
    const { data: { session }, error: sessionError } = await client.auth.getSession();

    if (sessionError || !session) {
        window.location.href = "index.html";
        return;
    }

    const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

    if (profileError || !profile || profile.role !== "admin") {
        window.location.href = "technician.html"; 
        return;
    }
   
    loadDashboard();
}

async function loadDashboard() {
    const { data: assets } = await client.from("assets").select("status");
    const { data: issues } = await client.from("issues").select("priority, status");

    renderStatCards(assets || [], issues || []);
    renderAssetsChart(assets || []);
    renderIssuesChart(issues || []);
    loadRecentIssues();
    loadRecentAssets(); 
}

function renderStatCards(assets, issues) {
    const totalAssets = assets.length;
    const operational = assets.filter(a => a.status === "Operational").length;
    const openIssues = issues.filter(i => i.status !== "Resolved" && i.status !== "Closed").length;
    const criticalIssues = issues.filter(i => i.priority === "Critical" && i.status !== "Resolved" && i.status !== "Closed").length;

    document.getElementById("stat-total-assets").textContent = totalAssets;
    document.getElementById("stat-operational").textContent = operational;
    document.getElementById("stat-open-issues").textContent = openIssues;
    document.getElementById("stat-critical-issues").textContent = criticalIssues;
}

function renderAssetsChart(assets) {
    const counts = {};
    assets.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

    const labels = Object.keys(counts);
    const values = Object.values(counts);
    const colors = labels.map(l => STATUS_COLORS[l] || "#7c5dfa");

    const ctx = document.getElementById("assetsStatusChart");
    if (!ctx) return;

    if (assetsChartInstance) {
        assetsChartInstance.destroy();
    }

    assetsChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { 
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#a0aec0', 
                        padding: 14, 
                        font: { size: 11 } 
                    }
                }
            }
        }
    });
}

function renderIssuesChart(issues) {
    const priorities = ["Low", "Medium", "High", "Critical"];
    const counts = priorities.map(p => issues.filter(i => i.priority === p).length);
    const colors = priorities.map(p => PRIORITY_COLORS[p]);

    const ctx = document.getElementById("issuesPriorityChart");
    if (!ctx) return;

    if (issuesChartInstance) {
        issuesChartInstance.destroy();
    }

    issuesChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: priorities,
            datasets: [{ data: counts, backgroundColor: colors, borderRadius: 8, maxBarThickness: 44 }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { 
                    grid: { display: false }, 
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#a0aec0' } 
                },
                y: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1, color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#a0aec0' }, 
                    grid: { color: "rgba(124,93,250,0.08)" } 
                }
            }
        }
    });
}

async function loadRecentIssues() {
    const { data: issues, error } = await client
        .from("issues")
        .select("issue_number, title, priority, status, assets(name)")
        .order("created_at", { ascending: false })
        .limit(5);

    const tbody = document.getElementById("recent-issues-body");
    if (!tbody) return;

    if (error || !issues || issues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No issues reported yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = issues.map(issue => `
        <tr>
            <td><strong>${issue.issue_number || "--"}</strong></td>
            <td>${issue.title}</td>
            <td>${issue.assets ? issue.assets.name : "--"}</td>
            <td><span class="priority-pill ${issue.priority.toLowerCase()}">${issue.priority}</span></td>
            <td><span class="status-pill">${issue.status}</span></td>
        </tr>
    `).join("");
}

async function loadRecentAssets() {
    const { data: assets, error } = await client
        .from("assets")
        .select("unique_code, name, category, location, status")
        .order("created_at", { ascending: false })
        .limit(5);

    const tbody = document.getElementById("recent-assets-body");
    if (!tbody) return;

    if (error || !assets || assets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No assets registered yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = assets.map(asset => {
        const statusClass = asset.status.toLowerCase().replace(/\s+/g, '-');
        
        return `
            <tr>
                <td><strong>${asset.unique_code || "--"}</strong></td>
                <td>${asset.name}</td>
                <td>${asset.category}</td>
                <td>${asset.location}</td>
                <td><span class="status-pill status-${statusClass}">${asset.status}</span></td>
            </tr>
        `;
    }).join("");
}


const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
       
        const swalConfig = getAlertConfig('warning', 'Confirm Logout', 'Are you sure you want to end your active session?');
        
       
        swalConfig.showCancelButton = true;
        swalConfig.confirmButtonText = 'Yes, Log Out';
        swalConfig.cancelButtonText = 'Cancel';
        swalConfig.cancelButtonColor = '#ef4444';

        const result = await Swal.fire(swalConfig);

        if (result.isConfirmed) {
            await client.auth.signOut();
            window.location.href = "index.html";
        }
    });
}

document.addEventListener("DOMContentLoaded", guardAdminSession);