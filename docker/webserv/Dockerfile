FROM nginx:1.28-alpine3.21

RUN apk add openssl

COPY [ "webserv/nginx.conf", "/etc/nginx/nginx.conf" ]
COPY [ "docker/webserv/tools/launch_nginx.sh", "/tmp/launch_nginx.sh" ]

RUN chmod 755 /tmp/launch_nginx.sh

ENTRYPOINT [ "/tmp/launch_nginx.sh" ]
#CMD [ "nginx", "-g", "daemon off;" ]
