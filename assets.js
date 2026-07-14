const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXZqZGhmeHB6YXdubGl1YmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjE4NDEsImV4cCI6MjA5NjEzNzg0MX0.Qe30ARc6N73YbqLg2YxGgj5fv4jOz9tk-Xa0ycyhxKc";
const supabaseUrl = "https://diivjdhfxpzawnliubbk.supabase.co";
const client = supabase.createClient(supabaseUrl, supabaseKey);

let loadedAssets = [];
let currentPublicUrl = "";
let currentUserName = "Admin";
const STATUS_COLORS = {
    "Operational": "#10b981",
    "Issue Reported": "#ef4444",
    "Under Inspection": "#f59e0b",
    "Under Maintenance": "#7c5dfa",
    "Out of Service": "#f97316",
    "Retired": "#6b6578"
};

const assetsGrid = document.getElementById("assets-grid");
const searchInput = document.getElementById("asset-search-input");
const filterCategory = document.getElementById("filter-category");
const filterStatus = document.getElementById("filter-status");

const assetModal = document.getElementById("asset-modal");
const qrModal = document.getElementById("qr-modal");
const assetForm = document.getElementById("asset-form");


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

    fetchAssets();
}

async function fetchAssets() {
    const { data, error } = await client
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching assets:", error);
        assetsGrid.innerHTML = `<div class="loading-placeholder"><p>Error fetching asset database.</p></div>`;
        return;
    }

    loadedAssets = data;
    renderAssets(loadedAssets);
}

function renderAssets(assetsList) {
    if (assetsList.length === 0) {
        assetsGrid.innerHTML = `
            <div class="loading-placeholder">
                <p>No matching assets found.</p>
            </div>
        `;
        return;
    }

    assetsGrid.innerHTML = assetsList.map(asset => {
        const statusClass = asset.status.toLowerCase().replace(/\s+/g, '-');
        const nextDate = asset.next_service ? new Date(asset.next_service).toLocaleDateString() : "Not Scheduled";

        return `
            <div class="asset-card" data-id="${asset.id}">
                <div class="card-header">
                    <div class="card-title-block">
                        <h3>${asset.name}</h3>
                        <span class="card-code">${asset.unique_code}</span>
                    </div>
                    <span class="status-pill status-${statusClass}">${asset.status}</span>
                </div>
                <div class="card-body-details">
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${asset.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Category:</span>
                        <span class="detail-value">${asset.category}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Condition:</span>
                        <span class="detail-value">${asset.condition}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Next Service:</span>
                        <span class="detail-value">${nextDate}</span>
                    </div>
                </div>
                <div class="card-actions-row">
                    <div class="actions-left">
                        <button class="action-icon-btn edit-btn" onclick="openEditModal('${asset.id}')" title="Edit Asset">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                        </button>
                        <button class="action-icon-btn delete-btn" onclick="deleteAsset('${asset.id}')" title="Delete Asset">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                    <button class="qr-badge-btn" onclick="generateAssetQR('${asset.id}')">
                        <span>QR Identity</span>
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function performFilters() {
    const query = searchInput.value.toLowerCase().trim();
    const category = filterCategory.value;
    const status = filterStatus.value;

    let filtered = loadedAssets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(query) ||
                              asset.unique_code.toLowerCase().includes(query) ||
                              asset.location.toLowerCase().includes(query);

        const matchesCategory = category === "" || asset.category === category;
        const matchesStatus = status === "" || asset.status === status;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderAssets(filtered);
}

searchInput.addEventListener("input", performFilters);
filterCategory.addEventListener("change", performFilters);
filterStatus.addEventListener("change", performFilters);

const openModalBtn = document.getElementById("open-register-modal-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelModalBtn = document.getElementById("cancel-modal-btn");

function toggleModal(open = true) {
    if (open) {
        assetModal.classList.add("active");
    } else {
        assetModal.classList.remove("active");
        assetForm.reset();
        document.getElementById("asset-id-input").value = "";
        document.getElementById("modal-title").textContent = "Register New Asset";
        document.getElementById("asset-code").disabled = false;
    }
}

openModalBtn.addEventListener("click", () => toggleModal(true));
closeModalBtn.addEventListener("click", () => toggleModal(false));
cancelModalBtn.addEventListener("click", () => toggleModal(false));

assetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const assetId = document.getElementById("asset-id-input").value;
    const code = document.getElementById("asset-code").value.trim().toUpperCase();
    const name = document.getElementById("asset-name").value.trim();
    const category = document.getElementById("asset-category").value;
    const location = document.getElementById("asset-location").value.trim();
    const condition = document.getElementById("asset-condition").value;
    const status = document.getElementById("asset-status").value;
    const lastService = document.getElementById("last-service").value || null;
    const nextService = document.getElementById("next-service").value || null;

    if (lastService && nextService && new Date(nextService) < new Date(lastService)) {
        Swal.fire(getAlertConfig("error", "Scheduling Conflict", "Next service date cannot be scheduled before the last service date."));
        return;
    }

    if (assetId) {
        const { error } = await client
            .from("assets")
            .update({ name, category, location, condition, status, last_service: lastService, next_service: nextService })
            .eq("id", assetId);

        if (error) {
            Swal.fire(getAlertConfig("error", "Update Failed", error.message));
            return;
        }
        Swal.fire(getAlertConfig("success", "Asset Updated", "Configuration changes processed successfully.", 1500));
    } else {
        const { data: existing } = await client
            .from("assets")
            .select("id")
            .eq("unique_code", code);

        if (existing && existing.length > 0) {
            Swal.fire(getAlertConfig("error", "Duplicate Identifer", "This unique Asset Code already exists in the schema infrastructure."));
            return;
        }

        const { data: newAsset, error } = await client
            .from("assets")
            .insert([{ unique_code: code, name, category, location, condition, status, last_service: lastService, next_service: nextService }])
            .select()
            .single();

        if (error) {
            Swal.fire(getAlertConfig("error", "Registration Failed", error.message));
            return;
        }

        await client.from("asset_history").insert([{
            asset_id: newAsset.id,
            action: "Asset Registered",
            actor_name: currentUserName
        }]);

        Swal.fire(getAlertConfig("success", "Asset Registered", "New hardware identity has been tracked successfully.", 1500));
    }

    toggleModal(false);
    fetchAssets();
});

window.openEditModal = function(id) {
    const asset = loadedAssets.find(a => a.id === id);
    if (!asset) return;

    document.getElementById("asset-id-input").value = asset.id;
    document.getElementById("asset-code").value = asset.unique_code;
    document.getElementById("asset-code").disabled = true;
    document.getElementById("asset-name").value = asset.name;
    document.getElementById("asset-category").value = asset.category;
    document.getElementById("asset-location").value = asset.location;
    document.getElementById("asset-condition").value = asset.condition;
    document.getElementById("asset-status").value = asset.status;
    document.getElementById("last-service").value = asset.last_service || "";
    document.getElementById("next-service").value = asset.next_service || "";

    document.getElementById("modal-title").textContent = "Edit Asset Config";
    toggleModal(true);
};


window.deleteAsset = function(id) {
    const swalConfig = getAlertConfig('warning', 'Purge Record?', 'You are about to remove this asset. This action is destructive.');
    
    swalConfig.showCancelButton = true;
    swalConfig.confirmButtonText = 'Yes, Delete Record';
    swalConfig.cancelButtonText = 'Cancel';
    swalConfig.cancelButtonColor = '#ef4444';

    Swal.fire(swalConfig).then(async (result) => {
        if (result.isConfirmed) {
            const { error } = await client.from("assets").delete().eq("id", id);
            if (error) {
                Swal.fire(getAlertConfig("error", "Purge Halted", "Verify linked tracking updates or active issues before deleting: " + error.message));
                return;
            }
            Swal.fire(getAlertConfig("success", "Purged", "The asset identity data mapping has been deleted.", 1500));
            fetchAssets();
        }
    });
};

const qrCanvas = document.getElementById("qr-code-canvas");

window.generateAssetQR = function(id) {
    const asset = loadedAssets.find(a => a.id === id);
    if (!asset) return;

    qrCanvas.innerHTML = "";

    const publicUrl = `${window.location.origin}/public-asset.html?id=${asset.id}`;
    currentPublicUrl = publicUrl;

    new QRCode(qrCanvas, {
        text: publicUrl,
        width: 100,
        height: 100,
        colorDark : "#1a202c",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    document.getElementById("label-asset-name").textContent = asset.name;
    document.getElementById("label-asset-code").textContent = asset.unique_code;
    document.getElementById("label-asset-location").textContent = asset.location;

    qrModal.classList.add("active");
};

document.getElementById("close-qr-modal-btn").addEventListener("click", () => {
    qrModal.classList.remove("active");
});

document.getElementById("open-public-page-btn").addEventListener("click", () => {
    if (currentPublicUrl) window.open(currentPublicUrl, "_blank");
});

document.getElementById("print-label-btn").addEventListener("click", () => {
    const printContents = document.getElementById("printable-label").innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = `
        <style>
            body { background: white !important; color: black !important; padding: 20px; }
            .qr-print-label-card { border: 2px solid black !important; width: 380px; margin: auto; }
        </style>
        <div class="qr-print-label-card">${printContents}</div>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
});

document.getElementById("download-qr-btn").addEventListener("click", () => {
    const qrImg = qrCanvas.querySelector("img");
    if (qrImg) {
        const link = document.createElement("a");
        link.download = `QR_LABEL_${document.getElementById("label-asset-code").textContent}.png`;
        link.href = qrImg.src;
        link.click();
    } else {
        Swal.fire(getAlertConfig("info", "Processing Canvas", "Engine is rendering assets! Re-attempt file save process shortly.", 1500));
    }
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