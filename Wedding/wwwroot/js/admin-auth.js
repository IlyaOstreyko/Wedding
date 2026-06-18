window.openPasswordModal = function () {
    new bootstrap.Modal(document.getElementById('passwordModal')).show();
};

window.checkPassword = async function () {
    const password = document.getElementById("adminPassword").value;

    const res = await fetch("/AdminAuth/Login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password)
    });

    if (res.ok) {

        // берём текущий URL
        const currentUrl = window.location.pathname;

        // убираем /Locked в конце
        const targetUrl = currentUrl.replace("/Locked", "");

        window.location.href = targetUrl;
    }
    else {
        alert("Неверный пароль");
    }
};