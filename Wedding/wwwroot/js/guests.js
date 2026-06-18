// wwwroot/js/guests.js
// Профессиональный модуль управления гостями: загрузка, поиск, CRUD, статистика, UI‑фидбек
let guestModal;
let editMode = false;
let guestsCache = [];
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
    document.addEventListener("DOMContentLoaded", () => {
        const coupleCheckbox = document.getElementById("couple");
        const genderBlock = document.getElementById("genderBlock");

        function toggleGender() {
            if (coupleCheckbox.checked) {
                genderBlock.style.display = "none";

                document.getElementById("genderMale").checked = false;
                document.getElementById("genderFemale").checked = false;
            } else {
                genderBlock.style.display = "block";
            }
        }

        coupleCheckbox.addEventListener("change", toggleGender);

        toggleGender();
    });
    document.getElementById("guestModal")
        .addEventListener("hidden.bs.modal", () => {
            clearForm();
            editMode = false;
            document.getElementById("guestId").value = "";
            document.getElementById("guestModalTitle").innerText = "Добавить гостя";
        });
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

        guestModal = new bootstrap.Modal(
            document.getElementById("guestModal")
        );

        window.openAddGuestModal = openAddGuestModal;
        window.saveGuest = saveGuest;

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
        window.copyInviteLink = copyInviteLink;
        window.searchGuests = debounce(searchGuests, 300);

        // Подписка на поиск
        if (inputSearch) inputSearch.addEventListener("input", () => window.searchGuests(inputSearch.value));

        // Рендер легенды и начальная загрузка
        renderLegend();
        loadGuests();
    }

    async function saveGuest() {
        if (editMode) {
            await updateGuest();
        } else {
            await addGuest();
        }
    }

    function openAddGuestModal() {
        editMode = false;

        document.getElementById("guestModalTitle").innerText =
            "Добавить гостя";

        document.getElementById("guestId").value = "";

        clearForm();

        guestModal.show();
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
            const gender =
                document.getElementById("genderMale")?.checked ? "Male" :
                    document.getElementById("genderFemale")?.checked ? "Female" :
                        null;
            const guest = {
                name: (inputName?.value ?? "").trim(),
                city: (inputCity?.value ?? "").trim(),
                gender: gender,
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

            if (!guest.coupleOrNot && !guest.gender) {
                showToast("Выберите пол гостя", "warning");
                return;
            }

            await safeFetch(endpoints.addGuest, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(guest)
            });

            showToast("Гость добавлен", "success");
            guestModal.hide();
            clearForm();
            await loadGuests();
        } catch (err) {
            showToast("Ошибка при добавлении гостя", "danger");
        }

    }

    async function deleteGuest(id) {
        try {
            if (!confirm("Удалить гостя?")) return;
            await safeFetch(`${endpoints.deleteGuest}?id=${encodeURIComponent(id)}`, { method: "POST" });
            showToast("Гость удалён", "success");
            await loadGuests();
        } catch (err) {
            showToast("Ошибка при удалении гостя", "danger");
        }
    }

    async function editGuest(id) {
        const guest = guestsCache.find(x => x.id === id);

        if (!guest) {
            showToast("Гость не найден", "warning");
            return;
        }

        editMode = true;

        document.getElementById("guestModalTitle").innerText =
            "Редактирование гостя";

        document.getElementById("guestId").value = guest.id;

        inputName.value = guest.name || "";
        inputCity.value = guest.city || "";

        inputCouple.checked = guest.coupleOrNot;
        inputYoungGuest.checked = guest.youngOrNot;

        document.getElementById("genderMale").checked =
            guest.gender === "Male";

        document.getElementById("genderFemale").checked =
            guest.gender === "Female";

        document.getElementById("sideHusband").checked =
            guest.husbandGuestOrNot;

        document.getElementById("sideWife").checked =
            guest.wifeGuestOrNot;

        document.getElementById("relRelative").checked =
            guest.relativeOrNot;

        document.getElementById("relFriend").checked =
            guest.friendOrNot;

        document.getElementById("couple")
            .dispatchEvent(new Event("change"));

        guestModal.show();
    }

    async function updateGuest() {
        try {
            const id = Number(document.getElementById("guestId").value);

            const side = document.querySelector("input[name='side']:checked")?.value;
            const relation = document.querySelector("input[name='relation']:checked")?.value;

            const gender =
                document.getElementById("genderMale").checked
                    ? "Male"
                    : document.getElementById("genderFemale").checked
                        ? "Female"
                        : null;

            const guest = {
                id,
                name: inputName.value.trim(),
                city: inputCity.value.trim(),
                gender,
                coupleOrNot: inputCouple.checked,
                youngOrNot: inputYoungGuest.checked,
                husbandGuestOrNot: side === "husband",
                wifeGuestOrNot: side === "wife",
                relativeOrNot: relation === "relative",
                friendOrNot: relation === "friend"
            };

            // ✅ ВАЛИДАЦИЯ ТУТ
            if (!guest.name) {
                showToast("Введите имя гостя", "warning");
                return;
            }

            if (!guest.coupleOrNot && !guest.gender) {
                showToast("Выберите пол гостя", "warning");
                return;
            }

            await safeFetch(endpoints.updateGuest, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(guest)
            });

            showToast("Гость обновлён", "success");
            guestModal.hide();
            await loadGuests();

        } catch (err) {
            console.error(err);
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
            guestsCache = guests;
        } catch (err) {
            showToast("Не удалось загрузить список гостей", "danger");
        }
    }

    function copyInviteLink(token) {
        const url = `${window.location.origin}/Invite/${token}`;

        try {
            // современный API (если разрешён)
            if (navigator.clipboard && document.hasFocus()) {
                navigator.clipboard.writeText(url)
                    .then(() => showToast("Ссылка скопирована", "success"))
                    .catch(() => fallbackCopy(url));

                return;
            }

            fallbackCopy(url);
        } catch (e) {
            showToast("Не удалось скопировать ссылку", "danger")
            fallbackCopy(url);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;

        // важно: не скрытый display:none (он ломает execCommand в некоторых браузерах)
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";

        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            document.execCommand("copy");
            showToast("Ссылка скопирована", "success");
        } catch (e) {
            console.error(e);
            showToast("Не удалось скопировать", "danger");
        }

        document.body.removeChild(textarea);
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
    ${g.coupleOrNot
                    ? "Пара"
                    : g.gender === "Male"
                        ? "М"
                        : g.gender === "Female"
                            ? "Ж"
                            : "-"}
  </td>

  <td style="background:${color}" class="text-center">
    <i class="bi ${g.confirmation
                    ? "bi-check-circle-fill text-success"
                    : "bi-x-circle-fill text-danger"}"></i>
  </td>

  <td style="background:${color}" class="text-end">
    <button class="btn btn-sm btn-primary me-1"
      data-action="copy"
      data-token="${g.inviteToken}">
      <i class="bi bi-link-45deg"></i>
    </button>

    <button class="btn btn-sm btn-warning me-1"
      data-action="edit"
      data-id="${g.id}">
      <i class="bi bi-pencil-fill"></i>
    </button>

    <button class="btn btn-sm btn-danger"
      data-action="delete"
      data-id="${g.id}">
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
                const token = btn.getAttribute("data-token");

                if (action === "copy") copyInviteLink(token);
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
        document.getElementById("genderMale").checked = false;
        document.getElementById("genderFemale").checked = false;
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
