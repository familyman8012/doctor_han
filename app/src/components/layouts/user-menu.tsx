"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "ui/agent-ncos/avatar";
import { Button } from "ui/agent-ncos/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ui/agent-ncos/tooltip";
import { signOut, useSession } from "@/server/auth/client";
import { useSidebarStore } from "@/stores/sidebarStore";

export function UserMenu() {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const resetSidebar = useSidebarStore((state) => state.resetAll);
    const router = useRouter();

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            resetSidebar();
            await signOut();
            router.push("/auth/signin");
        } catch (error) {
            console.error("Sign out error:", error);
            router.push("/auth/signin");
        } finally {
            setIsLoading(false);
        }
    };

    if (!session?.user) {
        return null;
    }

    const { user } = session;

    const initials =
        user.name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase() ?? "";

    return (
        <TooltipProvider>
            <div className="flex items-center justify-between gap-2 w-full">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/50 flex-1 min-w-0 cursor-pointer hover:bg-muted transition-colors">
                            <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-medium truncate">{user.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-xs">
                        <div className="text-sm">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground break-all">{user.email}</div>
                        </div>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSignOut}
                            disabled={isLoading}
                            className="h-8 w-8 flex-shrink-0"
                        >
                            <LogOut className="h-3 w-3" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Sign out</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
