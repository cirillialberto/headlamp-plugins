FROM alpine:3.20

WORKDIR /plugins/headlamp-olm

COPY dist/main.js .
COPY package.json .

CMD ["sh", "-c", "cp -r /plugins/* /target/"]
