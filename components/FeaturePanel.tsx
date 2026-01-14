
import React, { useState, useCallback, useId, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Feature } from '../types';

interface FeaturePanelProps {
  feature: Feature;
}

interface ImageUploaderProps {
    onImageUpload: (files: File[], base64s: string[]) => void;
    uploadedImages: string[];
    multiple?: boolean;
    label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImages, multiple = false, label }) => {
    const id = useId();
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const fileList = Array.from(files);
            const filePromises = fileList.map((file: File) => {
                return new Promise<{ file: File, base64: string }>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                            resolve({ file, base64: reader.result.split(',')[1] });
                        } else {
                            reject(new Error("Failed to read file as a data URL."));
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(filePromises).then((results: { file: File; base64: string }[]) => {
                const files = results.map(r => r.file);
                const base64s = results.map(r => r.base64);
                onImageUpload(files, base64s);
            }).catch(error => {
                console.error("Error reading files:", error);
            });
        }
    };

    return (
        <div className="w-full">
            {label && <h3 className="text-lg font-bold text-gray-800 mb-3">{label}</h3>}
            <label htmlFor={id} className="cursor-pointer">
                <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${uploadedImages.length > 0 ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-500 bg-gray-50 hover:bg-orange-50/30'}`}>
                    {uploadedImages.length > 0 ? (
                         <div className={`flex flex-wrap justify-center gap-4 ${uploadedImages.length > 1 ? 'max-h-64 overflow-y-auto' : ''}`}>
                            {uploadedImages.map((imageSrc, index) => (
                                <img key={index} src={imageSrc} alt={`Pratinjau Unggahan ${index + 1}`} className="max-h-40 h-auto rounded-xl object-contain shadow-md" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                           <svg className="w-12 h-12 mb-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                           <p className="font-bold text-gray-600">Klik untuk mengunggah atau seret dan lepas</p>
                           <p className="text-xs mt-1">Format: PNG, JPG, WEBP</p>
                        </div>
                    )}
                </div>
            </label>
            <input id={id} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" multiple={multiple} />
        </div>
    );
};

interface ImageEditorCanvasProps {
    imageSrc: string;
    brushSize: number;
    onMaskChange?: (isMaskEmpty: boolean) => void;
}

const ImageEditorCanvas = React.memo(React.forwardRef<
    { getMaskAsBase64: () => string | null; clearMask: () => void },
    ImageEditorCanvasProps
>(({ imageSrc, brushSize, onMaskChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawing = useRef(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const drawnPaths = useRef<[number, number][]>([]);

    useEffect(() => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const aspectRatio = image.width / image.height;
                const maxWidth = canvas.parentElement?.clientWidth || 500;
                canvas.width = Math.min(image.width, maxWidth);
                canvas.height = canvas.width / aspectRatio;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    contextRef.current = ctx;
                }
            }
            imageRef.current = image;
        };
    }, [imageSrc]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent): [number, number] | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return [clientX - rect.left, clientY - rect.top];
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const coords = getCoords(e);
        if (!coords) return;
        isDrawing.current = true;
        const ctx = contextRef.current;
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(coords[0], coords[1]);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        e.preventDefault();
        const coords = getCoords(e);
        if (!coords) return;
        const ctx = contextRef.current;
        if (ctx) {
            ctx.lineTo(coords[0], coords[1]);
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            drawnPaths.current.push(coords);
        }
    };

    const stopDrawing = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        const ctx = contextRef.current;
        if (ctx) {
            ctx.closePath();
        }
        onMaskChange?.(drawnPaths.current.length === 0);
    };

    React.useImperativeHandle(ref, () => ({
        getMaskAsBase64: () => {
            if (drawnPaths.current.length === 0) return null;
            
            const canvas = canvasRef.current;
            const image = imageRef.current;
            if (!canvas || !image) return null;

            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = image.width;
            maskCanvas.height = image.height;
            const maskCtx = maskCanvas.getContext('2d');

            if (!maskCtx) return null;

            maskCtx.fillStyle = '#000';
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
            
            maskCtx.strokeStyle = '#FFF';
            maskCtx.fillStyle = '#FFF';

            const scaleX = image.width / canvas.width;
            const scaleY = image.height / canvas.height;
            
            const path = new Path2D();
            if (drawnPaths.current.length > 0) {
                path.moveTo(drawnPaths.current[0][0] * scaleX, drawnPaths.current[0][1] * scaleY);
                for (let i = 1; i < drawnPaths.current.length; i++) {
                    path.lineTo(drawnPaths.current[i][0] * scaleX, drawnPaths.current[i][1] * scaleY);
                }
            }
            maskCtx.lineWidth = brushSize * scaleX;
            maskCtx.lineCap = 'round';
            maskCtx.lineJoin = 'round';
            maskCtx.stroke(path);

            return maskCanvas.toDataURL('image/png').split(',')[1];
        },
        clearMask: () => {
            const canvas = canvasRef.current;
            const image = imageRef.current;
            if (canvas && image && contextRef.current) {
                drawnPaths.current = [];
                contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
                contextRef.current.drawImage(image, 0, 0, canvas.width, canvas.height);
                onMaskChange?.(true);
            }
        },
    }));

    return (
        <canvas
            ref={canvasRef}
            className="rounded-xl border border-gray-300 w-full shadow-inner cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
}));

export const FeaturePanel: React.FC<FeaturePanelProps> = ({ feature }) => {
  const [prompt, setPrompt] = useState('');
  const [theme, setTheme] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageBases64, setImageBases64] = useState<string[]>([]);
  const [referenceImageFiles, setReferenceImageFiles] = useState<File[]>([]);
  const [referenceImageBases64, setReferenceImageBases64] = useState<string[]>([]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [isMaskEmpty, setIsMaskEmpty] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const canvasRef = useRef<{ getMaskAsBase64: () => string | null; clearMask: () => void; }>(null);
  
  const handleImageUpload = (files: File[], base64s: string[]) => {
      setImageFiles(files);
      setImageBases64(base64s);
      setResultImage(null);
      setError(null);
      if (canvasRef.current) canvasRef.current.clearMask();
  };
  
  const handleAdditionalImagesUpload = (files: File[], base64s: string[]) => {
      setReferenceImageFiles(files);
      setReferenceImageBases64(base64s);
      setResultImage(null);
  };
  
  const handleReferenceImageUpload = (files: File[], base64s: string[]) => {
      if (files.length > 0) {
        setReferenceImageFiles([files[0]]);
        setReferenceImageBases64([base64s[0]]);
      } else {
        setReferenceImageFiles([]);
        setReferenceImageBases64([]);
      }
      setResultImage(null);
  };

  const handleError = (e: unknown) => {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("429") || msg.toLowerCase().includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
          setError("Quota API JP terlampaui. Silakan tunggu beberapa saat atau hubungi administrator JP Creative Revolution.");
      } else {
          setError(msg || 'Terjadi kesalahan sistem. Silakan coba lagi.');
      }
  };

  const enhancePrompt = useCallback(async () => {
    if (!prompt) {
        setError('Silakan masukkan prompt awal terlebih dahulu.');
        return;
    }
    setEnhancing(true);
    setError(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Tingkatkan prompt pembuatan gambar ini agar lebih profesional, sinematik, dan mendalam. Fokus pada pencahayaan, tekstur, dan komposisi. Berikan hanya prompt akhir tanpa penjelasan. Prompt: "${prompt}"`,
        });
        setPrompt(response.text || prompt);
    } catch (e: unknown) {
        handleError(e);
    } finally {
        setEnhancing(false);
    }
}, [prompt]);

  const generateImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        let parts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [];
        let generationPrompt = '';
        let modelToUse = 'gemini-2.5-flash-image';

        if (feature.id === 'image-generator') {
            if (!prompt) throw new Error('Silakan masukkan prompt.');
            generationPrompt = `Generate a cinematic, professional masterwork. Subject: ${prompt}. Aspect ratio: ${aspectRatio}. Style: High-end photography.`;
            parts.push({ text: generationPrompt });
        } else {
            if (imageBases64.length === 0 || imageFiles.length === 0) {
                setError('Silakan unggah gambar utama terlebih dahulu.');
                return;
            }

            parts.push({
                inlineData: {
                    data: imageBases64[0],
                    mimeType: imageFiles[0].type,
                },
            });

            if (feature.id === 'try-on') {
                if (referenceImageBases64.length === 0 || referenceImageFiles.length === 0) throw new Error('Silakan unggah foto produk.');
                parts.push({ inlineData: { data: referenceImageBases64[0], mimeType: referenceImageFiles[0].type } });
                generationPrompt = 'JP Virtual Try-On Engine: Seamlessly blend the clothing from second image onto the person in first image. Maintain lighting and identity. Output ONLY image.';
            } else if (feature.id === 'photo-fusion') {
                if (referenceImageBases64.length === 0) throw new Error('Silakan unggah aset tambahan.');
                if (!prompt) throw new Error('Silakan masukkan deskripsi adegan.');
                for(let i = 0; i < referenceImageBases64.length; i++) {
                    parts.push({ inlineData: { data: referenceImageBases64[i], mimeType: referenceImageFiles[i].type } });
                }
                generationPrompt = `JP Fusion Engine: Combine all subjects into a cohesive scene. Theme: ${prompt}. Realism is priority. Output ONLY image.`;
            } else if (feature.id === 'editor') {
                const maskBase64 = canvasRef.current?.getMaskAsBase64();
                if (!maskBase64) throw new Error('Tandai area editan.');
                parts.push({ inlineData: { data: maskBase64, mimeType: 'image/png' } });
                generationPrompt = `JP Edit Engine: Modify area in mask according to: "${prompt}". Output ONLY image.`;
            } else {
                generationPrompt = `JP Intelligence Engine. Action: ${feature.name}. Details: ${prompt}. Realism: Maximum. Output ONLY image.`;
            }
            parts.push({ text: generationPrompt });
        }

        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: { parts },
          config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            imageConfig: feature.id === 'image-generator' ? { aspectRatio } : undefined
          },
        });
        
        const candidate = response.candidates?.[0];
        let foundImage = false;
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    setResultImage(imageUrl);
                    foundImage = true;
                    break;
                }
            }
        }

        if (!foundImage) {
            throw new Error(response.text?.trim() || "API tidak mengembalikan gambar.");
        }
    } catch (e: unknown) {
        handleError(e);
    } finally {
        setLoading(false);
    }
  }, [imageBases64, imageFiles, prompt, feature.id, referenceImageBases64, referenceImageFiles, theme, aspectRatio]);
  
  const mainImageObjectUrl = useMemo(() => {
    if (imageFiles.length > 0) return URL.createObjectURL(imageFiles[0]);
    return '';
  }, [imageFiles]);

  useEffect(() => {
    if (mainImageObjectUrl) return () => URL.revokeObjectURL(mainImageObjectUrl);
  }, [mainImageObjectUrl]);

    const isGenerateDisabled = loading || enhancing || (feature.id === 'image-generator' ? !prompt : imageBases64.length === 0);

  const aspectRatioOptions = ["1:1", "4:3", "3:4", "16:9", "9:16"];

  return (
    <div className="space-y-10 animate-fade-in-scale">
      <div className="border-b border-gray-200 pb-6 flex justify-between items-end">
        <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{feature.name}</h2>
            <p className="mt-2 text-gray-500 font-medium">{feature.description}</p>
        </div>
        <div className="hidden sm:block text-orange-600 font-black text-sm tracking-widest uppercase opacity-20">JP ENGINE V3.0</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Inputs */}
          <div className="space-y-8">
              {feature.id === 'image-generator' ? (
                  <>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">1. Konsep Visual</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Jelaskan mahakarya yang ingin Anda buat..."
                            className="w-full h-44 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-700 bg-white shadow-sm"
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">2. Rasio Bidik</h3>
                        <div className="flex flex-wrap gap-3">
                            {aspectRatioOptions.map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`px-6 py-2.5 text-sm font-black rounded-xl transition-all ${
                                        aspectRatio === ratio
                                            ? 'bg-orange-600 text-white shadow-orange-100 shadow-lg scale-105'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                  </>
              ) : (
                  <>
                    <ImageUploader 
                        onImageUpload={handleImageUpload} 
                        uploadedImages={imageFiles.map(f => URL.createObjectURL(f))} 
                        label="1. Unggah Subjek Utama"
                    />
                    {feature.id === 'editor' && imageBases64.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-gray-800">2. Area Modifikasi</h3>
                            <ImageEditorCanvas ref={canvasRef} imageSrc={mainImageObjectUrl} brushSize={brushSize} onMaskChange={setIsMaskEmpty} />
                            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex-1 flex flex-col gap-2">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Ukuran Kuas</span>
                                    <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full accent-orange-600" />
                                </div>
                                <button onClick={() => canvasRef.current?.clearMask()} className="text-sm font-bold text-orange-600 hover:text-orange-700 underline">Reset Mask</button>
                            </div>
                        </div>
                    )}
                    {['try-on', 'pose-ref', 'photo-fusion'].includes(feature.id) && (
                        <ImageUploader 
                            onImageUpload={handleAdditionalImagesUpload} 
                            uploadedImages={referenceImageFiles.map(f => URL.createObjectURL(f))}
                            multiple={feature.id === 'photo-fusion'}
                            label="2. Unggah Aset Referensi"
                        />
                    )}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">Deskripsi Instruksi</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Apa yang harus AI lakukan dengan gambar Anda?"
                            className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-700 bg-white shadow-sm"
                        />
                    </div>
                  </>
              )}
          </div>

          {/* Right Column: Actions & Results */}
          <div className="space-y-8">
                <div className="flex flex-col gap-4">
                    {feature.id === 'image-generator' && (
                        <button
                            onClick={enhancePrompt}
                            disabled={loading || enhancing || !prompt}
                            className="flex justify-center items-center px-6 py-4 border-2 border-orange-600 text-sm font-black rounded-2xl text-orange-600 bg-white hover:bg-orange-50 transition-all disabled:opacity-30 uppercase tracking-widest"
                        >
                            {enhancing ? 'Optimizing Engine...' : 'Sempurnakan Prompt JP'}
                        </button>
                    )}
                    <button
                        onClick={generateImage}
                        disabled={isGenerateDisabled}
                        className="w-full flex justify-center items-center px-8 py-5 border border-transparent text-lg font-black rounded-2xl shadow-xl text-white bg-orange-600 hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:shadow-none uppercase tracking-widest"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Memproses JP Engine...
                            </div>
                        ) : 'Eksekusi Sekarang'}
                    </button>
                </div>

                {error && <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl font-bold text-sm animate-fade-in">{error}</div>}

                <div className="relative group">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Hasil Generasi</h3>
                    <div className="w-full aspect-square md:aspect-auto md:min-h-[400px] bg-neutral-900 border-2 border-neutral-800 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 border-4 border-orange-600/30 border-t-orange-600 rounded-full animate-spin"></div>
                                <span className="text-orange-500 font-black text-xs uppercase tracking-widest animate-pulse">Processing Masterpiece</span>
                            </div>
                        ) : resultImage ? (
                            <div className="relative w-full h-full flex flex-col items-center p-4">
                                <img src={resultImage} alt="JP AI Result" className="max-h-full rounded-2xl shadow-lg object-contain" />
                                <div className="mt-6">
                                    <a href={resultImage} download={`jp-creative-${feature.id}.png`} className="flex items-center gap-2 px-8 py-3 bg-white text-gray-900 font-black rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-xl uppercase text-xs tracking-widest">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        Download Aset
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-12">
                                <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Aset Belum Tersedia</p>
                            </div>
                        )}
                    </div>
                </div>
          </div>
      </div>
    </div>
  );
};
