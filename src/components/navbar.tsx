"use client"
import styles from '@/styles/navbar.module.css'
import Image from 'next/image'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {

    const [imgHomeSrc, setImgHomeSrc] = useState('/assets/navbar/homeg.svg');
    const [imgMapSrc, setMapImgSrc] = useState('/assets/navbar/Map.svg');

    const pathname = usePathname();

    const changeImage = () => {
        if (pathname === '/home') {
            setImgHomeSrc('/assets/navbar/Home.svg')
        }
        if (pathname === '/map') {
            setMapImgSrc('/assets/navbar/Mapr.svg')
        }
    }

    return (
        <div className={`${styles.navbar} flex justify-between items-center shadow-md`}>
            <div>
                <ul className='flex items-center gap-6'>
                    <li>
                        <Link href={'http://localhost:3000'}>
                            <Image className='rounded-full'
                                src="/assets/navbar/logo-left-nav.svg"
                                width={90}
                                height={90}
                                alt="Picture of the author"
                            />
                        </Link>
                    </li>
                    <li>
                        <Link href={'/home'}>
                            <Image className=''
                                src={imgHomeSrc}
                                width={40}
                                height={40}
                                alt="Picture of the author"
                                onLoad={changeImage}
                            />
                        </Link>
                    </li>
                    <li>
                        <Link href={'/map'}>
                            <Image className=''
                                src={imgMapSrc}
                                width={40}
                                height={40}
                                alt="Picture of the author"
                                onLoad={changeImage}
                            />
                        </Link>
                    </li>
                </ul>
            </div>
            <div>
                <Link href={'#'}>
                    <Image
                        src="/assets/navbar/logo-latamly.png"
                        width={150}
                        height={150}
                        alt="Picture of the author"
                    />
                </Link>
            </div>
        </div >
    )
}






