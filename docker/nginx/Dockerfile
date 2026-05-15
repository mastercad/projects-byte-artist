# ─── nginx-Image für ba-projekte ──────────────────────────────────────────────
# Statische Assets (public/) werden direkt in das Image kopiert –
# kein Bind-Mount in Produktion nötig.
FROM nginx:1.27-alpine

# Standard-Config entfernen, eigene einsetzen
RUN rm -f /etc/nginx/conf.d/default.conf

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Statische Assets aus dem Build-Kontext baken
COPY public/ /var/www/html/public/

EXPOSE 80
