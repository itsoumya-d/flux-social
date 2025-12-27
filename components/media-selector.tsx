'use client';

import React, { useState, useEffect } from 'react';
import {
    Upload,
    Image as ImageIcon,
    Search,
    Sparkles,
    X,
    Loader2,
    Plus,
    CheckCircle2,
    Monitor
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { uploadMedia, getAssetLibrary, searchUnsplash } from '@/app/actions/media';
import { generateAIImage, generateNanoBananaImage } from '@/app/actions/ai';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MediaSelectorProps {
    brandId: string;
    onSelect: (urls: string[]) => void;
    maxFiles?: number;
}

export function MediaSelector({ brandId, onSelect, maxFiles = 4 }: MediaSelectorProps) {
    const [assets, setAssets] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [activeTab, setActiveTab] = useState('upload');
    const [isUploading, setIsUploading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
    const [imageQuality, setImageQuality] = useState<'Standard' | '2K' | '4K'>('Standard');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5'>('1:1');

    useEffect(() => {
        loadLibrary();
    }, [brandId]);

    const loadLibrary = async () => {
        const data = await getAssetLibrary(brandId);
        setAssets(data);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', brandId);

        try {
            const { url, asset } = await uploadMedia(formData);
            setAssets(prev => [asset, ...prev]);
            setSelectedUrls(prev => [...prev.slice(0, maxFiles - 1), url]);
            toast.success('Media uploaded successfully!');
        } catch (error) {
            toast.error('Failed to upload media');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchUnsplash(searchQuery);
            setSearchResults(results);
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            let result;
            if (imageQuality === 'Standard') {
                result = await generateAIImage({
                    prompt: aiPrompt,
                    platform: 'instagram',
                });
            } else {
                result = await generateNanoBananaImage({
                    prompt: aiPrompt,
                    platform: 'instagram',
                    quality: imageQuality as '2K' | '4K',
                    aspectRatio: aspectRatio
                });
            }

            if (result.success && result.imageUrl) {
                const url = result.imageUrl as string;
                setSelectedUrls(prev => [...prev.slice(0, maxFiles - 1), url]);
                toast.success(`${imageQuality === 'Standard' ? 'AI Image' : 'NanoBanana ' + imageQuality + ' Asset'} generated! ✨`);
            } else {
                toast.error(result.error || 'Generation failed');
            }
        } catch (error) {
            toast.error('AI generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleSelection = (url: string) => {
        setSelectedUrls(prev => {
            if (prev.includes(url)) return prev.filter(u => u !== url);
            if (prev.length >= maxFiles) {
                toast.warning(`Maximum ${maxFiles} files allowed`);
                return prev;
            }
            return [...prev, url];
        });
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-indigo-400" />
                    Media Command Center
                </h3>
                <div className="flex items-center gap-2">
                    <div className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded-full border border-zinc-800">
                        {selectedUrls.length} / {maxFiles} selected
                    </div>
                    {selectedUrls.length > 0 && (
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => onSelect(selectedUrls)}
                            className="bg-indigo-600 hover:bg-indigo-500 h-8 px-4"
                        >
                            Attach Media
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 py-2 bg-zinc-900/50">
                    <TabsList className="bg-zinc-950/50 border border-zinc-800 h-10 p-0.5">
                        <TabsTrigger value="upload" className="data-[state=active]:bg-zinc-800 text-xs gap-1.5 px-3">
                            <Upload className="h-3.5 w-3.5" /> Upload
                        </TabsTrigger>
                        <TabsTrigger value="library" className="data-[state=active]:bg-zinc-800 text-xs gap-1.5 px-3">
                            <Monitor className="h-3.5 w-3.5" /> Library
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="data-[state=active]:bg-zinc-800 text-xs gap-1.5 px-3">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Create
                        </TabsTrigger>
                        <TabsTrigger value="search" className="data-[state=active]:bg-zinc-800 text-xs gap-1.5 px-3">
                            <Search className="h-3.5 w-3.5" /> Search
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <TabsContent value="upload" className="m-0 h-full">
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl p-8 hover:border-zinc-700 transition-colors group">
                            <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-indigo-500" /> : <Upload className="h-8 w-8 text-zinc-500" />}
                            </div>
                            <h4 className="font-medium text-zinc-300">Drag and drop or click to upload</h4>
                            <p className="text-zinc-500 text-sm mt-1">Supports JPG, PNG, GIF, MP4</p>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="library" className="m-0 h-full">
                        {assets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                                <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                                <p>No assets in your library yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {assets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className={cn(
                                            "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer group transition-all",
                                            selectedUrls.includes(asset.file_url) ? "border-indigo-500" : "border-transparent"
                                        )}
                                        onClick={() => toggleSelection(asset.file_url)}
                                    >
                                        <img src={asset.file_url} className="h-full w-full object-cover" alt="" />
                                        <div className={cn(
                                            "absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                                            selectedUrls.includes(asset.file_url) && "opacity-100"
                                        )}>
                                            {selectedUrls.includes(asset.file_url) ? (
                                                <CheckCircle2 className="h-8 w-8 text-white drop-shadow-lg" />
                                            ) : (
                                                <Plus className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="ai" className="m-0 h-full flex flex-col gap-4">
                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">NanoBanana Pro AI</span>
                                </div>
                                <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                                    {['Standard', '2K', '4K'].map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => setImageQuality(q as any)}
                                            className={cn(
                                                "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                                                imageQuality === q ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                            )}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Visual Prompt</label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="A professional minimalist workspace with soft morning light, 8k..."
                                    className="w-full h-20 bg-black/40 border-zinc-800 rounded-lg text-sm p-3 focus:ring-indigo-500/50 resize-none"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Aspect Ratio</label>
                                    <div className="flex gap-2">
                                        {['1:1', '16:9', '9:16', '4:5'].map((ratio) => (
                                            <button
                                                key={ratio}
                                                onClick={() => setAspectRatio(ratio as any)}
                                                className={cn(
                                                    "flex-1 py-1 text-[10px] font-bold rounded-md border transition-all",
                                                    aspectRatio === ratio ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                                )}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/10"
                                disabled={isGenerating || !aiPrompt.trim()}
                                onClick={handleGenerateAI}
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                {imageQuality === 'Standard' ? 'Generate Standard' : `Generate ${imageQuality} Asset`}
                            </Button>
                        </div>
                        <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 p-8 text-center">
                            <div className="max-w-[200px] flex flex-col items-center gap-2">
                                <Monitor className="h-8 w-8 opacity-20" />
                                <p className="text-xs italic">High-fidelity assets will appear here after generation.</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="search" className="m-0 h-full flex flex-col gap-4">
                        <div className="flex gap-2">
                            <Input
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                placeholder="Search Unsplash..."
                                className="bg-zinc-900 border-zinc-800"
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button variant="outline" onClick={handleSearch} disabled={isSearching} className="border-zinc-800 hover:bg-zinc-800">
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>

                        {searchResults.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {searchResults.map((img) => (
                                    <div
                                        key={img.id}
                                        className={cn(
                                            "relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer group",
                                            selectedUrls.includes(img.url) ? "border-indigo-500" : "border-transparent"
                                        )}
                                        onClick={() => toggleSelection(img.url)}
                                    >
                                        <img src={img.url} className="h-full w-full object-cover" alt="" />
                                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between">
                                            <span className="text-[8px] text-zinc-400 truncate">{img.photographer}</span>
                                        </div>
                                        <div className={cn(
                                            "absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                                            selectedUrls.includes(img.url) && "opacity-100"
                                        )}>
                                            {selectedUrls.includes(img.url) ? (
                                                <CheckCircle2 className="h-6 w-6 text-white" />
                                            ) : (
                                                <Plus className="h-6 w-6 text-white" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                <Search className="h-10 w-10 mb-2 opacity-10" />
                                <p className="text-sm italic">Find high-quality assets on Unsplash</p>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
