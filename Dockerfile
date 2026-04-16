FROM php:7.4-apache

# Install system dependencies required for Composer and extensions
RUN apt-get update && \
    apt-get install -y \
    libpq-dev \
    git \
    unzip \
    && docker-php-ext-install pgsql pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy Composer files first to leverage Docker layer caching
COPY composer.json composer.json
COPY composer.lock composer.lock

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Copy your application files
COPY . /var/www/html/   
