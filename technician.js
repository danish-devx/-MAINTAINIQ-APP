const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXZqZGhmeHB6YXdubGl1YmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjE4NDEsImV4cCI6MjA5NjEzNzg0MX0.Qe30ARc6N73YbqLg2YxGgj5fv4jOz9tk-Xa0ycyhxKc";
const supabaseUrl = "https://diivjdhfxpzawnliubbk.supabase.co";
const client = supabase.createClient(supabaseUrl, supabaseKey);


let currentUser = null;
let technicianName = "Technician";
let assignedIssues = [];


const issuesGrid = document.getElementById("issues-grid");
const searchInput = document.getElementById("issue-search");
const filterStatus = document.getElementById("filter-status");
const techNameDisplay = document.getElementById("tech-name");


const actionModal = document.getElementById("action-modal");
const actionForm = document.getElementById("action-form");
const statusDropdown = document.getElementById("modal-status");
const resolutionFields = document.getElementById("resolution-fields");
const uploadProgressBar = document.querySelector(".progress-bar");
const uploadProgressContainer = document.getElementById("upload-progress-bar");


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


async function checkTechnicianSession() {
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
        window.location.href = "index.html";
        return;
    }

    currentUser = session.user;

    
    const { data: profile, error } = await client
        .from("profiles")
        .select("name, role")
        .eq("id", currentUser.id)
        .single();

    if (error || !profile) {
        console.error("Profile not found:", error);
        technicianName = currentUser.email.split('@')[0];
    } else {
        technicianName = profile.name;
    }

    techNameDisplay.textContent = technicianName;
    fetchTechnicianTasks();
}


async function fetchTechnicianTasks() {
   
    const { data, error } = await client
        .from("issues")
        .select(`
            *,
            assets (
                name,
                unique_code,
                location
            )
        `)
        .eq("assigned_to", currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching tasks:", error);
        issuesGrid.innerHTML = `
            <div class="empty-row" style="color: #f87171; padding: 20px; text-align: center;">
                <p><strong>Error loading tasks:</strong> ${error.message}</p>
            </div>`;
        return;
    }

    assignedIssues = data || [];
    renderTasks(assignedIssues);
    updateStatsDashboard();
}


function renderTasks(list) {
    if (list.length === 0) {
        issuesGrid.innerHTML = `
            <div class="empty-row" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
                <p>No assigned active work orders found.</p>
            </div>
        `;
        return;
    }

    issuesGrid.innerHTML = list.map(issue => {
        const assetName = issue.assets ? issue.assets.name : "Unknown Asset";
        const assetCode = issue.assets ? issue.assets.unique_code : "N/A";
        const dateCreated = new Date(issue.created_at).toLocaleDateString();
        
        let statusClass = "status-assigned";
        if (issue.status === "Under Inspection") statusClass = "status-inspection";
        if (issue.status === "Under Maintenance") statusClass = "status-maintenance";
        if (issue.status === "Resolved") statusClass = "status-resolved";

        return `
            <div class="tech-issue-card" data-id="${issue.id}">
                <div class="issue-header">
                    <div class="issue-title">
                        <h3>${assetName}</h3>
                        <span class="issue-asset-code">${assetCode}</span>
                    </div>
                    <span class="status-pill ${statusClass}">${issue.status}</span>
                </div>
                <div class="issue-body">
                    <p><strong>Issue Description:</strong><br>${issue.description}</p>
                    <div class="meta-details">
                        <div class="meta-row">
                            <span class="meta-label">Reported On:</span>
                            <span class="meta-val">${dateCreated}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Priority:</span>
                            <span class="meta-val" style="color: ${issue.priority === 'Critical' ? '#f87171' : '#fcd34d'}">${issue.priority}</span>
                        </div>
                    </div>
                </div>
                ${issue.status !== "Resolved" ? `
                    <button class="action-btn" onclick="openActionModal('${issue.id}', '${issue.asset_id}', '${issue.status}')">
                        Update Status
                    </button>
                ` : `<button class="action-btn" style="background: rgba(52, 211, 153, 0.15); color: #34d399; cursor: default; box-shadow: none;" disabled>Completed ✓</button>`}
            </div>
        `;
    }).join("");
}


function updateStatsDashboard() {
    const assigned = assignedIssues.filter(i => i.status === "Assigned").length;
    const inProgress = assignedIssues.filter(i => i.status === "Under Inspection" || i.status === "Under Maintenance").length;
    const resolved = assignedIssues.filter(i => i.status === "Resolved").length;

    document.getElementById("stat-assigned").textContent = assigned;
    document.getElementById("stat-progress").textContent = inProgress;
    document.getElementById("stat-resolved").textContent = resolved;
}


function runLiveFilters() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const statusVal = filterStatus.value;

    const filtered = assignedIssues.filter(issue => {
        const assetName = issue.assets ? issue.assets.name.toLowerCase() : "";
        const assetCode = issue.assets ? issue.assets.unique_code.toLowerCase() : "";
        const issueDesc = issue.description.toLowerCase();

        const matchesSearch = assetName.includes(searchVal) || assetCode.includes(searchVal) || issueDesc.includes(searchVal);
        const matchesStatus = (statusVal === "all") || (issue.status === statusVal);

        return matchesSearch && matchesStatus;
    });

    renderTasks(filtered);
}

searchInput.addEventListener("input", runLiveFilters);
filterStatus.addEventListener("change", runLiveFilters);


window.openActionModal = function(issueId, assetId, currentStatus) {
    document.getElementById("modal-issue-id").value = issueId;
    document.getElementById("modal-asset-id").value = assetId;
    statusDropdown.value = currentStatus === "Assigned" ? "Under Inspection" : currentStatus;
    
    toggleResolutionFields();
    actionModal.classList.add("active");
};

function closeModal() {
    actionModal.classList.remove("active");
    actionForm.reset();
    if (uploadProgressBar) uploadProgressBar.style.width = "0%";
    if (uploadProgressContainer) uploadProgressContainer.style.display = "none";
}

document.getElementById("close-modal-btn").addEventListener("click", closeModal);
document.getElementById("cancel-modal-btn").addEventListener("click", closeModal);

function toggleResolutionFields() {
    if (statusDropdown.value === "Resolved") {
        resolutionFields.classList.add("active");
        document.getElementById("modal-notes").required = true;
    } else {
        resolutionFields.classList.remove("active");
    }
}
statusDropdown.addEventListener("change", toggleResolutionFields);


actionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const issueId = document.getElementById("modal-issue-id").value;
    const assetId = document.getElementById("modal-asset-id").value;
    const selectedStatus = statusDropdown.value;
    const notes = document.getElementById("modal-notes").value.trim();
    
    let parts = "";
    let costVal = null;
    let evidenceUrlVal = null;

    if (selectedStatus === "Resolved") {
        parts = document.getElementById("modal-parts").value.trim();
        costVal = parseFloat(document.getElementById("modal-cost").value) || 0;
        const fileInput = document.getElementById("modal-evidence");

      
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${issueId}_${Date.now()}.${fileExt}`;
            const filePath = `evidence/${fileName}`;

            if (uploadProgressContainer) uploadProgressContainer.style.display = "block";
            if (uploadProgressBar) uploadProgressBar.style.width = "40%";

            const { data: uploadData, error: uploadError } = await client.storage
                .from("evidence-bucket")
                .upload(filePath, file);

            if (uploadError) {
                Swal.fire(getAlertConfig("error", "Upload Error", "Failed to store evidence photo: " + uploadError.message));
                if (uploadProgressContainer) uploadProgressContainer.style.display = "none";
                return;
            }

            if (uploadProgressBar) uploadProgressBar.style.width = "100%";

            const { data: { publicUrl } } = client.storage
                .from("evidence-bucket")
                .getPublicUrl(filePath);

            evidenceUrlVal = publicUrl;
        }
    }

    
    const updatePayload = {
        status: selectedStatus,
        tech_notes: notes 
    };

    if (selectedStatus === "Resolved") {
       
        updatePayload.cost = costVal; 
        if (evidenceUrlVal) updatePayload.evidence_url = evidenceUrlVal; 
    }

    const { error: issueError } = await client
        .from("issues")
        .update(updatePayload)
        .eq("id", issueId);

    if (issueError) {
        Swal.fire(getAlertConfig("error", "Update Error", "Failed to update issue profile: " + issueError.message));
        return;
    }

    
    let assetStatusUpdate = "Operational";
    if (selectedStatus === "Under Inspection") assetStatusUpdate = "Under Inspection";
    if (selectedStatus === "Under Maintenance") assetStatusUpdate = "Under Maintenance";

    const { error: assetError } = await client
        .from("assets")
        .update({ status: assetStatusUpdate })
        .eq("id", assetId);

    if (assetError) {
        console.error("Failed syncing asset status updates:", assetError);
    }

   
    await client.from("asset_history").insert([{
        asset_id: assetId,
        action: `Issue ${selectedStatus}`,
        actor_name: technicianName,
        notes: notes
    }]);

    Swal.fire(getAlertConfig("success", "Success", `Status updated successfully to ${selectedStatus}!`, 1500));
    closeModal();
    fetchTechnicianTasks();
});


document.getElementById("logout-btn").addEventListener("click", async () => {
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


document.addEventListener("DOMContentLoaded", checkTechnicianSession);
