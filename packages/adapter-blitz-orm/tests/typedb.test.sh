#!/usr/bin/env bash

CONTAINER_NAME=next-auth-borm-typedb-test

JEST_WATCH=true

# Is the watch flag passed to the script?
while getopts w flag
do
    case "${flag}" in
        w) JEST_WATCH=true;;
        *) continue;;
    esac
done

echo "Starting TypeDB container..."
docker run -d --rm -p 1729:1729 --name ${CONTAINER_NAME} vaticle/typedb:latest > /dev/null
sleep 3
echo "Constructing db..."
docker cp ../borm/schema.tql ${CONTAINER_NAME}:/schema.tql
cat ./typedb/console_cmd.txt | docker exec -i $CONTAINER_NAME ./typedb console 1>/dev/null 2>/dev/null

if $JEST_WATCH; then
    # Run jest in watch mode
    npx jest tests --watch
    # Only stop the container after jest has been quit
    docker stop "${CONTAINER_NAME}"
else
    # Always stop container, but exit with 1 when tests are failing
    if npx jest;then
        docker stop ${CONTAINER_NAME}
    else
        docker stop ${CONTAINER_NAME} && exit 1
    fi
fi