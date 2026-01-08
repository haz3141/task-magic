"use client";

import { useState, useEffect, useCallback } from "react";
import { ActorClient, ACTOR_STORAGE_KEY } from "../shared/types/actor";

interface StoredActor {
    id: string;
    name: string;
    emoji: string;
    createdAt: string;
}

interface UseActorResult {
    actor: ActorClient | null;
    isLoading: boolean;
    needsSetup: boolean;
    createActor: (actorId: string, name: string, emoji: string) => void;
}

/**
 * React hook for device-local actor identity.
 * Reads/writes to localStorage, generates stable UUID on first setup.
 */
export function useActor(): UseActorResult {
    const [actor, setActor] = useState<ActorClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load actor from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(ACTOR_STORAGE_KEY);
            if (stored) {
                const parsed: StoredActor = JSON.parse(stored);
                setActor({
                    id: parsed.id,
                    name: parsed.name,
                    emoji: parsed.emoji,
                });
            }
        } catch (e) {
            console.error("Failed to load actor from localStorage:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create and persist a new actor
    // The actorId is provided by ActorSetupModal to ensure consistency with DB registration
    const createActor = useCallback((actorId: string, name: string, emoji: string) => {
        const newActor: StoredActor = {
            id: actorId,
            name: name.trim(),
            emoji,
            createdAt: new Date().toISOString(),
        };

        try {
            localStorage.setItem(ACTOR_STORAGE_KEY, JSON.stringify(newActor));
            setActor({
                id: newActor.id,
                name: newActor.name,
                emoji: newActor.emoji,
            });
        } catch (e) {
            console.error("Failed to save actor to localStorage:", e);
        }
    }, []);

    return {
        actor,
        isLoading,
        needsSetup: !isLoading && actor === null,
        createActor,
    };
}
