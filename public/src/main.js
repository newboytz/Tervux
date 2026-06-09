import { renderSidebar } from './components/Sidebar.js';
import { renderNavbar } from './components/Navbar.js';
import { renderStats } from './components/Stats.js';

// Kazi ya kuwasha dashboard na kuingiza components zote
function initDashboard() {
    // 1. Weka Sidebar
    document.getElementById('sidebar-container').innerHTML = renderSidebar();
    
    // 2. Weka Navbar
    document.getElementById('navbar-container').innerHTML = renderNavbar("JonniTech");
    
    // 3. Weka Stats (Hapa unaweza kuweka data halisi baadae kutoka kwa API)
    document.getElementById('stats-container').innerHTML = renderStats({
        clients: 12,
        ram: "245.5MB"
    });
}

// Run mambo ya uanzishwaji kivinjari kikimaliza kuload
window.addEventListener('DOMContentLoaded', initDashboard);
