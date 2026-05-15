# ─── Stage 1: Composer-Abhängigkeiten installieren ───────────────────────────
FROM composer:2 AS composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --optimize-autoloader \
        --no-scripts

# ─── Stage 2: PHP-FPM Runtime ─────────────────────────────────────────────────
FROM php:8.5-fpm-alpine AS app

# Nur die minimal nötigen PHP-Extensions
RUN apk add --no-cache \
        icu-libs \
        libzip \
    && apk add --no-cache --virtual .build-deps \
        icu-dev \
        libzip-dev \
    && docker-php-ext-install -j$(nproc) intl zip opcache \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/*

# PHP- und OPcache-Konfiguration
COPY .docker/php/php.ini     /usr/local/etc/php/conf.d/app.ini
COPY .docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html

# Vendor aus Stage 1
COPY --from=composer /app/vendor ./vendor

# App-Code
COPY composer.json ./
COPY bin/       ./bin/
COPY config/    ./config/
COPY public/    ./public/
COPY src/       ./src/
COPY templates/ ./templates/
COPY .env.dist  .env

# Korrekte Rechte: App-Code root:root 755/644, nur var/ für www-data
RUN chmod 755 /var/www/html \
    && find . -not -path './var/*' -type d -exec chmod 755 {} + \
    && find . -not -path './var/*' -type f -exec chmod 644 {} + \
    && chmod +x bin/console \
    && mkdir -p var/cache var/log \
    && chown -R www-data:www-data var/

# Symfony-Cache für Produktion warmup
RUN APP_ENV=prod APP_SECRET=placeholder php bin/console cache:warmup --env=prod

USER www-data

EXPOSE 9000
