const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (!reduceMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.animate(
          [
            { opacity: 0, transform: "translateY(24px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 680, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" }
        );
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -7% 0px", threshold: 0.1 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.animate(
          [
            { opacity: 0.82, transform: "scale(1.035)" },
            { opacity: 1, transform: "scale(1)" }
          ],
          { duration: 1000, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" }
        );
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "8% 0px", threshold: 0.08 }
  );

  document.querySelectorAll(".hero-photo img, .contact-photo img, .intro-photo img, .npd-photo img").forEach((image) => imageObserver.observe(image));
}

const mobileSupportCta = document.querySelector(".mobile-support-cta");
const supportZones = document.querySelectorAll("#appuyer, .bottom-support");

if (mobileSupportCta && "IntersectionObserver" in window) {
  const visibleSupportZones = new Set();
  const supportObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleSupportZones.add(entry.target);
        else visibleSupportZones.delete(entry.target);
      });
      mobileSupportCta.classList.toggle("is-hidden", visibleSupportZones.size > 0);
    },
    { threshold: 0.08 }
  );

  supportZones.forEach((zone) => supportObserver.observe(zone));
}

const postalPattern = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

const validateField = (input) => {
  const error = input.closest(".field")?.querySelector(".field-error");
  let message = "";

  if (!input.value.trim()) {
    message = "Ce champ est requis.";
  } else if (input.type === "email" && !input.validity.valid) {
    message = "Entrez une adresse courriel valide.";
  } else if (input.name === "postal_code" && !postalPattern.test(input.value.trim())) {
    message = "Entrez un code postal canadien valide.";
  }

  input.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
  return !message;
};

document.querySelectorAll("[data-support-form]").forEach((form) => {
  const inputs = [...form.querySelectorAll(".field input")];
  const status = form.querySelector(".form-status");
  const submitButton = form.querySelector('button[type="submit"]');

  inputs.forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") validateField(input);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const valid = inputs.map(validateField).every(Boolean);

    if (!valid) {
      status.dataset.state = "error";
      status.textContent = "Vérifiez les champs indiqués avant de continuer.";
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    status.dataset.state = "sending";
    status.textContent = "Envoi de votre appui en cours…";
    form.setAttribute("aria-busy", "true");
    if (submitButton) submitButton.disabled = true;

    const formData = new FormData(form);
    formData.set("replyTo", formData.get("email"));

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error("Static Forms submission failed");
      }

      form.reset();
      inputs.forEach((input) => input.removeAttribute("aria-invalid"));
      status.dataset.state = "success";
      status.textContent = "Merci pour votre appui. Vos informations ont bien été transmises à la campagne.";
    } catch (error) {
      status.dataset.state = "error";
      status.textContent = "Une erreur est survenue pendant l’envoi. Veuillez réessayer dans quelques instants.";
    } finally {
      form.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
    }
  });
});
