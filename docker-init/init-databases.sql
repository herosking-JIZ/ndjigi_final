-- Create keycloak_db database for Keycloak to use
CREATE DATABASE keycloak_db ENCODING 'UTF8' LOCALE 'en_US.UTF-8';

-- Grant privileges to ndjigi_user
GRANT ALL PRIVILEGES ON DATABASE keycloak_db TO ndjigi_user;
