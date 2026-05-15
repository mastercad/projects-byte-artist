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

/* ─── Tag Filter + Pagination ─── */
function initTagFilter() {
    var grid       = document.getElementById('projects-grid');
    var bar        = document.getElementById('tag-filter-bar');
    var pagination = document.getElementById('pagination');
    if (!grid) return;

    var allCards   = Array.from(grid.querySelectorAll('.project-card'));
    if (!allCards.length) return;

    var PER_PAGE   = 9;
    var activeTag  = null;
    var currentPage = 1;

    /* alle eindeutigen Tags einmalig aus dem DOM sammeln */
    var allTags = [];
    allCards.forEach(function(card) {
        (card.dataset.tags || '').split(',').forEach(function(t) {
            t = t.trim();
            if (t && allTags.indexOf(t) === -1) allTags.push(t);
        });
    });

    function filteredCards() {
        if (!activeTag) return allCards;
        return allCards.filter(function(card) {
            return (card.dataset.tags || '').split(',').map(function(t) { return t.trim(); }).indexOf(activeTag) !== -1;
        });
    }

    function renderPage(page) {
        var visible = filteredCards();
        var totalPages = Math.ceil(visible.length / PER_PAGE);
        currentPage = Math.min(page, totalPages) || 1;
        var start = (currentPage - 1) * PER_PAGE;
        var end   = start + PER_PAGE;

        allCards.forEach(function(card) { card.hidden = true; });
        visible.slice(start, end).forEach(function(card) { card.hidden = false; });

        /* aktive Tags auf Cards markieren */
        grid.querySelectorAll('.tag--clickable').forEach(function(b) {
            b.classList.toggle('tag--active', b.dataset.filterTag === activeTag);
        });

        /* Pagination */
        if (pagination) {
            pagination.innerHTML = '';
            pagination.hidden = totalPages <= 1;
            for (var i = 1; i <= totalPages; i++) {
                var btn = document.createElement('button');
                btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
                btn.textContent = i;
                btn.dataset.page = i;
                pagination.appendChild(btn);
            }
        }
    }

    function renderBar() {
        if (!bar) return;
        if (!activeTag) { bar.hidden = true; bar.innerHTML = ''; return; }
        bar.innerHTML = '';
        var resetBtn = document.createElement('button');
        resetBtn.className = 'tag-filter';
        resetBtn.textContent = '✕ Alle anzeigen';
        resetBtn.addEventListener('click', function() { activeTag = null; renderBar(); renderPage(1); });
        bar.appendChild(resetBtn);
        allTags.forEach(function(t) {
            var btn = document.createElement('button');
            btn.className = 'tag-filter' + (t === activeTag ? ' tag-filter--active' : '');
            btn.textContent = t;
            btn.dataset.tag = t;
            bar.appendChild(btn);
        });
        bar.hidden = false;
    }

    /* Klick auf Tag in der Bar */
    if (bar) {
        bar.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-tag]');
            if (!btn) return;
            activeTag = btn.dataset.tag === activeTag ? null : btn.dataset.tag;
            renderBar();
            renderPage(1);
        });
    }

    /* Klick auf Tag auf einer Card */
    grid.addEventListener('click', function(e) {
        var btn = e.target.closest('.tag--clickable');
        if (!btn) return;
        e.preventDefault();
        var tag = btn.dataset.filterTag;
        activeTag = activeTag === tag ? null : tag;
        renderBar();
        renderPage(1);
    });

    /* Klick auf Pagination */
    if (pagination) {
        pagination.addEventListener('click', function(e) {
            var btn = e.target.closest('.pagination-btn');
            if (!btn) return;
            renderPage(parseInt(btn.dataset.page, 10));
        });
    }

    renderPage(1);
}

document.addEventListener('DOMContentLoaded', function() {
    initNav();
    initMobileMenu();
    initScrollReveal();
    initTocHighlight();
    initCodeCopy();
    initGalleryLightbox();
    initTagFilter();
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach(function(block) {
            hljs.highlightElement(block);
        });
    }
});
