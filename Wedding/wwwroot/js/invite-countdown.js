// wwwroot/js/invite-countdown.js
(function () {
    'use strict';

    function pad(n) { return String(n).padStart(2, '0'); }

    function updateCountdown() {
        const el = document.getElementById('countdown');
        if (!el) return;
        const targetIso = el.getAttribute('data-target');
        if (!targetIso) return;
        const target = new Date(targetIso);
        const now = new Date();
        let diff = Math.max(0, target - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);
        const secs = Math.floor(diff / 1000);

        const elDays = document.getElementById('cd-days');
        const elHours = document.getElementById('cd-hours');
        const elMins = document.getElementById('cd-mins');
        const elSecs = document.getElementById('cd-secs');

        if (elDays) elDays.textContent = pad(days);
        if (elHours) elHours.textContent = pad(hours);
        if (elMins) elMins.textContent = pad(mins);
        if (elSecs) elSecs.textContent = pad(secs);

        if (target - new Date() <= 0) {
            // Событие наступило
            const container = document.getElementById('countdown');
            if (container) container.innerHTML = '<div class="text-success fw-bold">Свадьба уже состоялась — до встречи на празднике!</div>';
            clearInterval(timer);
        }
    }

    // Запуск
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

})();
