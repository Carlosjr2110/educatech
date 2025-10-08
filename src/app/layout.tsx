
import "./globals.css";
import { Providers } from "./providers";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";
import { ToastContainer } from "react-toastify";



export const metadata = {
  title: "Teach&Post",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <title>{metadata.title}</title>
      </head>
      <body className="antialiased flex flex-col min-h-screen bg-slate-100 dark:bg-slate-800 transition-colors duration-300">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            
            <main className="flex-grow">
              {children}
              <ToastContainer 
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
            </main>
            
            <Footer className="flex-shrink-0" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
