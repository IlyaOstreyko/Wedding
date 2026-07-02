(() => {

    const endpoints = {
        get: "/AdminQuestions/GetQuestions",
        add: "/AdminQuestions/AddQuestion",
        update: "/AdminQuestions/UpdateQuestion"
    };

    let modal;
    let questionsCache = [];

    document.addEventListener("DOMContentLoaded", () => {
        modal = new bootstrap.Modal(document.getElementById("questionModal"));
        loadQuestions();
    });

    async function safeFetch(url, options) {
        const r = await fetch(url, options);
        if (!r.ok) throw new Error(await r.text());
        return r;
    }

    async function loadQuestions() {
        try {

            const resp = await safeFetch(endpoints.get);
            const questions = await resp.json();

            questionsCache = questions;

            renderQuestions(questions);

        } catch (err) {
            console.error(err);
            showToast("Ошибка загрузки вопросов", "danger");
        }
    }

    function getOptions() {
        return Array.from(document.querySelectorAll(".modal-option-input"))
            .map(x => x.value.trim())
            .filter(x => x.length > 0);
    }

    async function saveQuestionModal() {

        const id = document.getElementById("questionId").value;

        const payload = {
            id: id ? parseInt(id) : 0,
            text: document.getElementById("modalQuestionText").value.trim(),
            isMultipleChoice: document.getElementById("modalIsMultiple").checked,
            allowCustomAnswer: document.getElementById("modalAllowCustom").checked,
            outOfTowners: document.getElementById("modalOutOf").checked,
            forCouple: false,
            options: getOptions()   
        };

        const url = id ? endpoints.update : endpoints.add;

        await safeFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        modal.hide();
        loadQuestions();
    }

    function addModalOption(value = "") {
        const div = document.createElement("div");
        div.innerHTML = `
        <input class="form-control modal-option-input mb-2" value="${value}">
    `;
        document.getElementById("modalOptionsList").appendChild(div);
    }

    function openCreateQuestionModal() {
        document.getElementById("questionId").value = "";
        document.getElementById("modalOptionsList").innerHTML = "";
        modal.show();
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text ?? "";
        return div.innerHTML;
    }

    function renderQuestions(questions) {

        const container = document.getElementById("questionsList");

        if (!container)
            return;

        container.innerHTML = "";

        if (!questions || questions.length === 0) {
            container.innerHTML =
                '<div class="alert alert-secondary">Вопросов пока нет</div>';
            return;
        }

        questions.forEach(q => {

            const card = document.createElement("div");
            card.className = "card shadow-sm mb-3";

            card.innerHTML = `
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">

                    <div>
                        <strong>${escapeHtml(q.text)}</strong>
                    </div>

                    <div class="btn-group">

                        <button class="btn btn-sm btn-warning"
                                onclick="editQuestion(${q.id})">
                            <i class="bi bi-pencil-fill"></i>
                        </button>

                        <button class="btn btn-sm btn-danger"
                                onclick="deleteQuestion(${q.id})">
                            <i class="bi bi-trash-fill"></i>
                        </button>

                    </div>

                </div>
            </div>

            <div class="card-body">

                <div class="mb-3">

                    ${q.isMultipleChoice
                    ? '<span class="badge bg-info me-1">Множественный выбор</span>'
                    : ''}

                    ${q.allowCustomAnswer
                    ? '<span class="badge bg-secondary me-1">Свой ответ</span>'
                    : ''}

                    ${q.outOfTowners
                    ? '<span class="badge bg-success me-1">Для иногородних</span>'
                    : ''}

                    ${q.forCouple
                    ? '<span class="badge bg-warning text-dark">Для пары</span>'
                    : ''}

                </div>

                <div class="fw-bold mb-2">
                    Варианты ответа
                </div>

                <ul class="list-group">
                    ${q.options && q.options.length
                    ? q.options.map(o =>
                        `<li class="list-group-item">${escapeHtml(o.text)}</li>`
                    ).join("")
                    : '<li class="list-group-item text-muted">Нет вариантов</li>'
                }
                </ul>

            </div>
        `;

            container.appendChild(card);
        });
    }

    function editQuestion(id) {

        const q = questionsCache.find(x => x.id === id);

        if (!q)
            return;

        document.getElementById("questionId").value = q.id;
        document.getElementById("modalQuestionText").value = q.text ?? "";

        document.getElementById("modalIsMultiple").checked =
            q.isMultipleChoice ?? false;

        document.getElementById("modalAllowCustom").checked =
            q.allowCustomAnswer ?? false;

        document.getElementById("modalOutOf").checked =
            q.outOfTowners ?? false;

        const optionsContainer =
            document.getElementById("modalOptionsList");

        optionsContainer.innerHTML = "";

        (q.options ?? []).forEach(o => {
            addModalOption(o.text ?? o);
        });

        modal.show();
    }

    async function deleteQuestion(id) {

        if (!confirm("Удалить вопрос?"))
            return;

        await safeFetch(`/AdminQuestions/DeleteQuestion/${id}`, {
            method: "POST"
        });

        await loadQuestions();
    }

    window.deleteQuestion = deleteQuestion;
    window.editQuestion = editQuestion;
    window.saveQuestionModal = saveQuestionModal;
    window.addModalOption = addModalOption;
    window.openCreateQuestionModal = openCreateQuestionModal;

})();