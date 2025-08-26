FROM grafana/grafana:12.0.2-ubuntu

COPY [ "docker/grafana/config/datasrc_prometheus.yml", "/etc/grafana/provisioning/datasources/prometheus.yml" ]
COPY [ "docker/grafana/tools/launch_grafana.sh", "/tmp/launch_grafana.sh" ]
COPY [ "docker/grafana/config/dashboards", "/etc/grafana/provisioning/dashboards" ]

#RUN chmod +x /tmp/launch_grafana.sh # Operation not permitted (why ?)

ENTRYPOINT [ "/tmp/launch_grafana.sh" ]
