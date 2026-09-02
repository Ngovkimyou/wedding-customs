import Header from "../components/Header.js";
import HeaderVisibilityController from "../components/HeaderVisibilityController.js";
import PlatformClass from "../components/PlatformClass.js";
import ViewportHeightLock from "../components/ViewportHeightLock.js";
import { archiveDetails } from "../data/archive.js";
import "./globals.css";

export const metadata = {
  title: {
    default: archiveDetails.name,
    template: `%s | ${archiveDetails.name}`,
  },
  description: archiveDetails.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lugrasimo&family=Overlock+SC&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PlatformClass />
        <ViewportHeightLock />
        <Header />
        <HeaderVisibilityController />
        <main className="archive-shell">{children}</main>
      </body>
    </html>
  );
}
