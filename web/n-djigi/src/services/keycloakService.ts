import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'ndjigi',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ndjigi-web',
})

export const initKeycloak = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    })
    return authenticated
  } catch (error) {
    console.error('Keycloak initialization failed:', error)
    return false
  }
}

export const login = async (): Promise<void> => {
  await keycloak.login()
}

export const logout = async (): Promise<void> => {
  await keycloak.logout()
}

export const getToken = (): string | undefined => {
  return keycloak.token
}

export const getTokenParsed = (): Keycloak.KeycloakTokenParsed | undefined => {
  return keycloak.tokenParsed
}

export const isTokenExpired = (): boolean => {
  return keycloak.isTokenExpired()
}

export const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshed = await keycloak.updateToken(70)
    return refreshed
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

export const hasRole = (role: string): boolean => {
  return keycloak.hasRealmRole(role)
}

export default keycloak
