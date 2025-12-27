'use client';

import { useState, useEffect } from 'react';
import {
    Check,
    ChevronsUpDown,
    PlusCircle,
    Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { getAccessibleBrands } from '@/app/actions/brands';
import { setActiveBrandId, getActiveBrandId } from '@/app/actions/workspace';
import { CreateWorkspaceModal } from './create-workspace-modal';
import { useRouter } from 'next/navigation';

export function BrandSwitcher({ collapsed }: { collapsed?: boolean }) {
    const [open, setOpen] = useState(false);
    const [brands, setBrands] = useState<any[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const data = await getAccessibleBrands();
            setBrands(data);
            const activeId = await getActiveBrandId();
            if (activeId) {
                const active = data.find((b: any) => b.id === activeId);
                if (active) setSelectedBrand(active);
                else if (data.length > 0) setSelectedBrand(data[0]);
            } else if (data.length > 0) {
                setSelectedBrand(data[0]);
            }
        };
        init();
    }, []);

    const handleSelect = async (brand: any) => {
        setSelectedBrand(brand);
        setOpen(false);
        await setActiveBrandId(brand.id);
        router.refresh(); // Refresh all server components to respect the new brand
    };

    const handleCreateBrand = () => {
        setOpen(false);
        setIsCreateOpen(true);
    };

    const handleCreateSuccess = (newBrand: any) => {
        setBrands([...brands, newBrand]);
        handleSelect(newBrand);
    };

    if (collapsed) {
        return (
            <div className="flex justify-center py-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Building2 className="h-6 w-6" />
                </div>
            </div>
        );
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between premium-button bg-white/5 border-glass-border h-12 px-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <span className="truncate font-bold text-sm">
                                {selectedBrand?.name || "Select Brand..."}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 premium-card border-glass-border bg-zinc-950/90 backdrop-blur-xl">
                    <Command className="bg-transparent">
                        <CommandInput placeholder="Search brands..." className="h-10" />
                        <CommandList>
                            <CommandEmpty>No brand found.</CommandEmpty>
                            <CommandGroup heading="Workspaces">
                                {brands.map((brand) => (
                                    <CommandItem
                                        key={brand.id}
                                        onSelect={() => handleSelect(brand)}
                                        className="flex items-center justify-between py-3 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <span>{brand.name}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedBrand?.id === brand.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                <CommandItem onSelect={handleCreateBrand} className="py-3 cursor-pointer text-primary">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Workspace
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <CreateWorkspaceModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={handleCreateSuccess}
            />
        </>
    );
}
