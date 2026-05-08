"use client";

import { Outfit } from "next/font/google";
import { useState, useCallback, useMemo } from "react";
import { useConversation } from "@elevenlabs/react";
import { ParticleOrb, type OrbAgentState } from "@/components/ui/particle-orb";
import { X } from "lucide-react";
import { DOCSPOT_AGENT_ID } from "@/config/agent";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function Home() {
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setShowVisualizer(true);
    },
    onDisconnect: () => {
      setShowVisualizer(false);
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        setMediaStream(null);
      }
    },
    onError: (error) => {
      console.error("Error:", error);
      setShowVisualizer(false);
    },
  });

  const startConversation = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);

      await conversation.startSession({
        agentId: DOCSPOT_AGENT_ID,
      } as any);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const agentState: OrbAgentState = useMemo(() => {
    if (!showVisualizer) return "idle";
    if (conversation.status !== "connected") return "connecting";
    return conversation.isSpeaking ? "speaking" : "listening";
  }, [showVisualizer, conversation.status, conversation.isSpeaking]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-[#1f2937] font-sans overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center relative p-4">
        <div className="max-w-3xl w-full flex flex-col items-center gap-8 z-10">
          <div className="text-center px-4">
            <h1
              className={`${outfit.className} text-5xl md:text-6xl font-semibold tracking-tight`}
              style={{ color: "#007fff" }}
            >
              DocSpot AI
            </h1>
          </div>

          <div className="relative w-full min-h-[560px] flex items-center justify-center">
            {!showVisualizer ? (
              <div className="flex flex-col items-center gap-8 py-8">
                <button
                  onClick={startConversation}
                  className="group relative w-[420px] h-[420px] md:w-[520px] md:h-[520px] focus:outline-none transition-transform duration-500 hover:scale-[1.04] cursor-pointer"
                  aria-label="Talk to DocSpot AI"
                >
                  <div className="absolute inset-[28%] rounded-full bg-violet-500 blur-3xl opacity-15 animate-pulse group-hover:opacity-25 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="relative w-full h-full">
                    <ParticleOrb agentState="idle" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                <div className="relative w-[420px] h-[420px] md:w-[520px] md:h-[520px]">
                  <div
                    className={`absolute inset-[28%] rounded-full bg-violet-500 blur-3xl pointer-events-none transition-opacity duration-700 ${
                      agentState === "speaking"
                        ? "opacity-40"
                        : agentState === "listening"
                        ? "opacity-25"
                        : "opacity-15"
                    }`}
                  ></div>
                  <div className="relative w-full h-full">
                    <ParticleOrb
                      agentState={agentState}
                      mediaStream={mediaStream}
                    />
                  </div>
                </div>

                <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-700/80">
                  {agentState === "connecting"
                    ? "Connecting..."
                    : agentState === "speaking"
                    ? "DocSpot AI Speaking"
                    : "Listening"}
                </p>

                <button
                  onClick={endConversation}
                  className="mt-2 px-8 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm text-sm font-medium flex items-center gap-2"
                >
                  <X size={16} />
                  End Call with DocSpot AI
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 border-t border-gray-100 bg-white/50">
        <p>&copy; 2026 DocSpot AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
