FROM php:7.4-apache

# Install system dependencies
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

# Copy only composer.json (if composer.lock doesn't exist locally)
COPY composer.json ./

# Install PHP dependencies
# This will generate composer.lock if it doesn't exist
RUN composer install --no-dev --optimize-autoloader

# Copy the rest of your application files
COPY . /var/www/html/
