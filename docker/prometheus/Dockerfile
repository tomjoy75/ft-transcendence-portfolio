FROM prom/prometheus:v3.5.0-rc.0

COPY [ "docker/prometheus/config/prometheus.yml", "/etc/prometheus/prometheus.yml" ]
COPY [ "docker/prometheus/config/rules.yml", "/etc/prometheus/rules.yml" ]

CMD [ "--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.retention.time=15d", "--storage.tsdb.path=/prometheus", "--web.listen-address=0.0.0.0:3090" ]
