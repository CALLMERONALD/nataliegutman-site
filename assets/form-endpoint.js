/* ────────────────────────────────────────────────────────────────────────────
 * FORM ENDPOINT — set this ONCE to start collecting form submissions.
 *
 * Paste your Google Apps Script "Web app URL" between the quotes below.
 * (The 5-minute setup is documented in ../google-apps-script.js.)
 *
 * Every form on the site (guide signups, contact, valuation, and viewing
 * requests) reads this single value, so you only set it here.
 *
 * Until it is set, enquiry forms direct the visitor to Natalie's working
 * contact routes, and no third-party request is made.
 * ──────────────────────────────────────────────────────────────────────────── */
window.SHEETS_URL = '';

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
