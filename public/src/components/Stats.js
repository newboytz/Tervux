export function renderStats(data = { clients: 0, ram: "0MB" }) {
    return `
        <div style="display: flex; gap: 20px; padding: 20px; flex-wrap: wrap;">
            <div style="background: #e1f5fe; border: 1px solid #b3e5fc; padding: 20px; border-radius: 8px; min-width: 200px;">
                <h3>${data.clients}</h3>
                <p style="color: #555; margin: 0;">Wateja Walio Online</p>
            </div>
            <div style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 20px; border-radius: 8px; min-width: 200px;">
                <h3>${data.ram}</h3>
                <p style="color: #555; margin: 0;">Matumizi ya RAM</p>
            </div>
        </div>
    `;
}
