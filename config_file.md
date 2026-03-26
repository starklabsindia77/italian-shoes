server {

    listen 80 default_server;

    listen [::]:80 default_server;


    server_name 13.232.130.45;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1024;
    gzip_vary on;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Serve static Next.js assets directly with long-term caching.

    location /_next/ {

        alias /var/www/html/.next/;

        expires 1y;

        add_header Cache-Control "public, immutable";

        access_log off;

    }


    # Redirect root (/) to /auth



    
    # Disable caching for API endpoints.

    location /api/ {

        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";

    }

# Proxy all other requests (pages, etc.) to the Next.js server.

    location / {

        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;

        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffer_size 128k;

        proxy_buffers 4 256k;

        proxy_busy_buffers_size 256k;

    }


    # Optional: Custom error pages

    error_page 500 502 503 504 /custom_50x.html;

    location = /custom_50x.html {

        root /usr/share/nginx/html;

        internal;

    }


    # Logs

    access_log /var/log/nginx/italian-shoes-access.log;

    error_log /var/log/nginx/italian-shoes-error.log warn;

}