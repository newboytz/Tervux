<!DOCTYPE html>
<html lang="sw">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tervux Bot Dashboard</title>
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; display: flex; background: #f4f6f9; }
        .main-content { flex: 1; display: flex; flex-col; flex-direction: column; height: 100vh; overflow: hidden; }
        .content-body { flex: 1; overflow-y: auto; padding: 10px; }
    </style>
</head>
<body>

    <div id="sidebar-container"></div>

    <div class="main-content">
        <div id="navbar-container"></div>

        <div class="content-body">
            <h2 style="padding-left: 20px; margin-bottom: 0;">Hali ya Mfumo</h2>
            <div id="stats-container"></div>
            
            </div>
    </div>

    <script type="module" src="./src/main.js"></script>
</body>
</html>
  
