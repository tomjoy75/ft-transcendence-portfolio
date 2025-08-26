FROM nginx/nginx-prometheus-exporter:1.4.2

CMD [ "--nginx.scrape-uri=http://webserv:3446/status/", "--web.listen-address=0.0.0.0:3913" ]
