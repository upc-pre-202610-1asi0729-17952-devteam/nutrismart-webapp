FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG OWM_API_KEY
RUN sed -i "s|{OWM_API_KEY}|${OWM_API_KEY}|g" src/environments/environment.ts
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/nutrismart-webapp/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]