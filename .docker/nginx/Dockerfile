# ─── nginx-Image für ba-projekte ──────────────────────────────────────────────
# Statische Assets (public/) werden direkt in das Image kopiert –
# kein Bind-Mount in Produktion nötig.
FROM nginx:1.31-alpine

# Standard-Config entfernen, eigene einsetzen
RUN rm -f /etc/nginx/conf.d/default.conf

COPY .docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Statische Assets aus dem Build-Kontext baken
COPY public/ /var/www/html/public/

# nginx-User (uid 101) braucht nur Leserechte
RUN chown -R nginx:nginx /var/www/html/public \
    && find /var/www/html/public -type d -exec chmod 755 {} + \
    && find /var/www/html/public -type f -exec chmod 644 {} +

EXPOSE 80
