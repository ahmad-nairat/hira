FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
