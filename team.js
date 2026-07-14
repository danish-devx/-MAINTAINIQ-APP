const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXZqZGhmeHB6YXdubGl1YmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjE4NDEsImV4cCI6MjA5NjEzNzg0MX0.Qe30ARc6N73YbqLg2YxGgj5fv4jOz9tk-Xa0ycyhxKc";
const supabaseUrl = "https://diivjdhfxpzawnliubbk.supabase.co";
const client = supabase.createClient(supabaseUrl, supabaseKey);

const teamGrid = document.getElementById("team-grid");


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

async function guardPageSession() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        window.location.href = "index.html";
        return;
    }
    loadTeam();
}

async function loadTeam() {
    const { data: profiles, error } = await client
        .from("profiles")
        .select("id, name, role, email")
        .order("role", { ascending: false }); 

    if (error || !profiles) {
        teamGrid.innerHTML = `<div class="loading-placeholder"><p>Error fetching team roster.</p></div>`;
        return;
    }

    const { data: issues } = await client
        .from("issues")
        .select("assigned_to, status");

    renderTeam(profiles, issues || []);
}

function renderTeam(profiles, issues) {
    if (profiles.length === 0) {
        teamGrid.innerHTML = `<div class="loading-placeholder"><p>No team members found.</p></div>`;
        return;
    }

    teamGrid.innerHTML = profiles.map(person => {
        const initials = person.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

        const assignedIssues = issues.filter(i => i.assigned_to === person.id);
        const openCount = assignedIssues.filter(i => i.status !== "Resolved" && i.status !== "Closed").length;
        const resolvedCount = assignedIssues.filter(i => i.status === "Resolved" || i.status === "Closed").length;

        const workloadBlock = person.role === "technician" ? `
            <div class="team-stats-row">
                <div class="team-stat">
                    <span class="team-stat-value">${openCount}</span>
                    <span class="team-stat-label">Open</span>
                </div>
                <div class="team-stat">
                    <span class="team-stat-value">${resolvedCount}</span>
                    <span class="team-stat-label">Resolved</span>
                </div>
            </div>
        ` : "";

        return `
            <div class="team-card">
                <div class="team-avatar">${initials}</div>
                <span class="team-name">${person.name}</span>
                <span class="team-email">${person.email || "--"}</span>
                <span class="role-badge ${person.role}">${person.role}</span>
                ${workloadBlock}
            </div>
        `;
    }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  
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

    const toggleBtn = document.getElementById("sidebar-toggle-btn");
    const sidebar = document.getElementById("dashboard-sidebar");
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("mobile-open");
        });
        document.addEventListener("click", (e) => {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove("mobile-open");
            }
        });
    }

    guardPageSession();
});