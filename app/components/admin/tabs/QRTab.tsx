'use client'

import React, { useRef, useState } from 'react'
import QRCode from "react-qr-code";
import { Download, ExternalLink, Printer } from 'lucide-react'

type QRTabProps = {
    restaurant: any
}

export default function QRTab({ restaurant }: QRTabProps) {
    const svgRef = useRef<any>(null);
    const [tableNumber, setTableNumber] = useState('');

    // Base URL
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/${restaurant.slug}` : `https://1111-menu.vercel.app/${restaurant.slug}`;

    // Append table param if exists
    const publicUrl = tableNumber ? `${baseUrl}?table=${tableNumber}` : baseUrl;

    // Function to download SVG as PNG
    const downloadQRCode = () => {
        const svg = svgRef.current;
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width + 100; // Add padding
            canvas.height = img.height + 150; // Add padding for text

            if (ctx) {
                // Background
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR
                ctx.drawImage(img, 50, 50);

                // Draw Text
                ctx.font = "bold 30px sans-serif";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.fillText(restaurant.name.toUpperCase(), canvas.width / 2, canvas.height - 60);

                ctx.font = "20px sans-serif";
                ctx.fillStyle = "#666";
                const label = tableNumber ? `Mesa ${tableNumber}` : "Escanea para ver el menú";
                ctx.fillText(label, canvas.width / 2, canvas.height - 30);

                // Download
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `${restaurant.slug}-qr${tableNumber ? `-mesa-${tableNumber}` : ''}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="space-y-6">
            <div className="bg-neutral-900 border border-white/5 p-8 rounded-2xl flex flex-col md:flex-row gap-12 items-center justify-center">

                {/* QR Display */}
                <div className="bg-white p-6 rounded-xl shadow-2xl relative">
                    {tableNumber && (
                        <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded">
                            MESA {tableNumber}
                        </div>
                    )}
                    <QRCode
                        id="qr-code-svg"
                        value={publicUrl}
                        size={256}
                        level="H"
                        ref={svgRef as any}
                    />
                </div>

                {/* Controls */}
                <div className="space-y-4 max-w-sm text-center md:text-left w-full">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Código QR Digital</h3>
                        <p className="text-neutral-400 text-sm">
                            Este código dirige directamente a tu menú digital. Imprímelo para colocar en mesas, caja o tarjetas de presentación.
                        </p>
                    </div>

                    {/* Table Input */}
                    <div className="bg-neutral-800/50 p-4 rounded-lg border border-white/5">
                        <label className="block text-xs uppercase text-neutral-500 mb-1 font-bold">Número de Mesa (Opcional)</label>
                        <input
                            type="text"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder="Ej: 5 (Dejar vacío para genérico)"
                            className="w-full bg-black border border-neutral-700 rounded p-2 text-white/90 focus:border-amber-500 outline-none text-sm"
                        />
                        <p className="text-[10px] text-neutral-500 mt-2">
                            Si ingresas un número, el cliente será asignado a esa mesa automáticamente al escanear.
                        </p>
                    </div>

                    <div className="pt-2 space-y-3">
                        <button
                            onClick={downloadQRCode}
                            className="w-full bg-amber-500 text-black font-bold py-3 px-6 rounded-lg hover:bg-amber-400 transition flex items-center justify-center gap-2"
                        >
                            <Download size={20} />
                            Descargar PNG
                        </button>

                        <div className="flex gap-2">
                            <a
                                href={publicUrl}
                                target="_blank"
                                className="flex-1 bg-neutral-800 text-neutral-300 py-3 px-6 rounded-lg hover:bg-neutral-700 transition flex items-center justify-center gap-2 text-sm font-medium border border-white/5"
                            >
                                <ExternalLink size={16} />
                                Probar Link
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
