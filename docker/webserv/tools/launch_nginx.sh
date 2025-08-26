#!/bin/sh

openssl req -newkey rsa:2048 -nodes -x509 -keyout /var/key.pem -out /var/cert.pem -batch

exec nginx -g "daemon off;"
