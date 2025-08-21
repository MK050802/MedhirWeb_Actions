#Base
FROM node:alpine As Base

#Deps
FROM Base As Deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install

#Builder
FROM base As Builder
WORKDIR /app
COPY --from=Deps /app/node_modules ./node_modules
COPY . .
COPY .container/.env .env
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --omit=dev

#Runner
FROM Base As Runner
WORKDIR /app
ENV NODE_ENV=custom
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ARG APPLICATION_USER=nodejs
RUN adduser --no-create-home -u 1001 -D $APPLICATION_USER
RUN chown -R $APPLICATION_USER /app
USER $APPLICATION_USER

EXPOSE 3000
ENV PORT 3000

COPY .container/entrypoint.sh /usr/local/bin/entrypoint.sh

# Set the entrypoint to the newly added script.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]