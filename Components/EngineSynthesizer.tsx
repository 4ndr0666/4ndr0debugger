import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from './Button.tsx';
import { ENGINE_SYNTHESIZER_SYSTEM_INSTRUCTION, ENGINE_USERSCRIPT_TEMPLATE } from '../constants.ts';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { CheckIcon, CopyIcon } from './Icons.tsx';

interface EngineSynthesizerProps {
    ai: GoogleGenAI | null;
}

type InputType = 'url' | 'code';

interface TargetProfile {
    hostname: string;
    generateEndpoint: string;
    statusEndpoint: string;
    creditsEndpoint: string;
    authTokenKey: string;
    creditAmountKey: string;
    taskIdKey: string;
}

export const EngineSynthesizer = ({ ai }: EngineSynthesizerProps) => {
    const [inputType, setInputType] = useState<InputType>('url');
    const [urlInput, setUrlInput] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [statusLog, setStatusLog] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [outputScript, setOutputScript] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const addToLog = (message: string) => {
        setStatusLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const analyzeUrlWithAI = async (url: string): Promise<Partial<TargetProfile> | null> => {
        if (!ai) {
            addToLog("ERROR: Gemini AI client not initialized. Check API Key.");
            return null;
        }
        addToLog(`INFO: Starting AI-based reconnaissance for ${url}...`);

        const schema = {
            type: Type.OBJECT,
            properties: {
                generateEndpoint: { type: Type.STRING },
                statusEndpoint: { type: Type.STRING },
                creditsEndpoint: { type: Type.STRING },
                authTokenKey: { type: Type.STRING },
                taskIdKey: { type: Type.STRING },
                creditAmountKey: { type: Type.STRING },
            },
            required: ['generateEndpoint', 'statusEndpoint', 'creditsEndpoint', 'authTokenKey', 'taskIdKey', 'creditAmountKey'],
        };
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Target URL: ${url}`,
                config: {
                    systemInstruction: ENGINE_SYNTHESIZER_SYSTEM_INSTRUCTION,
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            });

            const profile = JSON.parse(response.text);
            addToLog("SUCCESS: AI reconnaissance complete. Profile extracted.");
            return profile;
        } catch (error) {
            console.error("AI Analysis Error:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            addToLog(`ERROR: AI analysis failed: ${message}`);
            return null;
        }
    };

    const analyzeCodeWithHeuristics = (code: string): Partial<TargetProfile> => {
        addToLog("INFO: Starting heuristic analysis on provided codebase...");

        const urls = [...code.matchAll(/['"`](\/[a-zA-Z0-9\/._-]*?)\1/g)].map(m => m[1]);
        const keys = [...code.matchAll(/['"`]([a-zA-Z0-9_.-]+)['"`]\s*:/g)].map(m => m[1]);

        const findBestMatch = (candidates: string[], keywords: string[]): string => {
            const ranked = candidates
                .map(c => ({ candidate: c, score: keywords.reduce((s, kw) => s + (c.toLowerCase().includes(kw) ? 1 : 0), 0) }))
                .filter(c => c.score > 0)
                .sort((a, b) => b.score - a.score);
            return ranked.length > 0 ? ranked[0].candidate : '';
        };

        const profile: Partial<TargetProfile> = {};

        profile.generateEndpoint = findBestMatch(urls, ['create', 'generate', 'upload', 'start', 'process', 'submit']);
        profile.statusEndpoint = findBestMatch(urls, ['status', 'progress', 'task', 'job']);
        profile.creditsEndpoint = findBestMatch(urls, ['credit', 'balance', 'points', 'usage', 'equity', 'list']);
        profile.authTokenKey = findBestMatch(keys, ['token', 'jwt', 'auth', 'session']);
        profile.taskIdKey = findBestMatch(keys, ['taskid', 'jobid', 'id', 'uid']);
        profile.creditAmountKey = findBestMatch(keys, ['credit', 'balance', 'points', 'equity', 'usage']);
        
        addToLog(`SUCCESS: Heuristic analysis complete. Found ${Object.values(profile).filter(v => v).length} potential targets.`);
        return profile;
    };
    
    const synthesizePayload = (profile: Partial<TargetProfile>, url: string) => {
        addToLog("INFO: Synthesizing final userscript payload...");
        let hostname = 'example.com';
        try {
            hostname = new URL(url).hostname;
        } catch {
            addToLog("WARN: Could not parse hostname from URL, using default.");
        }
        
        let script = ENGINE_USERSCRIPT_TEMPLATE;
        script = script.replace(/__TARGET_HOSTNAME__/g, hostname);
        script = script.replace(/__TARGET_MATCH_URL__/g, hostname);
        script = script.replace(/__TARGET_GENERATE_ENDPOINT_HEURISTIC__/g, profile.generateEndpoint || 'NOT_FOUND');
        script = script.replace(/__TARGET_STATUS_ENDPOINT_HEURISTIC__/g, profile.statusEndpoint || 'NOT_FOUND');
        script = script.replace(/__TARGET_CREDITS_ENDPOINT_HEURISTIC__/g, profile.creditsEndpoint || 'NOT_FOUND');
        script = script.replace(/__TARGET_AUTH_KEY_HEURISTIC__/g, profile.authTokenKey || 'NOT_FOUND');
        script = script.replace(/__TARGET_CREDIT_KEY_HEURISTIC__/g, profile.creditAmountKey || 'NOT_FOUND');
        script = script.replace(/__TARGET_TASKID_KEY_HEURISTIC__/g, profile.taskIdKey || 'NOT_FOUND');

        setOutputScript(script);
        addToLog("SUCCESS: Payload synthesized.");
    };

    const handleSynthesize = async () => {
        setIsLoading(true);
        setOutputScript('');
        setStatusLog([]);
        
        let profile: Partial<TargetProfile> | null = null;
        let targetIdentifier = '';

        if (inputType === 'url') {
            if (!urlInput.trim()) {
                addToLog("ERROR: Target URL cannot be empty.");
                setIsLoading(false);
                return;
            }
            targetIdentifier = urlInput;
            profile = await analyzeUrlWithAI(urlInput);
        } else {
            if (!codeInput.trim()) {
                addToLog("ERROR: Legacy codebase cannot be empty.");
                setIsLoading(false);
                return;
            }
            targetIdentifier = 'http://legacy.code';
            profile = analyzeCodeWithHeuristics(codeInput);
        }

        if (profile) {
            synthesizePayload(profile, targetIdentifier);
        } else {
            addToLog("FATAL: Could not generate a target profile. Aborting synthesis.");
        }

        setIsLoading(false);
    };
    
    const handleCopy = () => {
        if (!outputScript) return;
        navigator.clipboard.writeText(outputScript).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        });
      };

    return (
        <div className="hud-container active h-full flex flex-col animate-fade-in">
            <div className="hud-corner corner-top-left"></div>
            <div className="hud-corner corner-top-right"></div>
            <div className="hud-corner corner-bottom-left"></div>
            <div className="hud-corner corner-bottom-right"></div>
            <h2 className="text-xl text-center mb-4">Dynamic Payload Synthesis Engine</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                {/* Left Side: Input & Controls */}
                <div className="flex flex-col space-y-4">
                    <div>
                        <div className="flex items-center space-x-4 border-b border-[var(--hud-color-darkest)] mb-4">
                            <label className="flex items-center space-x-2 p-2 cursor-pointer">
                                <input type="radio" name="inputType" value="url" checked={inputType === 'url'} onChange={() => setInputType('url')} className="hidden" />
                                <span className={`w-4 h-4 border-2 border-[var(--hud-color)] flex items-center justify-center ${inputType === 'url' ? 'bg-[var(--hud-color)]' : ''}`}></span>
                                <span className="uppercase text-sm">Target URL</span>
                            </label>
                            <label className="flex items-center space-x-2 p-2 cursor-pointer">
                                <input type="radio" name="inputType" value="code" checked={inputType === 'code'} onChange={() => setInputType('code')} className="hidden" />
                                <span className={`w-4 h-4 border-2 border-[var(--hud-color)] flex items-center justify-center ${inputType === 'code' ? 'bg-[var(--hud-color)]' : ''}`}></span>
                                <span className="uppercase text-sm">Legacy Codebase</span>
                            </label>
                        </div>
                        {inputType === 'url' ? (
                             <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] placeholder:text-[var(--hud-color-darker)]"
                                placeholder="https://target.example.com/app"
                                disabled={isLoading}
                            />
                        ) : (
                             <textarea
                                className="block w-full h-32 p-3 font-mono text-sm text-[var(--hud-color)] bg-black/70 border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] resize-y"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                                disabled={isLoading}
                                placeholder="Paste target JavaScript code here..."
                            />
                        )}
                    </div>
                    <Button onClick={handleSynthesize} isLoading={isLoading} disabled={isLoading} className="w-full">
                        Analyze & Synthesize Payload
                    </Button>
                    <div className="flex-grow flex flex-col min-h-0">
                        <h3 className="text-lg text-[var(--hud-color-darker)] border-b border-b-[var(--hud-color-darkest)] pb-1 mb-2">Status Log</h3>
                        <div className="bg-black/50 p-2 border border-[var(--hud-color-darkest)] overflow-y-auto flex-grow font-mono text-xs text-[var(--hud-color-darker)]">
                            {statusLog.map((log, i) => <p key={i} className={log.startsWith('ERROR') || log.startsWith('FATAL') ? 'text-[var(--red-color)]' : log.startsWith('SUCCESS') ? 'text-green-400' : ''}>{log}</p>)}
                        </div>
                    </div>
                </div>

                {/* Right Side: Output */}
                <div className="flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg text-[var(--hud-color-darker)]">Synthesized Payload</h3>
                        <button
                            onClick={handleCopy}
                            disabled={!outputScript || isLoading}
                            className="flex items-center space-x-2 px-2 py-1 font-mono text-xs uppercase tracking-wider border border-[var(--hud-color-darkest)] text-[var(--hud-color-darker)] transition-all duration-150 hover:border-[var(--hud-color)] hover:text-[var(--hud-color)] disabled:opacity-50"
                        >
                            {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                    <div className="relative flex-grow bg-black/50 border border-[var(--hud-color-darkest)]">
                        {isLoading && !outputScript && <LoadingSpinner />}
                        <textarea
                            className="w-full h-full p-3 font-mono text-sm text-[var(--hud-color)] bg-transparent resize-none focus:outline-none"
                            value={outputScript}
                            readOnly
                            placeholder="Generated userscript will appear here..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
