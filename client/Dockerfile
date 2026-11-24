# Stage 0 - Build Angular app
FROM node:26-alpine as build-stage

WORKDIR /app

COPY ./package*.json /app/

RUN npm install

COPY . /app/

#ARG configuration=production
ARG BUILD_CONFIG=development

RUN echo "Building Address Book client image with configuration='${BUILD_CONFIG}'"
RUN npm run build -- --output-path=./dist/out --configuration $BUILD_CONFIG

# Stage 1 Load Angular files into Nginx server image
FROM nginx:1.31.9
COPY --from=build-stage /app/dist/out/browser/ /usr/share/nginx/html/addressbook
COPY --from=build-stage /app/nginx.conf /etc/nginx/conf.d/default.conf