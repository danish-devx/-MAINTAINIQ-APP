const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXZqZGhmeHB6YXdubGl1YmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjE4NDEsImV4cCI6MjA5NjEzNzg0MX0.Qe30ARc6N73YbqLg2YxGgj5fv4jOz9tk-Xa0ycyhxKc";
const supabaseUrl = "https://diivjdhfxpzawnliubbk.supabase.co";
const client = supabase.createClient(supabaseUrl, supabaseKey);

let loadedIssues = [];
let technicianList = [];
let currentUserName = "Admin";

const issuesGrid = document.getElementById("issues-grid");
const searchInput = document.getElementById("issue-search-input");
const filterPriority = document.getElementById("filter-priority");
const filterStatus = document.getElementById("filter-issue-status");

const issueModal = document.getElementById("issue-modal");
const issueForm = document.getElementById("issue-form");


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

    const { data: profile } = await client
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single();

    if (profile) currentUserName = profile.name;

    await fetchTechnicians();
    await fetchIssues();
}

async function fetchTechnicians() {
    const { data } = await client
        .from("profiles")
        .select("id, name")
        .eq("role", "technician");

    technicianList = data || [];

    const select = document.getElementById("issue-assigned-to");
    select.innerHTML = `<option value="">Unassigned</option>` +
        technicianList.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
}

async function fetchIssues() {
    const { data, error } = await client
        .from("issues")
        .select("*, assets(name)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching issues:", error);
        issuesGrid.innerHTML = `<div class="loading-placeholder"><p>Error fetching issue database.</p></div>`;
        return;
    }

    loadedIssues = data;
    renderIssues(loadedIssues);
}

function renderIssues(issuesList) {
    if (issuesList.length === 0) {
        issuesGrid.innerHTML = `<div class="loading-placeholder"><p>No matching issues found.</p></div>`;
        return;
    }

    issuesGrid.innerHTML = issuesList.map(issue => {
        const priorityClass = issue.priority.toLowerCase();
        const assetName = issue.assets ? issue.assets.name : "Unknown Asset";
        const technician = technicianList.find(t => t.id === issue.assigned_to);
        const techName = technician ? technician.name : "Unassigned";
        const cardClass = issue.priority === "Critical" ? "issue-card critical-flag" : "issue-card";

        return `
            <div class="${cardClass}" data-id="${issue.id}">
                <div class="card-header">
                    <div class="card-title-block">
                        <span class="card-code">${issue.issue_number || "ISS-----"}</span>
                        <h3>${issue.title}</h3>
                    </div>
                    <span class="priority-pill ${priorityClass}">${issue.priority}</span>
                </div>
                <div class="card-body-details">
                    <div class="detail-row">
                        <span class="detail-label">Asset:</span>
                        <span class="detail-value">${assetName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="status-pill">${issue.status}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Assigned To:</span>
                        <span class="detail-value">${techName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Reported:</span>
                        <span class="detail-value">${new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="card-actions-row">
                    <button class="manage-issue-btn" onclick="openIssueModal('${issue.id}')">Manage Issue</button>
                </div>
            </div>
        `;
    }).join("");
}

function performFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const priority = filterPriority.value;
    const status = filterStatus.value;

    const filtered = loadedIssues.filter(issue => {
        const assetName = issue.assets ? issue.assets.name.toLowerCase() : "";
        const matchesSearch = issue.title.toLowerCase().includes(query) ||
                              (issue.issue_number || "").toLowerCase().includes(query) ||
                              assetName.includes(query);

        const matchesPriority = priority === "" || issue.priority === priority;
        const matchesStatus = status === "" || issue.status === status;

        return matchesSearch && matchesPriority && matchesStatus;
    });

    renderIssues(filtered);
}

searchInput.addEventListener("input", performFilters);
filterPriority.addEventListener("change", performFilters);
filterStatus.addEventListener("change", performFilters);

window.openIssueModal = function (id) {
    const issue = loadedIssues.find(i => i.id === id);
    if (!issue) return;

    document.getElementById("issue-id-input").value = issue.id;
    document.getElementById("issue-view-number").textContent = issue.issue_number || "ISS-----";
    document.getElementById("issue-view-asset").textContent = issue.assets ? issue.assets.name : "Unknown Asset";
    document.getElementById("issue-view-title").textContent = issue.title;
    document.getElementById("issue-view-description").textContent = issue.description;

    document.getElementById("issue-priority").value = issue.priority;
    document.getElementById("issue-category").value = issue.category || "";
    document.getElementById("issue-status").value = issue.status;
    document.getElementById("issue-assigned-to").value = issue.assigned_to || "";
    document.getElementById("issue-tech-notes").value = issue.tech_notes || "";
    document.getElementById("issue-cost").value = issue.cost || "";

    issueModal.classList.add("active");
};

function closeIssueModal() {
    issueModal.classList.remove("active");
    issueForm.reset();
}

document.getElementById("close-issue-modal-btn").addEventListener("click", closeIssueModal);
document.getElementById("cancel-issue-modal-btn").addEventListener("click", closeIssueModal);

issueForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const issueId = document.getElementById("issue-id-input").value;
    const priority = document.getElementById("issue-priority").value;
    const category = document.getElementById("issue-category").value.trim();
    const status = document.getElementById("issue-status").value;
    const assignedTo = document.getElementById("issue-assigned-to").value || null;
    const techNotes = document.getElementById("issue-tech-notes").value.trim();
    const cost = parseFloat(document.getElementById("issue-cost").value) || 0;

    if ((status === "Resolved" || status === "Closed") && !techNotes) {
        Swal.fire(getAlertConfig("warning", "Note Required", "Add a maintenance note before marking this issue Resolved or Closed."));
        return;
    }

    if (cost < 0) {
        Swal.fire(getAlertConfig("error", "Invalid Cost", "Maintenance cost cannot be negative."));
        return;
    }

    const issue = loadedIssues.find(i => i.id === issueId);

    const { error } = await client
        .from("issues")
        .update({
            priority,
            category,
            status,
            assigned_to: assignedTo,
            tech_notes: techNotes,
            cost
        })
        .eq("id", issueId);

    if (error) {
        Swal.fire(getAlertConfig("error", "Update Failed", "Could not update issue: " + error.message));
        return;
    }

    if (issue && issue.status !== status) {
        await client.from("asset_history").insert([{
            asset_id: issue.asset_id,
            action: `Issue status changed to ${status}`,
            actor_name: currentUserName,
            issue_id: issueId
        }]);
    }

    Swal.fire(getAlertConfig("success", "Saved", "Issue parameters updated successfully.", 1500));
    closeIssueModal();
    fetchIssues();
});

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