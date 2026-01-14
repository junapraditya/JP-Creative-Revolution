
import React from 'react';

const AIAnimation = () => {
    const points = [
        { cx: '15%', cy: '20%' }, { cx: '30%', cy: '10%' }, { cx: '50%', cy: '25%' },
        { cx: '70%', cy: '15%' }, { cx: '85%', cy: '22%' }, { cx: '10%', cy: '50%' },
        { cx: '25%', cy: '60%' }, { cx: '45%', cy: '55%' }, { cx: '65%', cy: '48%' },
        { cx: '80%', cy: '55%' }, { cx: '20%', cy: '85%' }, { cx: '40%', cy: '90%' },
        { cx: '60%', cy: '80%' }, { cx: '80%', cy: '90%' }
    ];

    const lines = [
        [0, 5], [1, 2], [2, 3], [3, 4], [2, 8], [5, 6], [6, 7], [7, 8], [8, 9],
        [5, 10], [6, 10], [7, 11], [8, 12], [9, 13], [10, 11], [11, 12], [12, 13]
    ];
    
    return (
        <div className="absolute inset-0 z-0 opacity-30" aria-hidden="true">
            <svg width="100%" height="100%">
                <defs>
                    <radialGradient id="node-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 0.8 }} />
                        <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 0 }} />
                    </radialGradient>
                </defs>
                {lines.map(([start, end], i) => (
                    <line
                        key={`line-${i}`}
                        x1={points[start].cx}
                        y1={points[start].cy}
                        x2={points[end].cx}
                        y2={points[end].cy}
                        stroke="#f97316"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                    />
                ))}
                {points.map((point, i) => (
                    <g key={`point-${i}`}>
                        <circle
                            cx={point.cx}
                            cy={point.cy}
                            r="4"
                            fill="#ea580c"
                            className="animate-pulse-slow"
                            style={{ animationDelay: `${(i * 150)}ms` }}
                        />
                         <circle
                            cx={point.cx}
                            cy={point.cy}
                            r="15"
                            fill="url(#node-glow)"
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
};


const InstructionStep: React.FC<{ number: number; title: string; description: string; className: string }> = ({ number, title, description, className }) => (
    <div className={`flex items-start ${className}`}>
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-orange-600 text-white font-bold rounded-full border border-orange-500 shadow-sm">
            {number}
        </div>
        <div className="ml-4">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
        </div>
    </div>
);

export const Welcome: React.FC = () => {
    return (
        <div className="relative bg-[#0a0a0a] p-10 rounded-2xl shadow-2xl border border-neutral-800 animate-fade-in-scale overflow-hidden">
            <AIAnimation />
            <div className="relative z-10">
                <header className="text-center mb-12">
                    <div className="inline-block p-2 px-4 bg-orange-600/10 border border-orange-600/20 rounded-full text-orange-500 text-xs font-black uppercase tracking-widest mb-4">
                        JP Creative Revolution
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter animate-fade-in">
                        Welcome to <span className="text-orange-600">JP SuperApp</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-400 font-medium animate-fade-in animate-delay-100 max-w-2xl mx-auto">
                        Alat kreatif berbasis AI tercanggih untuk para profesional. Mulailah transformasi digital Anda sekarang.
                    </p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-neutral-900/40 p-10 rounded-2xl border border-neutral-800 backdrop-blur-md">
                    <div className="space-y-8">
                         <h2 className="text-2xl font-black text-white mb-2 animate-fade-in animate-delay-200">How to Use</h2>
                        <InstructionStep
                            number={1}
                            title="Pilih Fitur"
                            description="Pilih salah satu fitur canggih yang tersedia di sidebar Master Console."
                            className="animate-fade-in animate-delay-300"
                        />
                        <InstructionStep
                            number={2}
                            title="Unggah Aset"
                            description="Klik area unggah untuk memasukkan gambar dari perangkat Anda."
                            className="animate-fade-in animate-delay-400"
                        />
                    </div>
                    <div className="space-y-8 pt-0 md:pt-12">
                        <InstructionStep
                            number={3}
                            title="Atur & Generate"
                            description="Isi deskripsi atau pilih opsi yang diperlukan, lalu klik tombol 'Buat'."
                            className="animate-fade-in animate-delay-500"
                        />
                        <InstructionStep
                            number={4}
                            title="Simpan Hasil"
                            description="Gambar hasil akan muncul secara instan. Klik tombol unduh untuk menyimpan."
                            className="animate-fade-in animate-delay-600"
                        />
                    </div>
                </div>
                
                <div className="mt-12 text-center opacity-40">
                   <p className="text-xs font-bold text-gray-500 tracking-[0.5em] uppercase">Powered by JP Intelligence Engine</p>
                </div>
            </div>
        </div>
    );
};
