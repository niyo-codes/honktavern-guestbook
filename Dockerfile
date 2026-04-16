FROM richarvey/nginx-php-fpm:latest
# Install PostgreSQL libraries
RUN apt-get update && \
    apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pgsql pdo_pgsql \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Other necessary instructions

# Copy your other application files
COPY . /var/www/html
WORKDIR /var/www/html
RUN composer install --no-dev
