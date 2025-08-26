FROM nginx/nginx-prometheus-exporter:1.4.2

CMD [ "--nginx.scrape-uri=http://frontend:3091/status/", "--web.listen-address=0.0.0.0:3914" ]
