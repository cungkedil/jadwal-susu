const API = 'https://susu-cengkudil-backend.glitch.me/jadwal-susu';
let remainingMs = 0;
let timerInterval = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

// Render hours/mins/secs into the DOM
function renderCountdown(ms) {
    if (ms <= 0) {
        clearInterval(timerInterval);
        document.querySelector('.countdown')
            .innerHTML = "<div class='expired'>SUDAH KADALUARSA!</div>";
        return;
    }
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

function renderAdditionalInfo(target) {
    const createdDate   = new Date(target);
    const expireDate    = new Date(target);

    createdDate.setHours(createdDate.getHours() - 2);
  
    // format readable
    const formattedCreated = toAdditionalInfoString(createdDate);
    const formattedExpire  = toAdditionalInfoString(expireDate);
  
    // write into <li> elements
    document.getElementById('dibuat-li').textContent    = `Dibuat: ${formattedCreated}`;
    document.getElementById('kadaluarsa-li').textContent = `Kadaluarsa: ${formattedExpire}`;
  }
  

// Fetch target + server time, init remainingMs & start the interval
async function initCountdown() {
    // clear any old timer
    if (timerInterval) clearInterval(timerInterval);

    try {
        const res = await fetch(API);
        const data = await res.json();
        if (!data.target_time || !data.server_time) {
            document.querySelector('.countdown')
                .innerHTML = "<div class='expired'>No target time set</div>";
            return;
        }

        // compute difference based on server’s clock
        remainingMs = new Date(data.target_time) - new Date(data.server_time);

        // initial render & then tick locally
        renderCountdown(remainingMs);
        timerInterval = setInterval(() => {
            remainingMs -= 1000;
            renderCountdown(remainingMs);
        }, 1000);

        // render additional info timestamp
        renderAdditionalInfo(data.target_time);

    } catch (err) {
        console.error('Failed to fetch countdown:', err);
    }
}

// helper to format YYYY-MM-DDTHH:MM:SS (no timezone)
function toLocalISOString(d) {
    const pad = n => String(n).padStart(2, '0');
    return (
        d.getFullYear() + '-' +
        pad(d.getMonth() + 1) + '-' +
        pad(d.getDate()) + 'T' +
        pad(d.getHours()) + ':' +
        pad(d.getMinutes()) + ':' +
        pad(d.getSeconds())
    );
}

function toAdditionalInfoString(d) {
    const pad = n => String(n).padStart(2, '0');
    return [
      pad(d.getDate()),
      pad(d.getMonth() + 1),
      d.getFullYear()
    ].join('-')
    + ', ' +
    [
      pad(d.getHours()),
      pad(d.getMinutes()),
      pad(d.getSeconds())
    ].join(':');
  }

// POST a new target, then re-initialize
async function setNewTarget() {
    const timeInput = document.getElementById('targetTimeInput');
    const timeValue = timeInput.value;
    if (!timeValue) return alert('Please choose a time.');

    const now = new Date();
    let [h, m] = timeValue.split(':').map(Number);
    let newTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate(), (h + 2), m, 0);
    if (newTarget.getTime() <= now.getTime()) {
        newTarget.setDate(newTarget.getDate() + 1);
    }

    try {
        await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_time: toLocalISOString(newTarget) })
        });
        // once backend has stored it, fetch & restart countdown
        timeInput.value = '';
        initCountdown();
    } catch (err) {
        console.error('Failed to send target time:', err);
    }
}

document.getElementById('setTimeButton')
    .addEventListener('click', setNewTarget);

// On page load, fetch once and start the local clock
initCountdown();