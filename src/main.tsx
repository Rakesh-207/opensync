import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router-dom";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import App from "./App";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Handle redirect after OAuth callback
// Clear the URL and navigate to dashboard after auth completes
const onRedirectCallback = () => {
  // Clean up URL by removing auth params
  const cleanUrl = window.location.origin + "/";
  window.history.replaceState({}, document.title, cleanUrl);
};

function Root() {
  return (
    <AuthKitProvider
      clientId={import.meta.env.VITE_WORKOS_CLIENT_ID}
      redirectUri={import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/callback`}
      onRedirectCallback={onRedirectCallback}
      // Ensure session persists across refreshes
      devMode={import.meta.env.DEV}
    >
      <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
