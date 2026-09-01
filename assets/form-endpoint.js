/* ────────────────────────────────────────────────────────────────────────────
 * FORM ENDPOINT: every form on the site posts here.
 *
 * This is the n8n intake webhook on the site's technical provider
 * (workflow "Natalie Site Forms Intake"): it validates each submission,
 * appends it to the "Forms" tab of Natalie's Google Sheet and emails her.
 * Guide signups, contact, valuation, viewing requests and the private-listing
 * gate all read this single value.
 *
 * Empty this string to park all forms again (they fall back to the honest
 * "form unavailable" message with direct contact routes).
 * ──────────────────────────────────────────────────────────────────────────── */
window.SHEETS_URL = 'https://n8n.vandalesolutions.com/webhook/gandarinha-gate-7f3a9c2e51b4d8a6';

window.showFormUnavailable = function (form, className) {
  var result = document.createElement('div');
  result.className = className;
  result.setAttribute('role', 'status');

  var heading = document.createElement('p');
  heading.className = 'font-serif text-2xl text-ink mb-3';
  heading.textContent = 'Online form unavailable.';

  var detail = document.createElement('p');
  detail.className = 'text-muted';
  detail.appendChild(document.createTextNode('Your request has not been sent. Please contact Natalie directly on '));

  var whatsapp = document.createElement('a');
  whatsapp.href = 'https://wa.me/351969227709';
  whatsapp.className = 'link-underline text-ink';
  whatsapp.textContent = 'WhatsApp';
  detail.appendChild(whatsapp);
  detail.appendChild(document.createTextNode(' or call '));

  var phone = document.createElement('a');
  phone.href = 'tel:+351969227709';
  phone.className = 'link-underline text-ink';
  phone.textContent = '+351 969 227 709';
  detail.appendChild(phone);
  detail.appendChild(document.createTextNode('.'));

  result.appendChild(heading);
  result.appendChild(detail);
  while (form.firstChild) form.removeChild(form.firstChild);
  form.appendChild(result);
};
