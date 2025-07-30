"use client"
import Styles from '@/styles/filterbar.module.css'
import Image from 'next/image';
import React from 'react';

export default function FilterBar() {
    const [selectedKeys, setSelectedKeys] = React.useState(new Set(["text"]));
    const selectedValue = React.useMemo(
        () => Array.from(selectedKeys).join(", ").replace(/_/g, ""),
        [selectedKeys],
    );

    return (
        <div className={`flex gap-8 container mx-auto ${Styles.filterMain}`}>
            {/* Buscar */}
            <div>
                <input className={Styles.inputs} type="text" name="search" placeholder='Buscar' />
            </div>
            {/* Estado */}
            <div>
                <select className={Styles.selectList}>
                    <option value="" hidden>Estado</option>
                    <option value="otherOption">Item 1</option>
                    <option value="otherOption">Item 2</option>
                    <option value="otherOption">Item 3</option>
                </select>
            </div>
            {/* Puerto Origen */}
            <div>
                <select className={Styles.selectList}>
                    <option value="" hidden>Puerto Origen</option>
                    <option value="otherOption">Item 1</option>
                    <option value="otherOption">Item 2</option>
                    <option value="otherOption">Item 3</option>
                </select>
            </div>
            {/* Puerto Destino */}
            <div>
                <select className={Styles.selectList}>
                    <option value="" hidden>Puerto Destino</option>
                    <option value="otherOption">Item 1</option>
                    <option value="otherOption">Item 2</option>
                    <option value="otherOption">Item 3</option>
                </select>
            </div>
            {/* Ordenar por */}
            <div>
                <select className={Styles.selectList}>
                    <option value="" hidden>Ordenar por</option>
                    <option value="otherOption">Item 1</option>
                    <option value="otherOption">Item 2</option>
                    <option value="otherOption">Item 3</option>
                </select>
            </div>
            <div>
                <Image className=''
                    src={'/assets/navbar/calendar.png'}
                    width={38}
                    height={38}
                    alt="Picture of the author"
                />
            </div>
        </div>
    )
}






