const SUPABASE_URL = 'https://supabase.vandalesolutions.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzgxNTcyODc0LCJleHAiOjE5MzkyNTI4NzR9.F676ikQc-ocleC7cDjwiLB9N_YaUmOyVj2NOeR7o2VQ';

(function () {
  'use strict';

  var API_URL = SUPABASE_URL + '/rest/v1/properties';
  var PHOTO_BASE_URL = SUPABASE_URL + '/storage/v1/object/public/natalie-properties/';
  var UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  var STATUS_LABELS = {
    available: 'Available',
    under_offer: 'Under offer',
    sold: 'Sold'
  };

  var AMENITY_LABELS = {
    parking: 'Parking',
    garage: 'Garage',
    elevator: 'Elevator',
    pool: 'Pool',
    garden: 'Garden',
    terrace: 'Terrace / Balcony',
    sea_view: 'Sea view',
    air_con: 'Air conditioning',
    storage: 'Storage',
    furnished: 'Furnished'
  };

  // These static icon strings are the only HTML inserted by this script.
  var ICONS = {
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Bedrooms</title><path d="M4 19v-8h16v8M7 11V7h5a4 4 0 014 4M4 15h16"/></svg>',
    bath: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Bathrooms</title><path d="M4 13h16v2a4 4 0 01-4 4H8a4 4 0 01-4-4v-2M6 13V6a2 2 0 012-2 2 2 0 012 2M8 19v2M16 19v2"/></svg>',
    area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Area</title><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
    parking: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Parking</title><path d="M6 21V3h7a5 5 0 010 10H6M6 13h7"/></svg>',
    garage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Garage</title><path d="M3 21V8l9-4 9 4v13M7 21v-9h10v9M7 16h10"/></svg>',
    elevator: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Elevator</title><path d="M5 3h14v18H5z"/><path d="M9 10V6m0 0L7.5 7.5M9 6l1.5 1.5"/><path d="M15 14v4m0 0l-1.5-1.5M15 18l1.5-1.5"/></svg>',
    pool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Pool</title><path d="M3 10c2 0 2 1.5 4 1.5S9 10 11 10s2 1.5 4 1.5S17 10 19 10s2 1.5 2 1.5"/><path d="M3 15c2 0 2 1.5 4 1.5S9 15 11 15s2 1.5 4 1.5S17 15 19 15s2 1.5 2 1.5"/><path d="M7 10V5a2 2 0 014 0v5"/></svg>',
    garden: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Garden</title><path d="M12 21V9M12 14c-4 0-7-2.5-7-7 4 0 7 2.5 7 7z"/><path d="M12 11c0-4 2.5-7 7-7 0 4-2.5 7-7 7z"/></svg>',
    terrace: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Terrace / Balcony</title><path d="M4 10h16M5 10l2-6h10l2 6"/><path d="M6 10v10M18 10v10M3 20h18"/><path d="M9 14h6"/></svg>',
    sea_view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Sea view</title><path d="M16 9a4 4 0 10-8 0"/><path d="M3 14c2 0 2 1.5 4 1.5S9 14 11 14s2 1.5 4 1.5S17 14 19 14s2 1.5 2 1.5"/><path d="M3 19c2 0 2 1.5 4 1.5S9 19 11 19s2 1.5 4 1.5S17 19 19 19s2 1.5 2 1.5"/></svg>',
    air_con: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Air conditioning</title><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/><path d="M4.5 10l3.4-.9-.9-3.4M19.5 14l-3.4.9.9 3.4"/></svg>',
    storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Storage</title><path d="M4 7h16v14H4zM3 3h18v4H3z"/><path d="M9 11h6"/></svg>',
    furnished: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><title>Furnished</title><path d="M6 12V7a3 3 0 016 0v5M4 12h16v6H4z"/><path d="M7 18v3M17 18v3M12 12V8a3 3 0 016 0v4"/></svg>'
  };

  function createElement(tagName, className, text) {
    var element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function hasValue(value) {
    return value !== null && value !== undefined && value !== '';
  }

  function appendIcon(parent, key, className) {
    if (!Object.prototype.hasOwnProperty.call(ICONS, key)) return null;
    var icon = createElement('span', className);
    icon.innerHTML = ICONS[key];
    parent.appendChild(icon);
    return icon;
  }

  function photoUrl(key) {
    return typeof key === 'string' && key ? PHOTO_BASE_URL + encodeURIComponent(key) : '';
  }

  function formatPrice(value) {
    var price = Number(value);
    if (!isFinite(price) || price <= 0) return 'Price on request';
    return '€' + String(Math.round(price)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function statusLabel(status) {
    return STATUS_LABELS[status] || String(status || '');
  }

  function apiGet(query) {
    return fetch(API_URL + query, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Accept-Profile': 'natalie'
      }
    }).then(function (response) {
      if (!response.ok) throw new Error('Listings request failed with HTTP ' + response.status);
      return response.json();
    }).then(function (rows) {
      if (!Array.isArray(rows)) throw new Error('Listings response was not an array');
      return rows;
    });
  }

  // off-market.html marks its <body data-off-market>; every other page gets only
  // the public (off_market=false) listings. Off-market rows are still published=true
  // rows — same RLS, just a different page.
  function listingsQuery(offMarket) {
    return '?select=*&published=eq.true&off_market=eq.' + (offMarket ? 'true' : 'false') + '&order=created_at.desc';
  }

  function isOffMarketPage() {
    return document.body.hasAttribute('data-off-market');
  }

  function fetchProperties() {
    return apiGet(listingsQuery(isOffMarketPage()));
  }

  function fetchPropertyTitle(id) {
    return apiGet('?select=title&id=eq.' + encodeURIComponent(id) + '&published=eq.true&limit=1');
  }

  function cardArea(property) {
    if (hasValue(property.area_built)) return property.area_built;
    if ((property.type === 'plot' || property.type === 'commercial') && hasValue(property.area_plot)) {
      return property.area_plot;
    }
    return null;
  }

  function knownAmenities(property) {
    var known = [];
    (Array.isArray(property.amenities) ? property.amenities : []).forEach(function (key) {
      if (AMENITY_LABELS[key] && known.indexOf(key) === -1 && known.length < 10) known.push(key);
    });
    return known;
  }

  function createCardFact(iconKey, value, suffix) {
    var fact = createElement('span', 'inline-flex items-center gap-1.5');
    appendIcon(fact, iconKey, 'w-[18px] h-[18px] text-faint flex-none');
    fact.appendChild(document.createTextNode(String(value) + (suffix || '')));
    return fact;
  }

  // DL 101-D/2020 art. 22(3): a property advertisement must state the energy class.
  // The card is an advertisement in its own right, so this renders on the card too.
  function energyLabel(value) {
    return value === 'exempt' ? 'Energy: exempt' : 'Energy ' + String(value);
  }

  function createEnergyBadge(value) {
    return createElement('span', 'inline-flex items-center border border-hairline px-2 py-0.5 text-xs text-muted', energyLabel(value));
  }

  function createPropertyCard(property, onOpen) {
    var article = createElement('article', 'group relative min-w-0 [overflow-wrap:anywhere] reveal is-in');
    article.setAttribute('data-property-id', String(property.id || ''));

    var openButton = createElement('button', 'absolute inset-0 z-10 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent');
    openButton.type = 'button';
    openButton.setAttribute('aria-label', String(property.title || '') + ' — view details');
    openButton.addEventListener('click', function () { onOpen(property, openButton); });
    article.appendChild(openButton);

    var media = createElement('div', 'relative aspect-[4/3] bg-surface overflow-hidden mb-5');
    var image = createElement('img', 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-105');
    image.src = photoUrl(Array.isArray(property.photos) ? property.photos[0] : '');
    image.alt = String(property.title || '');
    image.loading = 'lazy';
    media.appendChild(image);

    if (property.status && property.status !== 'available') {
      media.appendChild(createElement('span', 'absolute top-4 left-4 label text-white bg-ink/85 px-3 py-1.5', statusLabel(property.status)));
    }
    article.appendChild(media);

    article.appendChild(createElement('p', 'label text-faint mb-2', property.location_area));
    article.appendChild(createElement('h3', 'font-serif text-2xl mb-1 group-hover:text-accent transition-colors', property.title));
    article.appendChild(createElement('p', 'text-ink text-lg mb-3', formatPrice(property.price)));

    var facts = createElement('div', 'flex items-center gap-5 text-sm text-muted mb-3');
    if (hasValue(property.bedrooms)) facts.appendChild(createCardFact('bed', property.bedrooms));
    if (hasValue(property.bathrooms)) facts.appendChild(createCardFact('bath', property.bathrooms));
    var area = cardArea(property);
    if (hasValue(area)) facts.appendChild(createCardFact('area', area, ' m²'));
    if (hasValue(property.energy_rating)) facts.appendChild(createEnergyBadge(property.energy_rating));
    article.appendChild(facts);

    var amenities = createElement('div', 'flex flex-wrap items-center gap-3 text-faint');
    knownAmenities(property).forEach(function (key) {
      var item = createElement('span', 'inline-flex');
      item.title = AMENITY_LABELS[key];
      appendIcon(item, key, 'w-[18px] h-[18px] text-faint');
      amenities.appendChild(item);
    });
    article.appendChild(amenities);

    return article;
  }

  function setStateVisibility(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('hidden', !visible);
  }

  function setupModal() {
    var modal = document.getElementById('property-modal');
    if (!modal) return null;
    var closeButton = document.getElementById('property-modal-close');
    var prevButton = document.getElementById('property-modal-prev');
    var nextButton = document.getElementById('property-modal-next');
    var returnTarget = null;
    // The arrow buttons are static markup, so their listeners attach once here and
    // dispatch through this gallery state, which every openModal call resets.
    var gallery = { count: 0, index: 0, select: function () {} };

    function stepPhoto(delta) {
      if (gallery.count < 2) return;
      gallery.select((gallery.index + delta + gallery.count) % gallery.count);
    }

    prevButton.addEventListener('click', function () { stepPhoto(-1); });
    nextButton.addEventListener('click', function () { stepPhoto(1); });
    modal.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowLeft') { event.preventDefault(); stepPhoto(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); stepPhoto(1); }
    });

    closeButton.addEventListener('click', function () { modal.close(); });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.close();
    });
    modal.addEventListener('close', function () {
      document.body.style.overflow = '';
      if (returnTarget && document.contains(returnTarget)) returnTarget.focus();
      returnTarget = null;
    });
    // Back/forward-cache can restore the page with the scroll lock still applied
    // (modal was open when the user navigated away). Clear it unless the modal is open.
    window.addEventListener('pageshow', function () {
      if (!modal.open) document.body.style.overflow = '';
    });

    return function openModal(property, originButton) {
      var photos = (Array.isArray(property.photos) ? property.photos : []).filter(function (key) {
        return typeof key === 'string' && key;
      });
      var mainImage = document.getElementById('property-modal-main-image');
      var thumbnails = document.getElementById('property-modal-thumbnails');
      var location = document.getElementById('property-modal-location');
      var title = document.getElementById('property-modal-title');
      var price = document.getElementById('property-modal-price');
      var specs = document.getElementById('property-modal-specs');
      var description = document.getElementById('property-modal-description');
      var amenitiesSection = document.getElementById('property-modal-amenities-section');
      var amenitiesGrid = document.getElementById('property-modal-amenities');
      var enquiry = document.getElementById('property-modal-enquiry');
      var photoCount = document.getElementById('property-modal-photo-count');

      mainImage.src = photoUrl(photos[0]);
      mainImage.alt = String(property.title || '');
      clearElement(thumbnails);

      gallery.count = photos.length;
      gallery.index = 0;
      prevButton.hidden = photos.length < 2;
      nextButton.hidden = photos.length < 2;
      photoCount.hidden = photos.length < 2;

      var thumbnailButtons = [];
      function selectPhoto(index) {
        gallery.index = index;
        mainImage.src = photoUrl(photos[index]);
        mainImage.alt = String(property.title || '') + ', photo ' + (index + 1);
        photoCount.textContent = (index + 1) + ' / ' + photos.length;
        thumbnailButtons.forEach(function (button, buttonIndex) {
          var active = buttonIndex === index;
          button.classList.toggle('opacity-60', !active);
          button.classList.toggle('opacity-100', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
      }
      gallery.select = selectPhoto;

      photos.forEach(function (key, index) {
        var button = createElement('button', 'flex-none opacity-60 focus-visible:outline-none focus-visible:ring-2 ring-accent');
        button.type = 'button';
        button.setAttribute('aria-label', 'Photo ' + (index + 1));
        var thumb = createElement('img', 'w-20 h-14 object-cover');
        thumb.src = photoUrl(key);
        thumb.alt = '';
        thumb.loading = 'lazy';
        button.appendChild(thumb);
        button.addEventListener('click', function () { selectPhoto(index); });
        thumbnailButtons.push(button);
        thumbnails.appendChild(button);
      });
      if (photos.length) selectPhoto(0);

      clearElement(location);
      location.appendChild(createElement('span', 'label text-faint', property.location_area));
      if (property.status && property.status !== 'available') {
        location.appendChild(createElement('span', 'label text-white bg-ink/85 px-3 py-1.5', statusLabel(property.status)));
      }

      title.textContent = String(property.title || '');
      price.textContent = formatPrice(property.price);

      clearElement(specs);
      var modalFacts = [
        ['Bedrooms', property.bedrooms, ''],
        ['Bathrooms', property.bathrooms, ''],
        ['Built area', property.area_built, ' m²'],
        ['Plot area', property.area_plot, ' m²'],
        ['Floor', property.floor, ''],
        ['Year built', property.year_built, '']
      ];
      modalFacts.forEach(function (fact) {
        if (!hasValue(fact[1])) return;
        var pair = createElement('div');
        pair.appendChild(createElement('p', 'label text-faint mb-1', fact[0]));
        pair.appendChild(createElement('p', 'text-ink', String(fact[1]) + fact[2]));
        specs.appendChild(pair);
      });
      // Energy class is legally required in the advertisement, so it renders unconditionally
      // (a published row cannot lack it — DB constraint published_needs_content).
      var energyPair = createElement('div');
      energyPair.appendChild(createElement('p', 'label text-faint mb-1', 'Energy class'));
      energyPair.appendChild(createElement('p', 'text-ink',
        hasValue(property.energy_rating)
          ? (property.energy_rating === 'exempt' ? 'Exempt' : property.energy_rating)
          : 'Not stated'));
      specs.appendChild(energyPair);

      clearElement(description);
      String(property.description || '').split(/\r?\n\s*\r?\n/).filter(function (paragraph) {
        return paragraph.trim();
      }).forEach(function (paragraph) {
        description.appendChild(createElement('p', '', paragraph.trim()));
      });

      clearElement(amenitiesGrid);
      var propertyAmenities = knownAmenities(property);
      propertyAmenities.forEach(function (key) {
        var item = createElement('span', 'inline-flex items-center gap-2.5 text-sm text-muted');
        item.title = AMENITY_LABELS[key];
        appendIcon(item, key, 'w-[18px] h-[18px] text-faint flex-none');
        item.appendChild(document.createTextNode(AMENITY_LABELS[key]));
        amenitiesGrid.appendChild(item);
      });
      amenitiesSection.hidden = propertyAmenities.length === 0;

      enquiry.href = '/contact?property=' + encodeURIComponent(String(property.id || ''));
      returnTarget = originButton;
      document.body.style.overflow = 'hidden';
      modal.showModal();
      closeButton.focus();
    };
  }

  function loadPropertiesPage(openModal) {
    var grid = document.getElementById('property-grid');
    if (!grid) return;
    var emptyState = document.getElementById('properties-empty');
    var errorState = document.getElementById('properties-error');
    setStateVisibility(emptyState, false);
    setStateVisibility(errorState, false);

    fetchProperties().then(function (properties) {
      clearElement(grid);
      if (!properties.length) {
        setStateVisibility(emptyState, true);
        return;
      }
      properties.forEach(function (property) {
        grid.appendChild(createPropertyCard(property, openModal));
      });
    }).catch(function (error) {
      setStateVisibility(errorState, true);
      console.error('Unable to load published property listings.', error);
    });
  }

  function loadFeaturedProperties() {
    var section = document.getElementById('featured-properties-section');
    var grid = document.getElementById('featured-grid');
    if (!section || !grid) return;
    section.hidden = true;

    fetchProperties().then(function (properties) {
      var featured = properties.filter(function (property) { return property.featured === true; }).slice(0, 3);
      if (!featured.length) return;
      clearElement(grid);
      featured.forEach(function (property) {
        grid.appendChild(createPropertyCard(property, function () {
          window.location.href = '/properties';
        }));
      });
      section.hidden = false;
    }).catch(function () {
      section.hidden = true;
    });
  }

  function prefillContactEnquiry() {
    var message = document.getElementById('c-msg');
    if (!message || message.value) return;
    var id = new URLSearchParams(window.location.search).get('property');
    if (!id || !UUID_PATTERN.test(id)) return;

    fetchPropertyTitle(id).then(function (rows) {
      if (!rows.length || typeof rows[0].title !== 'string' || message.value) return;
      message.value = "I'm interested in " + rows[0].title + ' (ref ' + id.slice(0, 8) + ').';
    }).catch(function () {});
  }

  function init() {
    var openModal = setupModal();
    loadPropertiesPage(openModal);
    loadFeaturedProperties();
    prefillContactEnquiry();
  }

  if (typeof document === 'undefined') {
    if (formatPrice(1250000) !== '€1.250.000' || formatPrice(0) !== 'Price on request' ||
        formatPrice(null) !== 'Price on request' || !UUID_PATTERN.test('11111111-1111-4111-8111-111111111111') ||
        UUID_PATTERN.test('11111111-1111-4111-8111-11111111111Z') ||
        cardArea({ type: 'plot', area_built: null, area_plot: 900 }) !== 900 ||
        knownAmenities({ amenities: ['pool', 'pool', 'unknown'] }).join(',') !== 'pool' ||
        listingsQuery(false).indexOf('off_market=eq.false') === -1 ||
        listingsQuery(true).indexOf('off_market=eq.true') === -1 ||
        listingsQuery(true).indexOf('published=eq.true') === -1) {
      throw new Error('Portfolio self-check failed');
    }
    console.log('portfolio self-check: ok');
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
