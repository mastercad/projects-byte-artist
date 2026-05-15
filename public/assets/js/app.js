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
    var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
            var h = headings.find(function(h) { return h.el === e.target; });
            if (h) h.item.classList.toggle('active', e.isIntersecting);
        });
    }, { rootMargin: '-68px 0px -70% 0px' });
    headings.forEach(function(h) { obs.observe(h.el); });
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

document.addEventListener('DOMContentLoaded', function() {
    initNav();
    initMobileMenu();
    initScrollReveal();
    initTocHighlight();
    initCodeCopy();
    if (typeof hljs !== 'undefined') {
        document.querySelectorAll('pre code').forEach(function(block) {
            hljs.highlightElement(block);
        });
    }
});
