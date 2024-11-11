ARG SOLC_VER=0.8.28
FROM ethereum/solc:${SOLC_VER}-alpine as solc

FROM alpine:3.20.3

COPY --from=solc /usr/local/bin/solc /usr/local/bin/solc

COPY app /app
WORKDIR /app

RUN apk add --no-cache nodejs-lts npm && \
    npm i -g npm && \
    npm install && \
    apk del npm && \
    ln -s /contracts /app/contracts

# set default container entrypoint
ENTRYPOINT [ "node" ]
CMD [ "/app/index.js" ]