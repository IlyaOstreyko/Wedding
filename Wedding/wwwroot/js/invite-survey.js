// wwwroot/js/invite-survey.js
// Инициализация и отправка опроса, экспорт функции submitSurvey

(function () {
    'use strict';

    function escapeHtml(s) {
        return String(s || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function showToast(msg, type = "info") {
        const holder = document.getElementById("inviteToastHolder");
        if (!holder) return;
        const div = document.createElement("div");
        div.className = `alert alert-${type} alert-dismissible fade show`;
        div.role = "alert";
        div.innerHTML = escapeHtml(msg) + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
        holder.appendChild(div);
        setTimeout(() => { try { bootstrap.Alert.getOrCreateInstance(div).close(); } catch { div.remove(); } }, 4000);
    }

    async function submitSurvey() {
        try {
            const token = document.getElementById("inviteToken")?.value;
            if (!token) { showToast("Отсутствует токен приглашения", "warning"); return; }

            const container = document.getElementById("questionsContainer");
            if (!container) { showToast("Контейнер вопросов не найден", "danger"); return; }

            const cards = container.querySelectorAll("div.card[data-question-id]");
            const answers = [];

            cards.forEach(card => {
                const questionId = Number(card.getAttribute("data-question-id"));
                const instanceIndex = Number(card.getAttribute("data-instance")) || 1;

                const selectedOptionIds = [];
                card.querySelectorAll(".option-checkbox:checked").forEach(ch => {
                    const optId = Number(ch.getAttribute("data-option-id"));
                    if (!isNaN(optId)) selectedOptionIds.push(optId);
                });

                const checkedRadio = card.querySelector(".option-radio:checked");
                if (checkedRadio) {
                    const optId = Number(checkedRadio.getAttribute("data-option-id"));
                    if (!isNaN(optId)) selectedOptionIds.push(optId);
                }

                const customInput = card.querySelector(".custom-answer");
                const customAnswer = customInput ? customInput.value.trim() : null;

                answers.push({
                    questionId: questionId,
                    selectedOptionIds: selectedOptionIds,
                    customAnswer: customAnswer,
                    instanceIndex: instanceIndex
                });
            });

            const payload = { inviteToken: token, answers: answers };

            const resp = await fetch("/Invite/Submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                throw new Error(`${resp.status} ${resp.statusText} ${text}`);
            }

            showToast("Спасибо! Ваши ответы сохранены.", "success");
            document.getElementById("submitSurveyBtn").disabled = true;
        } catch (err) {
            console.error(err);
            showToast("Ошибка при отправке ответов", "danger");
        }
    }

    // Экспортируем в глобальную область, чтобы Razor‑шаблон мог вызывать submitSurvey()
    window.submitSurvey = submitSurvey;

})();
