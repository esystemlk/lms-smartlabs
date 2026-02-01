"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { Download, Copy, Check } from "lucide-react";

interface QRCodeGeneratorProps {
    value: string;
    size?: number;
}

export function QRCodeGenerator({ value, size = 200 }: QRCodeGeneratorProps) {
    const [copied, setCopied] = useState(false);

    const downloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `qr-code-${Date.now()}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm max-w-sm mx-auto">
            <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-100">
                <QRCodeSVG
                    id="qr-code-svg"
                    value={value}
                    size={size}
                    level="H"
                    includeMargin
                    className="rounded-lg"
                />
            </div>

            <div className="w-full space-y-2 text-center">
                <p className="text-sm font-medium text-gray-500 break-all px-4">{value}</p>

                <div className="flex gap-2 justify-center mt-4">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check size={16} className="mr-2 text-green-500" /> : <Copy size={16} className="mr-2" />}
                        {copied ? "Copied" : "Copy Link"}
                    </Button>
                    <Button size="sm" onClick={downloadQR}>
                        <Download size={16} className="mr-2" />
                        Download
                    </Button>
                </div>
            </div>
        </div>
    );
}
