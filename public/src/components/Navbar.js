export function renderNavbar(adminName = "Mkuu") {
    return `
        <div style="background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; width: 100%;">
            <span style="font-weight: bold; font-size: 1.2rem;">Control Panel</span>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>Karibu, <strong>${adminName}</strong></span>
                <div style="width: 35px; height: 35px; background: #007bff; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold;">T</div>
            </div>
        </div>
    `;
}
