import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Comic_Neue } from "next/font/google";
import "./globals.css";
import FeedbackButton from "./FeedbackButton";
import { HouseholdThemeProvider } from "./HouseholdThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  weight: "700",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HouseKeeper",
    template: "%s · HouseKeeper",
  },
  description:
    "Share groceries, expenses, laundry, and dishes with your household.",
  applicationName: "HouseKeeper",
  appleWebApp: {
    capable: true,
    title: "HouseKeeper",
    // The page gradient runs edge to edge, so let it show behind the status bar.
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the layout paint into the notch/home indicator area; the safe-area
  // insets in globals.css keep content out of it.
  viewportFit: "cover",
  themeColor: "#14101F",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${comicNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HouseholdThemeProvider>
          {children}
          <FeedbackButton />
        </HouseholdThemeProvider>
      </body>
    </html>
  );
}
