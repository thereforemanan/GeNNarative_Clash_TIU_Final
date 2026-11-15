import "./globals.css";

export const metadata = {
  title: "Bhasha Bloom — Regional Creators Suite",
  description: "Create regional content for Indian creators and local brands.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
