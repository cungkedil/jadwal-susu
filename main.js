const API = 'https://ojkeitbmxtypouxiavjh.supabase.co/functions/v1/jadwal-susu';
let remainingMs = 0;
let timerInterval = null;

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js")
            .then((registration) => console.log("SW registered:", registration.scope))
            .catch((err) => console.error("SW failed:", err));
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
    const createdDate = new Date(target);
    const expireDate = new Date(target);

    createdDate.setHours(createdDate.getHours() - 2);

    const formattedCreated = toAdditionalInfoString(createdDate);
    const formattedExpire = toAdditionalInfoString(expireDate);

    document.getElementById('dibuat-li').textContent = `Dibuat: ${formattedCreated}`;
    document.getElementById('kadaluarsa-li').textContent = `Kadaluarsa: ${formattedExpire}`;
}

// Fetch target + server time, init remainingMs & start the interval
async function initCountdown() {
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

        renderCountdown(remainingMs);
        timerInterval = setInterval(() => {
            remainingMs -= 1000;
            renderCountdown(remainingMs);
        }, 1000);

        renderAdditionalInfo(data.target_time);

    } catch (err) {
        console.error('Failed to fetch countdown:', err);
    }
}

// helper: format YYYY-MM-DDTHH:MM:SS with local offset (+07:00)
function toOffsetISOString(d) {
    // base date components
    const pad = n => String(n).padStart(2, '0');
    const datePart = [
        d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())
    ].join('-');
    const timePart = [
        pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())
    ].join(':');

    // compute offset
    const tzOffsetMin = -d.getTimezoneOffset();       // in minutes
    const sign = tzOffsetMin >= 0 ? '+' : '-';
    const absMin = Math.abs(tzOffsetMin);
    const oh = pad(Math.floor(absMin / 60));
    const om = pad(absMin % 60);

    return `${datePart}T${timePart}${sign}${oh}:${om}`;
}

function toAdditionalInfoString(d) {
    const pad = n => String(n).padStart(2, '0');

    // 1) Clone the date and subtract 7 hours (in milliseconds)
    const shifted = new Date(d.getTime() - 7 * 60 * 60 * 1000);

    // 2) Extract day/month/year and HH:MM:SS from the shifted date
    const datePart = [
        pad(shifted.getDate()),
        pad(shifted.getMonth() + 1),
        shifted.getFullYear()
    ].join('-');

    const timePart = [
        pad(shifted.getHours()),
        pad(shifted.getMinutes())
    ].join(':');

    return `${timePart}, ${datePart}`;
}

// POST a new target, then re-initialize
async function setNewTarget() {
    const timeInput = document.getElementById('targetTimeInput');
    const timeValue = timeInput.value;
    if (!timeValue) return alert('Please choose a time.');

    const now = new Date();
    let [h, m] = timeValue.split(':').map(Number);
    let newTarget = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        h + 2, m, 0
    );
    if (newTarget.getTime() <= now.getTime()) {
        newTarget.setDate(newTarget.getDate() + 1);
    }

    // build offset-ISO string
    const payloadTime = toOffsetISOString(newTarget);

    try {
        await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_time: payloadTime })
        });
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
