FROM php:8.2-fpm

RUN apt-get update && \
    apt-get install -y libpq-dev && \
    docker-php-ext-install pgsql pdo_pgsql && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . /var/www/html

WORKDIR /var/www/html

RUN composer install --no-dev
