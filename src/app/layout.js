import "./globals.css";
import Header from "../component/Header/Header";
import Footer from "../component/Footer/Footer";
import FloatingSocials from "../component/FloatingSocials/FloatingSocials";
import AuthProvider from "../providers/AuthProvider";

export const metadata = {
  title: "Gruta",
  description: "Onde o caos vira história e a zoeira é tradição.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Envelopando o site inteiro com o provedor de sessão */}
        <AuthProvider>
          
          <Header />
          
          {/* O 'children' é a página atual que o usuário clicou (Home, Calendário, etc) */}
          <main className="main-content">
            {children}
          </main>

          <Footer />
          <FloatingSocials />
          
        </AuthProvider>
      </body>
    </html>
  );
}