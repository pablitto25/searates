import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <div className="relative w-full h-screen">
      <Link href={'/home'}>
        <Image
          src="/assets/background-home.png"
          alt="Picture of the author"
          fill
          className="object-cover"
          priority
        />
      </Link>
    </div>
  );
}
