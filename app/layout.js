import Header from "../components/Header.js";
import HeaderVisibilityController from "../components/HeaderVisibilityController.js";
import ArchiveRoutePrefetcher from "../components/ArchiveRoutePrefetcher.js";
import LoadingScreen from "../components/LoadingScreen.js";
import RouteTransition from "../components/RouteTransition.js";
import PlatformClass from "../components/PlatformClass.js";
import ViewportHeightLock from "../components/ViewportHeightLock.js";
import { archiveDetails, archiveSlugs } from "../data/archive.js";
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

const khmerTitle = localFont({
  src: "../assets/fonts/Khmer-title.woff2",
  display: "swap",
  variable: "--font-khmer-title",
});

const khmerScript = localFont({
  src: "../assets/fonts/Khmer-script.woff2",
  display: "swap",
  variable: "--font-khmer-script",
  preload: false,
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
    <html
      lang="en"
      className={`${lugrasimo.variable} ${overlock.variable} ${khmerTitle.variable} ${khmerScript.variable}`}
    >
      <body>
        <LoadingScreen />
        <ArchiveRoutePrefetcher slugs={archiveSlugs} />
        <RouteTransition />
        <PlatformClass />
        <ViewportHeightLock />
        <Header />
        <HeaderVisibilityController />
        <main className="archive-shell">{children}</main>
      </body>
    </html>
  );
}
