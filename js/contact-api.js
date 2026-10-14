document.addEventListener("DOMContentLoaded", function () {
  // Newsletter form — submit via fetch so success shows inline without redirect
  var nlForm = document.getElementById("nlForm");
  if (nlForm) {
    var nlBtn = document.getElementById("nlBtn");
    var nlSuccess = document.getElementById("nlSuccess");

    nlForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var emailInput = nlForm.querySelector("input[type='email']");
      var email = emailInput.value.trim().toLowerCase();

      // Deduplicate: if this browser already subscribed with this email, skip POST
      var stored = JSON.parse(localStorage.getItem("nl_subscribed") || "[]");
      if (stored.indexOf(email) !== -1) {
        nlSuccess.classList.add("visible");
        return;
      }

      var action = nlForm.getAttribute("action") || "";
      if (!action || action === "YOUR_BREVO_FORM_URL") {
        nlSuccess.classList.add("visible");
        nlBtn.disabled = true;
        return;
      }

      // Mark as submitted immediately so rapid re-clicks don't slip through
      stored.push(email);
      localStorage.setItem("nl_subscribed", JSON.stringify(stored));

      nlBtn.disabled = true;
      nlBtn.textContent = "Enviando…";

      // no-cors: Brevo responds with a redirect we don't need to follow.
      // We can't read the response body but the POST goes through fine.
      fetch(action, {
        method: "POST",
        mode: "no-cors",
        body: new FormData(nlForm),
      })
        .then(function () {
          nlSuccess.classList.add("visible");
          emailInput.value = "";
        })
        .catch(function () {
          nlSuccess.classList.add("visible");
        })
        .finally(function () {
          nlBtn.disabled = false;
          nlBtn.textContent = "Suscribirme";
        });
    });
  }

  var form = document.getElementById("contactForm");
  if (!form) return;

  var successBox = document.getElementById("formSuccess");
  var errorBox = document.getElementById("formError");
  var submitBtn = form.querySelector(".btn-submit");
  var whatsappLink = document.getElementById("contactWhatsApp");
  var routeInputs = form.querySelectorAll("input[name='tipo_consulta']");

  function selectedRoute() {
    var selected = form.querySelector("input[name='tipo_consulta']:checked");
    return selected ? selected.value : "Hogar - Filtro Vita";
  }

  function updateWhatsApp() {
    if (!whatsappLink) return;
    var route = selectedRoute();
    var message = route.indexOf("Comunidad") !== -1
      ? "Hola AguaSAN, quiero evaluar un proyecto de filtración para una comunidad o institución. Mi ubicación es: "
      : route.indexOf("Evaluación") !== -1
        ? "Hola AguaSAN, quiero consultar sobre una evaluación de calidad de agua. Mi ubicación es: "
        : "Hola AguaSAN, busco una solución para mi hogar con un Filtro Vita. Mi ubicación es: ";
    whatsappLink.href = "https://wa.me/51974395777?text=" + encodeURIComponent(message);
  }

  routeInputs.forEach(function (input) { input.addEventListener("change", updateWhatsApp); });
  updateWhatsApp();

  document.querySelectorAll("[data-inquiry='community']").forEach(function (link) {
    link.addEventListener("click", function () {
      var community = form.querySelector("input[value='Comunidad o institución - FLAI']");
      if (community) {
        community.checked = true;
        updateWhatsApp();
      }
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    successBox.style.display = "none";
    errorBox.style.display = "none";
    submitBtn.disabled = true;

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          successBox.style.display = "block";
          form.reset();
        } else {
          errorBox.style.display = "block";
        }
      })
      .catch(function () {
        errorBox.style.display = "block";
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });
});
