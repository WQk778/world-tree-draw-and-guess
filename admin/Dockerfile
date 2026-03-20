FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Hardened Nginx config for Admin
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always; \
    add_header Content-Security-Policy "default-src '\''self\'\''; connect-src '\''self'\'' https://cwqbdzjswdrbwrwdmxyi.supabase.co http://localhost:3000 wss://cwqbdzjswdrbwrwdmxyi.supabase.co; img-src '\''self'\'' data: https://api.dicebear.com https://cwqbdzjswdrbwrwdmxyi.supabase.co; style-src '\''self'\'' '\''unsafe-inline\'\''; script-src '\''self'\'' '\''unsafe-inline\'\'';" always; \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]