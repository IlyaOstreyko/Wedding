// wwwroot/js/guests.js
// Профессиональный модуль управления гостями: загрузка, поиск, CRUD, статистика, UI‑фидбек

(() => {
    // --- Конфигурация ---
    const endpoints = {
        getGuests: "/AdminGuests/GetGuests",
        addGuest: "/AdminGuests/AddGuest",
        updateGuest: "/AdminGuests/UpdateGuest",
        deleteGuest: "/AdminGuests/DeleteGuest",
        searchGuests: "/AdminGuests/SearchGuests"
    };

    // --- DOM элементы (инициализируются после загрузки DOM) ---
    let inputName, inputCity, inputCouple, inputYoungGuest, inputSearch;
    let guestListTbody, statsContainer, legendContainer, cityDatalist;

    // --- Инициализация модуля ---
    document.addEventListener("DOMContentLoaded", init);

    function init() {
        inputName = document.getElementById("nameGuest");
        inputCity = document.getElementById("cityGuest");
        inputCouple = document.getElementById("couple");
        inputYoungGuest = document.getElementById("youngGuest");
        inputSearch = document.getElementById("search");

        guestListTbody = document.getElementById("guestList");
        statsContainer = document.getElementById("stats");
        legendContainer = document.getElementById("legend");
        cityDatalist = document.getElementById("cityList");

        // Защита: если ключевые элементы отсутствуют — логируем и прекращаем работу
        if (!guestListTbody || !statsContainer || !legendContainer) {
            console.error("Guests module: required DOM elements not found");
            return;
        }

        // Подключаем глобальные функции, используемые в атрибутах onclick
        window.addGuest = addGuest;
        window.deleteGuest = deleteGuest;
        window.editGuest = editGuest;
        window.loadGuests = loadGuests;
        window.searchGuests = debounce(searchGuests, 300);

        // Подписка на поиск
        if (inputSearch) inputSearch.addEventListener("input", () => window.searchGuests(inputSearch.value));

        // Рендер легенды и начальная загрузка
        renderLegend();
        loadGuests();
    }

    // --- Вспомогательные утилиты ---
    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function showToast(message, type = "info", timeout = 3500) {
        const holderId = "guestsToastHolder";
        let holder = document.getElementById(holderId);
        if (!holder) {
            holder = document.createElement("div");
            holder.id = holderId;
            holder.style.position = "fixed";
            holder.style.top = "1rem";
            holder.style.right = "1rem";
            holder.style.zIndex = 1080;
            document.body.appendChild(holder);
        }

        const alert = document.createElement("div");
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = "alert";
        alert.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        holder.appendChild(alert);

        setTimeout(() => {
            try { bootstrap.Alert.getOrCreateInstance(alert).close(); } catch { alert.remove(); }
        }, timeout);
    }

    function debounce(fn, ms = 250) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn(...args), ms);
        };
    }

    async function safeFetch(url, options = {}) {
        try {
            const resp = await fetch(url, options);
            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                throw new Error(`${resp.status} ${resp.statusText} ${text}`);
            }
            return resp;
        } catch (err) {
            console.error("Fetch error:", err);
            throw err;
        }
    }

    // --- CRUD и загрузка данных ---
    async function addGuest() {
        try {
            const side = document.querySelector("input[name='side']:checked")?.value;
            const relation = document.querySelector("input[name='relation']:checked")?.value;

            const guest = {
                name: (inputName?.value ?? "").trim(),
                city: (inputCity?.value ?? "").trim(),
                coupleOrNot: !!(inputCouple && inputCouple.checked),
                youngOrNot: !!(inputYoungGuest && inputYoungGuest.checked),
                husbandGuestOrNot: side === "husband",
                wifeGuestOrNot: side === "wife",
                relativeOrNot: relation === "relative",
                friendOrNot: relation === "friend"
            };

            if (!guest.name) {
                showToast("Введите имя гостя", "warning");
                return;
            }

            await safeFetch(endpoints.addGuest, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(guest)
            });

            showToast("Гость добавлен", "success");
            clearForm();
            await loadGuests();
        } catch (err) {
            showToast("Ошибка при добавлении гостя", "danger");
        }
    }

    async function deleteGuest(id) {
        try {
            if (!confirm("Удалить гостя?")) return;
            await safeFetch(`${endpoints.deleteGuest}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
            showToast("Гость удалён", "success");
            await loadGuests();
        } catch (err) {
            showToast("Ошибка при удалении гостя", "danger");
        }
    }

    async function editGuest(id) {
        try {
            const row = document.querySelector(`tr[data-id='${id}']`);
            if (!row) return showToast("Строка не найдена", "warning");

            const cells = row.children;
            const newName = prompt("Имя:", cells[0].innerText) ?? cells[0].innerText;
            const city = prompt("Город:", cells[1].innerText) ?? cells[1].innerText;
            const couple = confirm("Пара? (OK = Да, Cancel = Нет)");
            const young = confirm("Молодежь? (OK = Да, Cancel = Нет)");

            const guest = {
                id,
                name: newName.trim(),
                city: city.trim(),
                coupleOrNot: couple,
                youngOrNot: young
            };

            await safeFetch(endpoints.updateGuest, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(guest)
            });

            showToast("Гость обновлён", "success");
            await loadGuests();
        } catch (err) {
            showToast("Ошибка при обновлении гостя", "danger");
        }
    }

    async function searchGuests(query) {
        try {
            const q = (query ?? "").trim();
            if (!q) {
                await loadGuests();
                return;
            }
            const resp = await safeFetch(`${endpoints.searchGuests}?query=${encodeURIComponent(q)}`);
            const guests = await resp.json();
            renderGuests(guests);
            renderStats(guests);
            updateCityList(guests);
        } catch (err) {
            showToast("Ошибка поиска", "danger");
        }
    }

    async function loadGuests() {
        try {
            const resp = await safeFetch(endpoints.getGuests);
            const guests = await resp.json();
            renderGuests(guests);
            renderStats(guests);
            renderLegend();
            updateCityList(guests);
        } catch (err) {
            showToast("Не удалось загрузить список гостей", "danger");
        }
    }

    // --- Рендеринг UI ---
    function renderLegend() {
        legendContainer.innerHTML = `
      <div class="d-flex gap-3 flex-wrap">
        <div class="d-flex align-items-center"><span class="me-2 legend-swatch" style="background:#f707a7;width:28px;height:18px;display:inline-block;border-radius:4px"></span> Жена + молодежь</div>
        <div class="d-flex align-items-center"><span class="me-2 legend-swatch" style="background:#07dbf7;width:28px;height:18px;display:inline-block;border-radius:4px"></span> Муж + молодежь</div>
        <div class="d-flex align-items-center"><span class="me-2 legend-swatch" style="background:#c707f7;width:28px;height:18px;display:inline-block;border-radius:4px"></span> Жена</div>
        <div class="d-flex align-items-center"><span class="me-2 legend-swatch" style="background:#6572e5;width:28px;height:18px;display:inline-block;border-radius:4px"></span> Муж</div>
      </div>
    `;
    }

    function renderStats(guests) {
        const stats = {
            total: 0, young: 0, couples: 0, relatives: 0, friends: 0, husbandSide: 0, wifeSide: 0
        };
        const cities = {};

        guests.forEach(g => {
            const multiplier = g.coupleOrNot ? 2 : 1;
            stats.total += multiplier;
            if (g.youngOrNot) stats.young += multiplier;
            if (g.coupleOrNot) stats.couples += 1;
            if (g.relativeOrNot) stats.relatives += multiplier;
            if (g.friendOrNot) stats.friends += multiplier;
            if (g.husbandGuestOrNot) stats.husbandSide += multiplier;
            if (g.wifeGuestOrNot) stats.wifeSide += multiplier;

            const city = g.city ?? "Не указан";
            cities[city] = (cities[city] || 0) + multiplier;
        });

        const cityHtml = Object.entries(cities)
            .map(([c, cnt]) => `<li>${escapeHtml(c)}: ${cnt}</li>`)
            .join("");

        statsContainer.innerHTML = `
      <div class="row">
        <div class="col-md-4">
          <h6 class="mb-2">Общее</h6>
          <ul class="mb-0">
            <li>Всего гостей (с учётом пар): <strong>${stats.total}</strong></li>
            <li>Молодёжь: <strong>${stats.young}</strong></li>
            <li>Пары: <strong>${stats.couples}</strong></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h6 class="mb-2">Тип</h6>
          <ul class="mb-0">
            <li>Родственники: <strong>${stats.relatives}</strong></li>
            <li>Друзья: <strong>${stats.friends}</strong></li>
          </ul>
        </div>
        <div class="col-md-4">
          <h6 class="mb-2">Стороны</h6>
          <ul class="mb-0">
            <li>Со стороны мужа: <strong>${stats.husbandSide}</strong></li>
            <li>Со стороны жены: <strong>${stats.wifeSide}</strong></li>
          </ul>
        </div>
      </div>
      <div class="mt-3">
        <h6>По городам</h6>
        <ul class="mb-0">${cityHtml}</ul>
      </div>
    `;
    }

    function renderGuests(guests) {
        if (!Array.isArray(guests)) {
            guestListTbody.innerHTML = `<tr><td colspan="5" class="text-muted">Нет данных</td></tr>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        guests.forEach(g => {
            const color = getGuestColor(g);
            const tr = document.createElement("tr");
            tr.setAttribute("data-id", g.id);

            tr.innerHTML = `
        <td style="background:${color}">${escapeHtml(g.name)}</td>
        <td style="background:${color}">${escapeHtml(g.city ?? "")}</td>
        <td style="background:${color}" class="text-center">
          <i class="bi ${g.coupleOrNot ? "bi-check-circle-fill text-success" : "bi-x-circle-fill text-danger"}" aria-hidden="true"></i>
        </td>
        <td style="background:${color}" class="text-center">
          <i class="bi ${g.confirmation ? "bi-check-circle-fill text-success" : "bi-x-circle-fill text-danger"}" aria-hidden="true"></i>
        </td>
        <td style="background:${color}" class="text-end">
          <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${g.id}" title="Изменить">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${g.id}" title="Удалить">
            <i class="bi bi-trash-fill"></i>
          </button>
        </td>
      `;

            fragment.appendChild(tr);
        });

        guestListTbody.innerHTML = "";
        guestListTbody.appendChild(fragment);

        // Делегирование событий для кнопок в таблице
        guestListTbody.querySelectorAll("button[data-action]").forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.getAttribute("data-id");
                const action = btn.getAttribute("data-action");
                if (action === "edit") editGuest(Number(id));
                if (action === "delete") deleteGuest(Number(id));
            };
        });
    }

    function updateCityList(guests) {
        if (!cityDatalist) return;
        const cities = new Set();
        guests.forEach(g => { if (g.city) cities.add(g.city); });
        cityDatalist.innerHTML = Array.from(cities).map(c => `<option value="${escapeHtml(c)}"></option>`).join("");
    }

    function clearForm() {
        if (inputName) inputName.value = "";
        if (inputCity) inputCity.value = "";
        if (inputCouple) inputCouple.checked = false;
        if (inputYoungGuest) inputYoungGuest.checked = false;
        document.querySelectorAll("input[name='side']").forEach(x => x.checked = false);
        document.querySelectorAll("input[name='relation']").forEach(x => x.checked = false);
    }

    function getGuestColor(g) {
        const wife = !!g.wifeGuestOrNot;
        const husband = !!g.husbandGuestOrNot;
        const young = !!g.youngOrNot;

        if (wife && young) return "#f707a7";
        if (husband && young) return "#07dbf7";
        if (wife) return "#c707f7";
        if (husband) return "#6572e5";
        return "transparent";
    }

})();
