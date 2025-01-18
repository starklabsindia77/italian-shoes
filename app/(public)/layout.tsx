import Header from "@/components/public/header";
import Footer from "@/components/public/footer";

export default function PublicLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
            {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
