// public/src/main.js
import { renderSidebar } from './components/Sidebar.js';
import { renderNavbar } from './components/Navbar.js';
import { renderStats } from './components/Stats.js';

const API_URL = "https://tervux-backend-seva.onrender.com"; // Seva yako ya Express

async function checkAccountAndLoad() {
    // 1. Chukua jina la account lililoingizwa (au lililohifadhiwa kwenye browser ya mteja)
    let accountName = localStorage.getItem("tervux_account");

    if (!accountName) {
        // Kama hajalogin, onyesha fomu ya Login / Kusajili
        showLoginScreen();
        return;
    }

    try {
        // 2. Piga API ya seva kuangalia kama huyu mteja yupo kwenye Database
        const response = await fetch(`${API_URL}/api/client/check/${accountName}`);
        const result = await response.json();

        if (result.exists) {
            // A. KAMA IPO: Pakia Dashboard ya huyu mteja na vuta data za seva yake
            loadFullDashboard(accountName, result.serverData);
        } else {
            // B. KAMA HAIPO: Safisha na uwaombe wasajili upya
            alert("⚠️ Akaunti haipo! Tafadhali jisajili.");
            localStorage.removeItem("tervux_account");
            showLoginScreen();
        }
    } catch (error) {
        console.error("Shida ya muunganisho wa seva:", error);
    }
}

// Fomu ya Login na Usajili (Kipande cha Component)
function showLoginScreen() {
    document.body.innerHTML = `
        <div style="max-width: 400px; margin: 100px auto; padding: 30px; background: white; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); font-family: Arial, sans-serif;">
            <h2 style="text-align: center; color: #1e1e2d;">🦁 Tervux Panel Login</h2>
            <p style="color: #666; text-size: 14px; text-align: center;">Ingiza jina lako la account au namba ya simu kuanza.</p>
            
            <label>Jina la Account / Simu:</label>
            <input type="text" id="acc-input" placeholder="Mfano: jonnitech au 255654..." style="width: 100%; padding: 10px; margin: 10px 0 20px 0; border: 1px solid #ddd; border-radius: 4px;">
            
            <button id="btn-ingia" style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Ingia / Jisajili</button>
        </div>
    `;

    document.getElementById("btn-ingia").addEventListener("click", async () => {
        const inputVal = document.getElementById("acc-input").value.trim().toLowerCase();
        if (!inputVal) return alert("Weka jina mzee wangu!");

        // Hifadhi kwenye browser ili akifungua kesho asirudie kulogin
        localStorage.setItem("tervux_account", inputVal);
        checkAccountAndLoad(); // Kagua tena
    });
}

// Pakia Dashboard yote kwa kutumia zile components zetu
function loadFullDashboard(accountName, serverData) {
    // Rejesha muundo wetu wa zamani wa HTML
    document.body.innerHTML = `
        <div id="sidebar-container"></div>
        <div class="main-content" style="flex: 1; display: flex; flex-direction: column; height: 100vh;">
            <div id="navbar-container"></div>
            <div class="content-body" style="padding: 20px; overflow-y: auto;">
                <div id="stats-container"></div>
            </div>
        </div>
    `;

    // Ingiza data kwenye components
    document.getElementById('sidebar-container').innerHTML = renderSidebar();
    document.getElementById('navbar-container').innerHTML = renderNavbar(accountName);
    document.getElementById('stats-container').innerHTML = renderStats({
        clients: serverData.isActive ? "Inafanya Kazi ✅" : "Imezimwa ❌",
        ram: serverData.ram || "0MB"
    });
}

window.addEventListener('DOMContentLoaded', checkAccountAndLoad);
