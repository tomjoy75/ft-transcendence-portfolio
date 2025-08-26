FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/public ./public

EXPOSE 3000

RUN apk add nginx

COPY docker/frontend/config/nginx.conf /etc/nginx/nginx.conf

RUN chown -R nginx:nginx /app/public

ENTRYPOINT ["/bin/sh", "-c"]

CMD ["nginx -g 'daemon off;'"]
