/* =========================================================
   PRODUCTION WEDDING INVITATION SCRIPT
   ========================================================= */

(() => {
    'use strict';

    /* =========================================================
       STATE
       ========================================================= */

    let currentStep = 0;

    const steps = Array.from(document.querySelectorAll('.survey-step'));

    const progressBar = document.getElementById('surveyProgressBar');

    const submitButton = document.getElementById('submitSurveyBtn');
    /* =========================================================
   ATTENDANCE TOGGLE
   ========================================================= */

    function initializeAttendanceToggle() {

        const checkbox =
            document.getElementById('attendanceCheckbox');

        if (!checkbox) {
            return;
        }

        checkbox.addEventListener('change', async () => {

            try {

                const token =
                    document.getElementById('inviteToken')?.value;

                if (!token) {
                    return;
                }

                const response = await fetch(
                    '/Invite/ToggleAttendance',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        body: JSON.stringify({
                            inviteToken: token,
                            isConfirmed: checkbox.checked
                        })
                    });

                if (!response.ok) {

                    throw new Error(
                        'Failed to update attendance'
                    );

                }

                showToast(
                    checkbox.checked
                        ? 'Присутствие подтверждено'
                        : 'Присутствие отменено',
                    'success'
                );

            }
            catch (error) {

                console.error(error);

                checkbox.checked = !checkbox.checked;

                showToast(
                    'Ошибка сохранения',
                    'danger'
                );

            }

        });

    }
    /* =========================================================
       INIT
       ========================================================= */

    document.addEventListener('DOMContentLoaded', () => {

        initializeSurvey();
        initializeCountdownEffects();
        initializeAttendanceToggle();
        initializeOptionCards();

        initializeScrollEffects();

    });

    /* =========================================================
       SURVEY INITIALIZATION
       ========================================================= */

    function initializeSurvey() {

        if (!steps.length) {
            return;
        }

        updateSurvey();

    }

    /* =========================================================
       SURVEY NAVIGATION
       ========================================================= */

    function updateSurvey() {

        steps.forEach((step, index) => {

            step.classList.toggle('active', index === currentStep);

        });

        updateProgress();

        scrollToSurveyTop();

    }

    function updateProgress() {

        if (!progressBar || !steps.length) {
            return;
        }

        const progress =
            ((currentStep + 1) / steps.length) * 100;

        progressBar.style.width = `${progress}%`;

    }

    function scrollToSurveyTop() {

        const wrapper =
            document.querySelector('.survey-wrapper');

        if (!wrapper) {
            return;
        }

        wrapper.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    }

    function validateCurrentStep() {

        const step = steps[currentStep];

        if (!step) {
            return false;
        }

        const radios =
            step.querySelectorAll('.option-radio');

        const checkboxes =
            step.querySelectorAll('.option-checkbox');

        const customAnswer =
            step.querySelector('.custom-answer');

        const hasRadio =
            radios.length > 0;

        const hasCheckbox =
            checkboxes.length > 0;

        const hasCheckedRadio =
            Array.from(radios).some(x => x.checked);

        const hasCheckedCheckbox =
            Array.from(checkboxes).some(x => x.checked);

        const hasCustomAnswer =
            customAnswer &&
            customAnswer.value.trim().length > 0;

        if (hasRadio) {

            return hasCheckedRadio || hasCustomAnswer;

        }

        if (hasCheckbox) {

            return hasCheckedCheckbox || hasCustomAnswer;

        }

        return true;

    }

    /* =========================================================
       PUBLIC NAVIGATION
       ========================================================= */

    window.nextStep = () => {

        if (!validateCurrentStep()) {

            showToast(
                'Пожалуйста, выберите вариант ответа',
                'warning'
            );

            animateStepError();

            return;
        }

        if (currentStep < steps.length - 1) {

            currentStep++;

            updateSurvey();

        }

    };

    window.prevStep = () => {

        if (currentStep > 0) {

            currentStep--;

            updateSurvey();

        }

    };

    /* =========================================================
       OPTION CARDS
       ========================================================= */

    function initializeOptionCards() {

        const optionCards =
            document.querySelectorAll('.option-card');

        optionCards.forEach(card => {

            const input =
                card.querySelector('input');

            if (!input) {
                return;
            }

            updateOptionState(card, input);

            input.addEventListener('change', () => {

                const parentStep =
                    card.closest('.survey-step');

                if (!parentStep) {
                    return;
                }

                if (input.type === 'radio') {

                    const radioCards =
                        parentStep.querySelectorAll('.option-card');

                    radioCards.forEach(x => {

                        x.classList.remove('selected');

                    });

                }

                updateOptionState(card, input);

            });

        });

    }

    function updateOptionState(card, input) {

        if (input.checked) {

            card.classList.add('selected');

        }
        else {

            card.classList.remove('selected');

        }

    }

    /* =========================================================
       SUBMIT SURVEY
       ========================================================= */

    window.submitSurvey = async () => {

        try {

            if (!validateCurrentStep()) {

                showToast(
                    'Пожалуйста, заполните ответ',
                    'warning'
                );

                animateStepError();

                return;
            }

            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML =
                    'Отправка...';

            }

            const token =
                document.getElementById('inviteToken')?.value;

            if (!token) {

                throw new Error(
                    'Invite token not found'
                );

            }

            const answers = [];

            steps.forEach(step => {

                const questionId =
                    Number(step.dataset.questionId);

                const instanceIndex =
                    Number(step.dataset.instance) || 1;

                const selectedOptionIds = [];

                step.querySelectorAll(
                    '.option-checkbox:checked'
                ).forEach(x => {

                    const id =
                        Number(x.dataset.optionId);

                    if (!isNaN(id)) {

                        selectedOptionIds.push(id);

                    }

                });

                step.querySelectorAll(
                    '.option-radio:checked'
                ).forEach(x => {

                    const id =
                        Number(x.dataset.optionId);

                    if (!isNaN(id)) {

                        selectedOptionIds.push(id);

                    }

                });

                const customAnswerInput =
                    step.querySelector('.custom-answer');

                const customAnswer =
                    customAnswerInput
                        ? customAnswerInput.value.trim()
                        : null;

                answers.push({

                    questionId,

                    selectedOptionIds,

                    customAnswer,

                    instanceIndex

                });

            });

            const payload = {

                inviteToken: token,

                answers

            };

            const response = await fetch(
                '/Invite/Submit',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(text);

            }

            showSuccessScreen();

            showToast(
                'Спасибо! Ваши ответы успешно сохранены.',
                'success'
            );

        }
        catch (error) {

            console.error(error);

            if (submitButton) {

                submitButton.disabled = false;

                submitButton.innerHTML =
                    'Отправить ответы';

            }

            showToast(
                'Произошла ошибка при отправке',
                'danger'
            );

        }

    };

    /* =========================================================
       SUCCESS SCREEN
       ========================================================= */

    function showSuccessScreen() {

        const wrapper =
            document.querySelector('.survey-wrapper');

        if (!wrapper) {
            return;
        }

        wrapper.innerHTML = `

            <div class="survey-success">

                <div class="success-icon">
                    ✓
                </div>

                <div class="success-title">
                    Спасибо!
                </div>

                <div class="success-text">
                    Ваши ответы успешно сохранены.
                    Мы будем рады видеть вас
                    на нашем празднике.
                </div>

            </div>

        `;

        wrapper.scrollIntoView({
            behavior: 'smooth'
        });

    }

    /* =========================================================
       TOASTS
       ========================================================= */

    function showToast(message, type = 'info') {

        const holder =
            document.getElementById('inviteToastHolder');

        if (!holder) {
            return;
        }

        const toast =
            document.createElement('div');

        toast.className =
            `invite-toast ${type}`;

        toast.innerHTML = `

            <div class="invite-toast-content">
                ${escapeHtml(message)}
            </div>

        `;

        holder.appendChild(toast);

        requestAnimationFrame(() => {

            toast.classList.add('show');

        });

        setTimeout(() => {

            toast.classList.remove('show');

            setTimeout(() => {

                toast.remove();

            }, 300);

        }, 4000);

    }

    /* =========================================================
       ESCAPE HTML
       ========================================================= */

    function escapeHtml(str) {

        return String(str || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');

    }

    /* =========================================================
       STEP ERROR ANIMATION
       ========================================================= */

    function animateStepError() {

        const step =
            steps[currentStep];

        if (!step) {
            return;
        }

        step.classList.remove('shake');

        void step.offsetWidth;

        step.classList.add('shake');

    }

    /* =========================================================
       SCROLL EFFECTS
       ========================================================= */

    function initializeScrollEffects() {

        const animatedElements =
            document.querySelectorAll(
                '.fade-up'
            );

        const observer =
            new IntersectionObserver(entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            'visible'
                        );

                    }

                });

            }, {
                threshold: 0.15
            });

        animatedElements.forEach(el => {

            observer.observe(el);

        });

    }

    /* =========================================================
       COUNTDOWN EFFECTS
       ========================================================= */

    function initializeCountdownEffects() {

        const countItems =
            document.querySelectorAll('.count-item');

        countItems.forEach(item => {

            item.addEventListener('mouseenter', () => {

                item.style.transform =
                    'translateY(-6px) scale(1.03)';

            });

            item.addEventListener('mouseleave', () => {

                item.style.transform =
                    '';

            });

        });

    }
    /* =========================================================
   CINEMATIC BACKGROUND SCROLL EFFECT
   ========================================================= */

    initializeCinematicBackground();

    function initializeCinematicBackground() {

        const overlay =
            document.querySelector('.global-background-overlay');

        if (!overlay) {
            return;
        }

        window.addEventListener('scroll', () => {

            const scroll = window.scrollY;

            const max = 700;

            const progress =
                Math.min(scroll / max, 1);

            /* blur */

            const blur =
                progress * 12;

            /* darkness */

            const darkness =
                0.15 + (progress * 0.45);

            overlay.style.backdropFilter =
                `blur(${blur}px)`;

            overlay.style.background =
                `rgba(0,0,0,${darkness})`;

        }, { passive: true });

    }
    /* =========================================================
   HERO SCROLL CINEMATIC EFFECT
   ========================================================= */


})();