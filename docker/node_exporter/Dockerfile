FROM alpine:3.21

RUN apk add wget tar
RUN cd /tmp && wget https://github.com/prometheus/node_exporter/releases/download/v1.9.1/node_exporter-1.9.1.linux-amd64.tar.gz && tar xvfz node_exporter-1.9.1.linux-amd64.tar.gz

COPY [ "docker/node_exporter/tools/launch_node_exporter.sh", "/tmp/launch.sh" ]
RUN chmod +x /tmp/launch.sh

ENTRYPOINT [ "/tmp/launch.sh" ]

CMD [ "./node_exporter", "--web.listen-address=0.0.0.0:3910" ]
