<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Timer</title>
  <link rel="stylesheet" href="style.css" />
  <script type="module" src="script-timer.js" defer></script>
</head>
<body>
  <h1>Timer</h1>

  <div class="nav-buttons">
    <button id="to-timer" disabled>Timer</button>
    <button id="to-algs">Algorithms</button>
  </div>

  <div id="timer-section">
    <div id="timer">00:00.00</div>
    <div id="scramble"></div>
  </div>

  <div id="history-section">
    <button id="delete-all">Delete All Times</button>
    <div id="times-list"></div>
    <div id="average-time"></div>
    <div id="time-details"></div>
  </div>
</body>
</html>