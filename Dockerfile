FROM cae-artifactory.jpl.nasa.gov:17001/node:22.23.2
WORKDIR /app
COPY . /app
RUN npm ci --omit=dev && \
	mkdir /app/data
USER root
ENTRYPOINT ["npm", "start"]
