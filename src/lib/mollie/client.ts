import { Client } from 'mollie-api-typescript';

// Check if we're in test mode - use explicit env var or check if API key starts with 'test_'
const isTestMode = () => {
  if (process.env.MOLLIE_TEST_MODE === 'true') return true;
  if (process.env.MOLLIE_TEST_MODE === 'false') return false;
  // Auto-detect based on API key prefix
  const apiKey = process.env.MOLLIE_API_KEY || '';
  return apiKey.startsWith('test_');
};

// Create Mollie client with API key (for platform operations)
export function createMollieClient() {
  const apiKey = process.env.MOLLIE_API_KEY;
  
  if (!apiKey) {
    throw new Error('MOLLIE_API_KEY is not configured');
  }

  const testmode = isTestMode();
  console.log(`Mollie client created with testmode: ${testmode}`);

  return new Client({
    security: {
      apiKey,
    },
    testmode,
  });
}

// Create Mollie client with OAuth token (for connected account operations)
export function createMollieClientWithToken(accessToken: string) {
  const testmode = isTestMode();
  return new Client({
    security: {
      oAuth: accessToken,
    },
    testmode,
  });
}

// Mollie OAuth URLs
export const MOLLIE_OAUTH_CONFIG = {
  clientId: process.env.MOLLIE_CLIENT_ID!,
  clientSecret: process.env.MOLLIE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://bookedwell.app'}/api/mollie/callback`,
  authorizeUrl: 'https://my.mollie.com/oauth2/authorize',
  tokenUrl: 'https://api.mollie.com/oauth2/tokens',
  scope: 'payments.read payments.write profiles.read organizations.read',
};

// Generate OAuth authorization URL
export function getMollieAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: MOLLIE_OAUTH_CONFIG.clientId,
    redirect_uri: MOLLIE_OAUTH_CONFIG.redirectUri,
    state,
    scope: MOLLIE_OAUTH_CONFIG.scope,
    response_type: 'code',
    approval_prompt: 'auto',
  });

  return `${MOLLIE_OAUTH_CONFIG.authorizeUrl}?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeMollieCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(MOLLIE_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: MOLLIE_OAUTH_CONFIG.redirectUri,
      client_id: MOLLIE_OAUTH_CONFIG.clientId,
      client_secret: MOLLIE_OAUTH_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mollie token exchange failed: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshMollieToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(MOLLIE_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: MOLLIE_OAUTH_CONFIG.clientId,
      client_secret: MOLLIE_OAUTH_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mollie token refresh failed: ${error}`);
  }

  return response.json();
}
