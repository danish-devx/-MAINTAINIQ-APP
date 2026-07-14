const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpaXZqZGhmeHB6YXdubGl1YmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjE4NDEsImV4cCI6MjA5NjEzNzg0MX0.Qe30ARc6N73YbqLg2YxGgj5fv4jOz9tk-Xa0ycyhxKc";
const supabaseUrl = "https://diivjdhfxpzawnliubbk.supabase.co";
const client = supabase.createClient(supabaseUrl, supabaseKey);


const loginForm = document.getElementById("login-form");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");


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
            confirmButton: 'premium-swal-button'
        },
        backdrop: `rgba(14, 11, 22, 0.5) cubic-bezier(0.4, 0, 0.2, 1) blur(6px)`
    };
};



async function routeUserByRole(userId) {
    const { data: profile, error } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        Swal.fire(getAlertConfig('error', 'Profile Not Found', 'No role assigned for this account. Contact the administrator.'));
        await client.auth.signOut();
        return;
    }

    if (profile.role === 'admin') {
        Swal.fire(getAlertConfig('success', 'Access Granted', 'Welcome back, Administrator.', 1200));
        setTimeout(() => { window.location.href = "admin.html"; }, 1200);
    } else if (profile.role === 'technician') {
        Swal.fire(getAlertConfig('success', 'Access Granted', 'Tech Console Online.', 1200));
        setTimeout(() => { window.location.href = "technician.html"; }, 1200);
    } else {
        Swal.fire(getAlertConfig('error', 'Unauthorized', 'Invalid system role assignment.'));
    }
}


async function checkActiveSession() {
    const { data: { session }, error } = await client.auth.getSession();
    if (!error && session) {
        await routeUserByRole(session.user.id);
    }
}
document.addEventListener("DOMContentLoaded", checkActiveSession);


async function signIn(e) {
    if (e) e.preventDefault();

    Swal.fire({ title: 'Verifying clearance levels...', didOpen: () => { Swal.showLoading(); } });

    const { data, error } = await client.auth.signInWithPassword({
        email: loginEmail.value,
        password: loginPassword.value,
    });

    if (error) {
        Swal.fire(getAlertConfig('error', 'Authentication Error', error.message));
        return;
    }

    if (data && data.user) {
        await routeUserByRole(data.user.id);
        loginForm.reset();
    }
}


if (loginForm) loginForm.addEventListener("submit", signIn);