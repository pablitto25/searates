import type { Metadata } from "next";
import Navbar from "@/components/navbar";


export const metadata: Metadata = {
  title: "Home - Container Traking - Latamly Group",
  description: "Web traqueador de contenedores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
