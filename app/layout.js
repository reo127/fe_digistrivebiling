import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import { APP_CONFIG } from "@/config/appConfig";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: APP_CONFIG.appTitle,
  description: APP_CONFIG.appDescription,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
