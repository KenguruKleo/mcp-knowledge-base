export interface Config {
  apiUrl: string;
  apiKey: string;
}

export function loadConfig(): Config {
  const apiUrl = process.env.MEMORY_API_URL;
  const apiKey = process.env.MEMORY_API_KEY;

  if (!apiUrl) {
    throw new Error(
      "MEMORY_API_URL environment variable is required. " +
      "Set it to your Firebase Cloud Functions base URL, e.g. https://us-central1-YOUR_PROJECT.cloudfunctions.net"
    );
  }

  if (!apiKey) {
    throw new Error(
      "MEMORY_API_KEY environment variable is required. " +
      "Generate one using the Firebase functions helper script."
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/+$/, ""),
    apiKey,
  };
}
