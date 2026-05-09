import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Sparkles, RefreshCw, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface AIMessageGeneratorProps {
  onApply: (message: string) => void;
}

export function AIMessageGenerator({ onApply }: AIMessageGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const generateMessage = async () => {
    if (!topic) {
      toast.error("Please enter a topic first!");
      return;
    }

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const prompt = `Topic: ${topic}\nTone: ${tone}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a WhatsApp marketing expert. Generate a short, engaging WhatsApp message (max 150 words) for the given topic and tone. Include relevant emojis. Make it feel personal and not spammy.",
        },
      });

      const text = response.text || "";
      setGeneratedMessage(text);
      toast.success("Message generated successfully!");
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("Failed to generate message. Please check your connection or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setHasCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Topic</Label>
          <Input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Diwali sale 50% off"
            className="bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus-visible:ring-whatsapp-green"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl focus:ring-whatsapp-green">
              <SelectValue placeholder="Select Tone" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Friendly">Friendly</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="Festive">Festive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generateMessage}
          disabled={isLoading}
          className="w-full bg-whatsapp-green hover:bg-[#1ebe5d] text-white font-black text-[11px] tracking-widest rounded-xl shadow-lg shadow-whatsapp-green/20 h-11 transition-all active:scale-95"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> GENERATING...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> GENERATE WITH AI</>
          )}
        </Button>
      </div>

      {generatedMessage && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-black text-whatsapp-green uppercase tracking-widest">AI Suggestion</Label>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-whatsapp-green"
                onClick={copyToClipboard}
              >
                {hasCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-whatsapp-green"
                onClick={generateMessage}
                disabled={isLoading}
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          <Textarea 
            value={generatedMessage}
            onChange={(e) => setGeneratedMessage(e.target.value)}
            className="min-h-[120px] bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 text-[13px] leading-relaxed font-medium rounded-xl focus-visible:ring-whatsapp-green"
          />
          
          <Button 
            onClick={() => onApply(generatedMessage)}
            variant="outline"
            className="w-full h-10 border-whatsapp-green/50 text-whatsapp-green hover:bg-whatsapp-green hover:text-white font-black text-[10px] tracking-widest rounded-xl transition-all"
          >
            APPLY TO EDITOR
          </Button>
        </div>
      )}
    </div>
  );
}
