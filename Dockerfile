FROM node:22.23.4-slim
WORKDIR /app
COPY . /app
RUN npm ci --omit=dev && \
	mkdir /app/data
USER root
ENTRYPOINT ["npm", "start"]
