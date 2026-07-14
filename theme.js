const savedTheme = localStorage.getItem('quantum-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);


document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    if (themeToggleBtn) {
       
        updateToggleUI(savedTheme, themeToggleBtn);

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('quantum-theme', newTheme);
            
            updateToggleUI(newTheme, themeToggleBtn);
            
            window.dispatchEvent(new Event('themeChanged'));
        });
    }
});

function updateToggleUI(theme, btn) {
    if (theme === 'light') {
        btn.innerHTML = `<!-- Sun Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:20px; height:20px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.58 1.58m12.42 12.42l1.58 1.58M3 12h2.25m13.5 0H21m-16.78 6.22l1.58-1.58m12.42-12.42l1.58-1.58M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" />
            </svg>`;
    } else {
        btn.innerHTML = `<!-- Moon Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:20px; height:20px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>`;
    }
}