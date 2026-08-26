import Footer from "../components/Footer.js";
import Header from "../components/Header.js";
import { archiveDetails } from "../data/archive.js";
import "./globals.css";

export const metadata = {
  title: archiveDetails.name,
  description: archiveDetails.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="archive-background">
        <Header />
        <main className="archive-shell">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
