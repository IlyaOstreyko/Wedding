// wwwroot/js/questions.js
// Модуль управления вопросами: добавление, загрузка, редактирование, удаление, рендер

(() => {
    const endpoints = {
        get: "/AdminQuestions/GetQuestions",
        add: "/AdminQuestions/AddQuestion",
        update: "/AdminQuestions/UpdateQuestion",
        delete: "/AdminQuestions/DeleteQuestion"
    };

    document.addEventListener("DOMContentLoaded", () => {
        window.addOption = addOption;
        window.saveQuestion = saveQuestion;
        window.loadQuestions = loadQuestions;
        window.editQuestion = editQuestion;
        window.deleteQuestion = deleteQuestion;

        loadQuestions();
    });

    // --- Утилиты ---
    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    async function safeFetch(url, options = {}) {
        const resp = await fetch(url, options);
        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`${resp.status} ${resp.statusText} ${text}`);
        }
        return resp;
    }

    function showToast(message, type = "info", timeout = 3500) {
        const holderId = "questionsToastHolder";
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

    // --- CRUD ---
    async function saveQuestion() {
        try {
            const text = document.getElementById("questionText").value.trim();
            const isMultiple = document.getElementById("isMultiple").checked;
            const allowCustom = document.getElementById("allowCustom").checked;
            const outOf = document.getElementById("outOf").checked;
            const couple = document.getElementById("couple").checked;
            if (!text) {
                showToast("Текст вопроса не может быть пустым", "warning");
                return;
            }

            const options = Array.from(document.querySelectorAll(".option-input"))
                .map(x => x.value.trim())
                .filter(x => x !== "");

            const payload = {
                text,
                isMultipleChoice: isMultiple,
                allowCustomAnswer: allowCustom,
                outOfTowners: outOf,
                forCouple: couple,
                options
            };

            await safeFetch(endpoints.add, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            showToast("Вопрос добавлен", "success");
            clearForm();
            await loadQuestions();
        } catch (err) {
            console.error("saveQuestion:", err);
            showToast("Ошибка при сохранении вопроса", "danger");
        }
    }

    async function loadQuestions() {
        try {
            const resp = await safeFetch(endpoints.get);
            const questions = await resp.json();
            renderQuestions(questions);
        } catch (err) {
            console.error("loadQuestions:", err);
            showToast("Ошибка загрузки вопросов", "danger");
        }
    }

    async function deleteQuestion(id) {
        try {
            if (!confirm("Удалить вопрос?")) return;

            const resp = await fetch(`/AdminQuestions/DeleteQuestion/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                throw new Error(`${resp.status} ${resp.statusText} ${text}`);
            }

            showToast("Вопрос удалён", "success");
            await loadQuestions();
        } catch (err) {
            console.error("deleteQuestion error:", err);
            showToast("Ошибка при удалении вопроса", "danger");
        }
    }

    async function editQuestion(id) {
        try {
            // Загружаем текущие данные (можно оптимизировать, если уже есть в списке)
            const resp = await safeFetch(endpoints.get);
            const questions = await resp.json();
            const q = questions.find(x => x.id === id);
            if (!q) {
                showToast("Вопрос не найден", "warning");
                return;
            }

            // Быстрое редактирование через prompt (можно заменить на модальное окно)
            const newText = prompt("Текст вопроса:", q.text);
            if (newText === null) return; // отмена

            // Редактирование опций — простая строка, разделённая переносом строки
            const currentOptions = (q.options || []).map(o => (typeof o === "string" ? o : o.text)).join("\n");
            const newOptionsRaw = prompt("Варианты (каждый вариант с новой строки). Оставьте пустым для удаления всех вариантов:", currentOptions);
            if (newOptionsRaw === null) return; // отмена

            const newOptions = newOptionsRaw.split("\n").map(s => s.trim()).filter(s => s !== "");

            // Сохраняем изменения через UpdateQuestion (ожидается QuestionDto: id, text, isMultipleChoice, allowCustomAnswer, options)
            const payload = {
                id,
                text: (newText ?? "").trim(),
                isMultipleChoice: !!q.isMultipleChoice,
                allowCustomAnswer: !!q.allowCustomAnswer,
                outOfTowners: !!outOfTowners,
                forCouple: !!forCouple,

                options: newOptions
            };

            await safeFetch("/AdminQuestions/UpdateQuestion", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            showToast("Вопрос обновлён", "success");
            await loadQuestions();
        } catch (err) {
            console.error("editQuestion:", err);
            showToast("Ошибка при обновлении вопроса", "danger");
        }
    }

    // --- Рендеринг ---
    function renderQuestions(questions) {
        const container = document.getElementById("questionsList");
        if (!container) return;

        container.innerHTML = "";

        if (!Array.isArray(questions) || questions.length === 0) {
            container.innerHTML = `<div class="text-muted">Вопросов пока нет</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();

        questions.forEach(q => {
            const card = document.createElement("div");
            card.className = "card p-3 mb-3";

            const header = document.createElement("div");
            header.className = "d-flex justify-content-between align-items-start";

            const title = document.createElement("div");
            title.innerHTML = `<b>${escapeHtml(q.text ?? "")}</b>`;

            const actions = document.createElement("div");
            actions.className = "btn-group";
            actions.role = "group";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "btn btn-sm btn-outline-warning";
            editBtn.title = "Редактировать";
            editBtn.innerHTML = `<i class="bi bi-pencil-fill"></i>`;
            editBtn.onclick = () => editQuestion(q.id);

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "btn btn-sm btn-outline-danger";
            delBtn.title = "Удалить";
            delBtn.innerHTML = `<i class="bi bi-trash-fill"></i>`;
            delBtn.onclick = () => deleteQuestion(q.id);

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);

            header.appendChild(title);
            header.appendChild(actions);
            card.appendChild(header);

            const badges = document.createElement("div");
            badges.className = "mt-2";
            badges.innerHTML = `
        <span class="badge bg-info me-1">Множественный: ${q.isMultipleChoice ? "Да" : "Нет"}</span>
        <span class="badge bg-secondary me-1">Свой ответ: ${q.allowCustomAnswer ? "Да" : "Нет"}</span>
        <span class="badge bg-success me-1">Для иногородних: ${q.outOfTowners ? "Да" : "Нет"}</span>
        <span class="badge bg-success me-1">Удваивать для пар: ${q.forCouple ? "Да" : "Нет"}</span>
      `;
            card.appendChild(badges);

            const ul = document.createElement("ul");
            ul.className = "mt-2";
            const opts = Array.isArray(q.options) ? q.options : [];
            if (opts.length === 0) {
                const li = document.createElement("li");
                li.className = "text-muted";
                li.textContent = "Варианты отсутствуют";
                ul.appendChild(li);
            } else {
                opts.forEach(o => {
                    const li = document.createElement("li");
                    const text = (typeof o === "string") ? o : (o.text ?? "");
                    li.innerHTML = escapeHtml(text);
                    ul.appendChild(li);
                });
            }
            card.appendChild(ul);

            fragment.appendChild(card);
        });

        container.appendChild(fragment);
    }

    // --- Вспомогательные функции формы (используются ранее) ---
    function addOption(value = "") {
        const container = document.getElementById("optionsList");
        if (!container) return;

        const wrapper = document.createElement("div");
        wrapper.className = "input-group mt-2";

        const input = document.createElement("input");
        input.className = "form-control option-input";
        input.placeholder = "Вариант ответа";
        input.value = value;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-outline-danger";
        btn.innerHTML = `<i class="bi bi-trash"></i>`;
        btn.addEventListener("click", () => wrapper.remove());

        wrapper.appendChild(input);
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
        input.focus();
    }

    function clearForm() {
        const textEl = document.getElementById("questionText");
        const isMultipleEl = document.getElementById("isMultiple");
        const allowCustomEl = document.getElementById("allowCustom");
        const optionsList = document.getElementById("optionsList");

        if (textEl) textEl.value = "";
        if (isMultipleEl) isMultipleEl.checked = false;
        if (allowCustomEl) allowCustomEl.checked = false;
        if (optionsList) optionsList.innerHTML = "";
    }

    // Экспортируем функции в глобальную область (если вызываются из Razor)
    window.addOption = addOption;
    window.saveQuestion = saveQuestion;
    window.loadQuestions = loadQuestions;
    window.editQuestion = editQuestion;
    window.deleteQuestion = deleteQuestion;
})();
