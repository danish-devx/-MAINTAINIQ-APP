const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXZqZGhmeHB6YXdubGl1YmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjE4NDEsImV4cCI6MjA5NjEzNzg0MX0.Qe30ARc6N73YbqLg2YxGgj5fv4jOz9tk-Xa0ycyhxKc";
const supabaseUrl = "https://diivjdhfxpzawnliubbk.supabase.co";
const client = supabase.createClient(supabaseUrl, supabaseKey);

let currentAsset = null;

const loadingState = document.getElementById("loading-state");
const notFoundState = document.getElementById("not-found-state");
const assetContent = document.getElementById("asset-content");

const reportModal = document.getElementById("report-modal");
const reportForm = document.getElementById("report-form");


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

async function loadAsset() {
    const params = new URLSearchParams(window.location.search);
    const assetId = params.get("id");

    if (!assetId) {
        showNotFound();
        return;
    }

    const { data: asset, error } = await client
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .single();

    if (error || !asset) {
        showNotFound();
        return;
    }

    currentAsset = asset;
    renderAsset(asset);
    loadHistory(assetId);
}

function showNotFound() {
    loadingState.style.display = "none";
    notFoundState.style.display = "block";
}


function renderAsset(asset) {
    document.getElementById("asset-name").textContent = asset.name;
    document.getElementById("asset-code").textContent = asset.unique_code;
    document.getElementById("asset-status").textContent = asset.status;
    document.getElementById("asset-category").textContent = asset.category;
    document.getElementById("asset-location").textContent = asset.location;
    document.getElementById("asset-condition").textContent = asset.condition || "--";
    document.getElementById("asset-last-service").textContent = asset.last_service ? new Date(asset.last_service).toLocaleDateString() : "Not yet serviced";
    document.getElementById("asset-next-service").textContent = asset.next_service ? new Date(asset.next_service).toLocaleDateString() : "Not scheduled";

  
    if (asset.status === "Retired") {
        document.getElementById("report-issue-btn").style.display = "none";
    }

    loadingState.style.display = "none";
    assetContent.style.display = "block";
}


async function loadHistory(assetId) {
    const { data: history } = await client
        .from("asset_history")
        .select("action, actor_name, created_at")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });

    const timeline = document.getElementById("history-timeline");

    if (!history || history.length === 0) {
        timeline.innerHTML = `<p class="empty-text">No activity recorded yet.</p>`;
        return;
    }

    timeline.innerHTML = history.map(entry => `
        <div class="timeline-item">
            <div class="timeline-action">${entry.action}</div>
            <div class="timeline-meta">${entry.actor_name} &middot; ${new Date(entry.created_at).toLocaleString()}</div>
        </div>
    `).join("");
}


document.getElementById("report-issue-btn").addEventListener("click", () => {
    reportModal.classList.add("active");
});

function closeReportModal() {
    reportModal.classList.remove("active");
    reportForm.reset();
}

document.getElementById("close-report-modal-btn").addEventListener("click", closeReportModal);
document.getElementById("cancel-report-btn").addEventListener("click", closeReportModal);

reportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentAsset) return;

    const reporterName = document.getElementById("reporter-name").value.trim();
    const description = document.getElementById("issue-description").value.trim();
    const priority = document.getElementById("issue-priority").value;
    const title = description.length > 60 ? description.slice(0, 57) + "..." : description;

    const { data: newIssue, error } = await client
        .from("issues")
        .insert([{
            asset_id: currentAsset.id,
            title,
            description,
            priority,
            reporter_name: reporterName
        }])
        .select()
        .single();

    if (error) {
        Swal.fire(getAlertConfig("error", "Error", "Could not submit your report: " + error.message));
        return;
    }

   
    if (currentAsset.status !== "Retired") {
        await client.from("assets").update({ status: "Issue Reported" }).eq("id", currentAsset.id);
    }

   
    await client.from("asset_history").insert([{
        asset_id: currentAsset.id,
        action: "Issue Reported",
        actor_name: reporterName,
        issue_id: newIssue.id
    }]);

    closeReportModal();
    Swal.fire(getAlertConfig("success", "Thank You!", "Your issue has been reported. Our team will review it shortly.", 2500));

    loadAsset();
});


document.addEventListener("DOMContentLoaded", loadAsset);