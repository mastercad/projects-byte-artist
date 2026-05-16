/*
 * projekte.byte-artist.de — Main Application JS
 * Plain Vanilla JS — kein Build-Step nötig.
 */

/* ─── Scroll Reveal ─── */
function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
            el.classList.add('is-visible');
        });
        return;
    }
    var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
            if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
        });
    }, { threshold: 0.07 });
    document.querySelectorAll('.animate-on-scroll').forEach(function(el) { obs.observe(el); });
}

/* ─── Sticky Nav ─── */
function initNav() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    function update() { nav.classList.toggle('scrolled', window.scrollY > 16); }
    window.addEventListener('scroll', update, { passive: true });
    update();
}

/* ─── Mobile Menu ─── */
function initMobileMenu() {
    var btn   = document.getElementById('nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!btn || !links) return;
    btn.addEventListener('click', function() {
        btn.classList.toggle('open');
        links.classList.toggle('mobile-open');
    });
    links.querySelectorAll('a').forEach(function(a) {
        a.addEventListener('click', function() {
            btn.classList.remove('open');
            links.classList.remove('mobile-open');
        });
    });
}

/* ─── TOC Active State ─── */
function initTocHighlight() {
    var tocLinks = document.querySelectorAll('.doc-toc-item a');
    if (!tocLinks.length) return;
    var headings = [];
    tocLinks.forEach(function(a) {
        var id = a.getAttribute('href').replace('#', '');
        var el = document.getElementById(id);
        if (el) headings.push({ el: el, item: a.closest('.doc-toc-item') });
    });
    if (!headings.length) return;

    // Nach vertikaler DOM-Position sortieren.
    // Ohne Sortierung versagen die Berechnungen wenn TOC-Reihenfolge ≠ DOM-Reihenfolge
    // (z. B. wenn der Base-Template-Block Sections vor dem doc_content-Block rendert).
    headings.sort(function(a, b) {
        return a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top;
    });

    var navOffset = 90;
    var activeIndex = -1;
    var scrollLocked = false;
    var scrollLockTimer = null;

    function setActive(index) {
        if (index === activeIndex) return;
        activeIndex = index;
        headings.forEach(function(h, i) {
            h.item.classList.toggle('active', i === index);
        });
    }

    function onScroll() {
        if (scrollLocked) return;
        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
            setActive(headings.length - 1);
            return;
        }
        var scrollY = window.scrollY + navOffset;
        var next = -1;
        for (var i = 0; i < headings.length; i++) {
            var top = headings[i].el.getBoundingClientRect().top + window.scrollY;
            if (top <= scrollY) next = i;
        }
        setActive(next);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    tocLinks.forEach(function(a) {
        a.addEventListener('click', function() {
            var id = a.getAttribute('href').replace('#', '');
            var idx = -1;
            for (var i = 0; i < headings.length; i++) {
                if (headings[i].el.id === id) { idx = i; break; }
            }
            if (idx === -1) return;

            // Sofort setzen, Scroll-Handler sperren damit er nicht überschreibt
            scrollLocked = true;
            activeIndex = -1;
            setActive(idx);
            clearTimeout(scrollLockTimer);

            // Lock lösen sobald Scroll beendet — kein onScroll-Aufruf danach,
            // damit der per Klick gesetzte Zustand erhalten bleibt
            if ('onscrollend' in window) {
                window.addEventListener('scrollend', function unlock() {
                    scrollLocked = false;
                    window.removeEventListener('scrollend', unlock);
                });
            } else {
                scrollLockTimer = setTimeout(function() { scrollLocked = false; }, 800);
            }
        });
    });

    onScroll();
}

/* ─── Code Copy Buttons ─── */
function initCodeCopy() {
    document.querySelectorAll('.code-block-copy').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var block = btn.closest('.code-block');
            var code  = block ? block.querySelector('code') : null;
            if (!code) return;
            navigator.clipboard.writeText(code.innerText).then(function() {
                btn.classList.add('copied');
                btn.innerHTML = '&#10003; Kopiert';
                setTimeout(function() {
                    btn.classList.remove('copied');
                    btn.innerHTML = 'Kopieren';
                }, 2000);
            });
        });
    });
}

/* ─── Gallery Lightbox ─── */
function initGalleryLightbox() {
    var items = document.querySelectorAll('.gallery-item');
    if (!items.length) return;

    /* Lightbox einmalig anlegen */
    var box = document.getElementById('gallery-lightbox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'gallery-lightbox';
        box.className = 'lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Bild-Lightbox');
        box.innerHTML =
            '<button class="lightbox-close" aria-label="Schließen"><i class="fas fa-xmark"></i></button>' +
            '<div class="lightbox-content">' +
                '<img src="" alt="">' +
                '<p class="lightbox-caption"></p>' +
            '</div>';
        document.body.appendChild(box);
    }

    var img     = box.querySelector('img');
    var caption = box.querySelector('.lightbox-caption');
    var closeBtn = box.querySelector('.lightbox-close');

    function open(src, alt, cap) {
        img.src = src;
        img.alt = alt;
        caption.textContent = cap || '';
        caption.hidden = !cap;
        box.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        box.classList.remove('open');
        document.body.style.overflow = '';
        /* src leeren damit der Browser das Bild nicht im Speicher hält */
        setTimeout(function() { if (!box.classList.contains('open')) img.src = ''; }, 300);
    }

    items.forEach(function(item) {
        function trigger() {
            open(
                item.dataset.lightboxSrc,
                item.querySelector('img') ? item.querySelector('img').alt : '',
                item.dataset.lightboxCaption
            );
        }
        item.addEventListener('click', trigger);
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
        });
    });

    closeBtn.addEventListener('click', close);
    box.addEventListener('click', function(e) {
        if (e.target === box) close();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && box.classList.contains('open')) close();
    });
}

/* ─── Dev Dropdown ─── */
function initDevDropdown() {
    var dropdown = document.querySelector('.nav-dev-dropdown');
    if (!dropdown) return;
    var btn  = dropdown.querySelector('.nav-dev-btn');
    var menu = dropdown.querySelector('.nav-dev-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        menu.hidden = open;
    });

    document.addEventListener('click', function() {
        btn.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
    });
}

/* ─── Clickable Cards ─── */
function initClickableCards() {
    document.querySelectorAll('.project-card[data-href]').forEach(function(card) {
        card.addEventListener('click', function(e) {
            if (e.target.closest('a, button, .tag')) return;
            window.location.href = card.dataset.href;
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initNav();
    initMobileMenu();
    initDevDropdown();
    initScrollReveal();
    initTocHighlight();
    initCodeCopy();
    initGalleryLightbox();
    initClickableCards();
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach(function(block) {
            hljs.highlightElement(block);
        });
    }
});
