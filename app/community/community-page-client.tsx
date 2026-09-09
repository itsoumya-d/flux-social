'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Radio, Brain, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import InboxView from './inbox-view';
import { SocialListening } from '@/components/social-listening';
import { BrandVoiceConfig } from '@/components/brand-voice-config';

interface CommunityPageClientProps {
    initialFeedItems: any[];
    brandId?: string;
    brandVoice?: string;
}

function CommunityTabs({ initialFeedItems, brandId, brandVoice }: CommunityPageClientProps) {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('inbox');
    const tabParam = searchParams.get('tab');
    const [prevTabParam, setPrevTabParam] = useState(tabParam);

    if (tabParam !== prevTabParam) {
        setPrevTabParam(tabParam);
        if (tabParam && ['inbox', 'listening', 'voice'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Update URL without navigation
        const url = new URL(window.location.href);
        if (value === 'inbox') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', value);
        }
        window.history.replaceState({}, '', url.toString());
    };

    return (
        <div className="h-full">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold"
                    >
                        {activeTab === 'inbox' && 'Community Inbox'}
                        {activeTab === 'listening' && 'Social Listening'}
                        {activeTab === 'voice' && 'Brand Voice'}
                    </motion.h1>

                    <TabsList className="bg-white/5 border border-white/10">
                        <TabsTrigger
                            value="inbox"
                            className="gap-2 data-[state=active]:bg-white/10"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Inbox
                        </TabsTrigger>
                        <TabsTrigger
                            value="listening"
                            className="gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                        >
                            <Radio className="w-4 h-4" />
                            Listening
                        </TabsTrigger>
                        <TabsTrigger
                            value="voice"
                            className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                        >
                            <Brain className="w-4 h-4" />
                            Brand Voice
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="inbox" className="flex-1 mt-0">
                    <InboxView initialFeedItems={initialFeedItems} brandId={brandId} brandVoice={brandVoice} />
                </TabsContent>

                <TabsContent value="listening" className="flex-1 mt-0">
                    <SocialListening brandId={brandId} />
                </TabsContent>

                <TabsContent value="voice" className="flex-1 mt-0">
                    <BrandVoiceConfig brandId={brandId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function CommunityPageClient(props: CommunityPageClientProps) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <CommunityTabs {...props} />
        </Suspense>
    );
}
