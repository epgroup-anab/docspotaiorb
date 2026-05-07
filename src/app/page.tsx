"use client";

import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { BarVisualizer } from "@/components/ui/bar-visualizer";
import { ParticleOrb } from "@/components/ui/particle-orb";
import { X } from "lucide-react";
import { DOCSPOT_AGENT_ID } from "@/config/agent";

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

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fafb] text-[#1f2937] font-sans overflow-hidden">
      <main className="flex-1 flex flex-col items-center justify-center relative p-4">
        <div className="max-w-3xl w-full flex flex-col items-center gap-8 z-10">
          <div className="text-center space-y-2 px-4">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
              Docspot AI
            </h1>
            <p className="text-base md:text-lg text-gray-500 font-light max-w-md mx-auto">
              Your AI assistant for dental call handling and patient support.
            </p>
          </div>

          <div className="relative w-full min-h-[400px] flex items-center justify-center">
            {!showVisualizer ? (
              <div className="flex flex-col items-center gap-8 py-8">
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={startConversation}
                    className="group relative w-32 h-32 md:w-40 md:h-40 rounded-full focus:outline-none transition-transform duration-500 hover:scale-105"
                    aria-label="Talk to Docspot AI"
                  >
                    <div className="absolute inset-0 rounded-full bg-violet-500 blur-2xl opacity-30 animate-pulse group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full rounded-full overflow-hidden border-[6px] border-white shadow-xl ring-2 ring-violet-200 bg-slate-950">
                      <ParticleOrb />
                    </div>
                  </button>
                  <span className="text-lg font-medium text-violet-700">Talk to Docspot AI</span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">
                <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-red-100">
                  <BarVisualizer
                    state={
                      conversation.status === "connected"
                        ? conversation.isSpeaking
                          ? "speaking"
                          : "listening"
                        : "connecting"
                    }
                    barCount={20}
                    mediaStream={mediaStream}
                    className="h-32"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={endConversation}
                    className="px-8 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm text-sm font-medium flex items-center gap-2"
                  >
                    <X size={16} />
                    End Call with Docspot AI
                  </button>
                </div>

                <p className="text-xs font-medium animate-pulse uppercase tracking-wider text-red-600/80">
                  {conversation.status === "connected"
                    ? conversation.isSpeaking
                      ? "Docspot AI Speaking"
                      : "Listening"
                    : "Connecting..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 border-t border-gray-100 bg-white/50">
        <p>&copy; 2026 Docspot AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
