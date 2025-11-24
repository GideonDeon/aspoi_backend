export const metadata = {
  title: "Aspoi Membership",
  description: "Next.js + Prisma + Paystack integration",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Global Header */}
        <header style={{ 
          backgroundColor: "#0d6efd", 
          color: "white", 
          padding: "1rem", 
          textAlign: "center" 
        }}>
          <h1>Aspoi Membership Portal</h1>
          <nav>
            <a href="/" style={{ margin: "0 1rem", color: "white" }}>Home</a>
            <a href="/register" style={{ margin: "0 1rem", color: "white" }}>Register</a>
            <a href="/confirmation" style={{ margin: "0 1rem", color: "white" }}>Confirmation</a>
          </nav>
        </header>

        {/* Page Content */}
        <main style={{ minHeight: "80vh", padding: "2rem" }}>
          {children}
        </main>

        {/* Global Footer */}
        <footer style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "1rem", 
          textAlign: "center", 
          borderTop: "1px solid #ddd" 
        }}>
          <p>© {new Date().getFullYear()} Aspoi. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
