FROM php:8.2-fpm

# Install the  Postgres driver for PHP
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql

WORKDIR /var/www/html
COPY . .


# Bind to 0.0.0.0 so Render can see the app
CMD ["php", "-S", "0.0.0.0:10000"]
