import Header from "../components/Header.js";
import HeaderVisibilityController from "../components/HeaderVisibilityController.js";
import LoadingScreen from "../components/LoadingScreen.js";
import PlatformClass from "../components/PlatformClass.js";
import ViewportHeightLock from "../components/ViewportHeightLock.js";
import { archiveDetails } from "../data/archive.js";
import localFont from "next/font/local";
import "./globals.css";

const lugrasimo = localFont({
  src: "../assets/fonts/Lugrasimo.woff2",
  display: "swap",
  variable: "--font-lugrasimo",
});

const overlock = localFont({
  src: "../assets/fonts/OverlockSC.woff2",
  display: "swap",
  variable: "--font-overlock-sc",
});

export const metadata = {
  title: {
    default: archiveDetails.name,
    template: `%s | ${archiveDetails.name}`,
  },
  description: archiveDetails.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${lugrasimo.variable} ${overlock.variable}`}>
      <body>
        <LoadingScreen />
        <PlatformClass />
        <ViewportHeightLock />
        <Header />
        <HeaderVisibilityController />
        <main className="archive-shell">{children}</main>
      </body>
    </html>
  );
}
