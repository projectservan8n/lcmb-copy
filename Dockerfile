# Dockerfile for n8n deployment on Railway
FROM n8nio/n8n:latest

# Set environment variables
ENV N8N_BASIC_AUTH_ACTIVE=true
ENV N8N_BASIC_AUTH_USER=admin
ENV N8N_BASIC_AUTH_PASSWORD=your_secure_password_here

# For webhook access
ENV WEBHOOK_URL=https://your-app-name.railway.app

# Database settings (Railway will provide PostgreSQL)
ENV DB_TYPE=postgresdb
ENV DB_POSTGRESDB_HOST=${{Postgres.PGHOST}}
ENV DB_POSTGRESDB_PORT=${{Postgres.PGPORT}}
ENV DB_POSTGRESDB_DATABASE=${{Postgres.PGDATABASE}}
ENV DB_POSTGRESDB_USER=${{Postgres.PGUSER}}
ENV DB_POSTGRESDB_PASSWORD=${{Postgres.PGPASSWORD}}

# Timezone
ENV GENERIC_TIMEZONE=Australia/Brisbane

# Security
ENV N8N_SECURE_COOKIE=true
ENV N8N_PROTOCOL=https

# Create workflows directory
USER root
RUN mkdir -p /home/node/.n8n/workflows
COPY workflows/ /home/node/.n8n/workflows/
RUN chown -R node:node /home/node/.n8n

USER node

EXPOSE 5678

CMD ["n8n"]
