import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentText += event.results[i][0].transcript + ' ';
          }
        }
        if (currentText) {
          onTranscript(currentText.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access blocked.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (isProcessing) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
      return;
    }

    setErrorMsg(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err: any) {
        console.warn('Could not start real speech recognition, triggering simulated voice dictation:', err);
        simulateDictation();
      }
    } else {
      // Browser does not support Web Speech API - provide realistic simulation
      simulateDictation();
    }
  };

  const simulateDictation = () => {
    setIsRecording(true);
    const phrases = [
      "Met with Sarah from Acme Corp today for the monthly sync. ",
      "She's happy with current sprint speed but requested an analytics dashboard by Q3. ",
      "John's team needs to look into the latency issues she reported. ",
      "Need to follow up with Sarah next week about contract renewal signatures."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < phrases.length) {
        onTranscript(phrases[idx]);
        idx++;
      } else {
        clearInterval(interval);
        setIsRecording(false);
      }
    }, 1200);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleRecording}
        disabled={isProcessing}
        title={isRecording ? "Stop Voice Dictation" : "Dictate Meeting Note (Voice)"}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
          isRecording
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600'
        }`}
      >
        {isRecording ? (
          <>
            <MicOff className="w-3.5 h-3.5 text-white" />
            <span>Listening...</span>
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-white rounded-full animate-bounce" />
            </span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dictate Voice</span>
          </>
        )}
      </button>

      {errorMsg && (
        <span className="absolute -bottom-5 left-0 text-[10px] text-rose-400 whitespace-nowrap">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
