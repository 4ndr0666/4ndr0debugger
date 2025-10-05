

import React, { useState, useEffect } from 'react';
import { Button } from './Button.tsx';
import { ENGINE_USERSCRIPT_TEMPLATE } from '../constants.ts';
import { CheckIcon, CopyIcon } from './Icons.tsx';

interface PayloadSynthesizerProps {
    initialCode: string;
    onClose: () => void;
}

interface TargetProfile {
    generateEndpoint: string;
    statusEndpoint: string;
    creditsEndpoint: string;
    authTokenKey: string;
    creditAmountKey: string;
    taskIdKey: string;
}

// Tokenization function to split by delimiters and case changes for advanced analysis.
const tokenize = (str: string): string[] => {
    if (!str) return [];
    return str.toLowerCase()
        .split(/[\/_-]/)
        .flatMap(part => part.replace(/([a-z])([A-Z])/g, '$1 $2').split(' '))
        .filter(Boolean);
};

export const PayloadSynthesizer = ({ initialCode, onClose }: PayloadSynthesizerProps) => {
    const [codeInput, setCodeInput] = useState(initialCode);
    const [statusLog, setStatusLog] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [outputScript, setOutputScript] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        setCodeInput(initialCode);
    }, [initialCode]);

    const addToLog = (message: string) => {
        setStatusLog(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // Advanced heuristic analysis with tokenization and weighted scoring.
    const analyzeCodeWithHeuristics = (code: string): Partial<TargetProfile> => {
        addToLog("INFO: Starting advanced heuristic analysis...");

        const urls = [...code.matchAll(/['"`](\/[a-zA-Z0-9\/._-]*?(\{task(I|i)d\})?[a-zA-Z0-9\/._-]*?)\1/g)].map(m => m[1]);
        const keys = [...code.matchAll(/['"`]([a-zA-Z0-9_.-]+?)['"`](?=:)/g)].map(m => m[1]);
        const storageKeys = [...code.matchAll(/\.(getItem|setItem)\(['"`](.+?)['"`]\)/g)].map(m => m[2]);
        const allKeys = [...new Set([...keys, ...storageKeys])];

        // Weighted keyword matrix for scoring potential targets.
        const keywordMatrix = {
            generateEndpoint: { create: 3, generate: 3, upload: 2, start: 2, process: 1, submit: 1, new: 1, add: 1, image: 1, video: 1 },
            statusEndpoint: { status: 3, progress: 3, task: 2, job: 2, check: 1, poll: 1 },
            creditsEndpoint: { credit: 3, balance: 3, points: 2, usage: 2, user: 1 },
            authTokenKey: { token: 3, jwt: 3, auth: 2, session: 2, key: 1, secret: 1, authorization: 2 },
            taskIdKey: { taskid: 4, jobid: 4, id: 1, uid: 1, task_id: 4, job_id: 4 },
            creditAmountKey: { credit: 3, balance: 3, points: 2, amount: 2, remaining: 1 },
        };

        const findBestMatch = (candidates: string[], weights: Record<string, number>, type: string): { match: string; score: number } => {
            const threshold = 2; // Confidence threshold.
            const ranked = candidates
                .map(candidate => {
                    const tokens = tokenize(candidate);
                    const score = tokens.reduce((s, token) => s + (weights[token] || 0), 0);
                    return { candidate, score };
                })
                .filter(c => c.score >= threshold)
                .sort((a, b) => b.score - a.score);

            if (ranked.length > 0) {
                addToLog(`LOG: Best match for ${type}: "${ranked[0].candidate}" (Confidence: ${ranked[0].score})`);
                return { match: ranked[0].candidate, score: ranked[0].score };
            } else {
                addToLog(`WARN: No confident match found for ${type} (threshold: ${threshold})`);
                return { match: '', score: 0 };
            }
        };

        const profile: Partial<TargetProfile> = {};
        profile.generateEndpoint = findBestMatch(urls, keywordMatrix.generateEndpoint, 'Generate Endpoint').match;
        profile.statusEndpoint = findBestMatch(urls, keywordMatrix.statusEndpoint, 'Status Endpoint').match;
        profile.creditsEndpoint = findBestMatch(urls, keywordMatrix.creditsEndpoint, 'Credits Endpoint').match;
        profile.authTokenKey = findBestMatch(allKeys, keywordMatrix.authTokenKey, 'Auth Token Key').match;
        profile.taskIdKey = findBestMatch(allKeys, keywordMatrix.taskIdKey, 'Task ID Key').match;
        profile.creditAmountKey = findBestMatch(allKeys, keywordMatrix.creditAmountKey, 'Credit Amount Key').match;
        
        addToLog(`SUCCESS: Heuristic analysis complete. Found ${Object.values(profile).filter(v => v).length} confident targets.`);
        return profile;
    };
    
    const synthesizePayload = (profile: Partial<TargetProfile>) => {
        addToLog("INFO: Synthesizing final userscript payload...");
        const hostname = 'REPLACE_WITH_TARGET_HOSTNAME';
        
        let script = ENGINE_USERSCRIPT_TEMPLATE;
        script = script.replace(/__TARGET_HOSTNAME__/g, hostname);
        script = script.replace(/__TARGET_MATCH_URL__/g, `*.${hostname}`);
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
        
        if (!codeInput.trim()) {
            addToLog("ERROR: Codebase cannot be empty.");
            setIsLoading(false);
            return;
        }
        
        setTimeout(() => {
            const profile = analyzeCodeWithHeuristics(codeInput);

            if (Object.values(profile).some(v => v)) {
                synthesizePayload(profile);
            } else {
                addToLog("FATAL: Could not generate a target profile. Aborting synthesis.");
            }
            setIsLoading(false);
        }, 50);
    };
    
    const handleCopy = () => {
        if (!outputScript) return;
        navigator.clipboard.writeText(outputScript).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        });
      };

    return (
        <div className="border border-[var(--hud-color-darkest)] bg-black/30 p-4 my-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-heading text-white">Payload Synthesizer</h3>
                 <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                    aria-label="Close Synthesizer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                {/* Left Side: Input & Controls */}
                <div className="flex flex-col space-y-4">
                    <div>
                        <label className="uppercase text-sm mb-2 block">Source Codebase</label>
                         <textarea
                            className="block w-full h-32 p-3 font-mono text-sm text-[var(--hud-color)] bg-black/70 border border-[var(--hud-color-darker)] focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)] resize-y"
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            disabled={isLoading}
                            placeholder="Hardened code for analysis..."
                        />
                    </div>
                    <Button onClick={handleSynthesize} isLoading={isLoading} disabled={isLoading} className="w-full">
                        Analyze & Synthesize Payload
                    </Button>
                    <div className="flex-grow flex flex-col min-h-0">
                        <h4 className="text-md text-[var(--hud-color-darker)] border-b border-b-[var(--hud-color-darkest)] pb-1 mb-2">Status Log</h4>
                        <div className="bg-black/50 p-2 border border-[var(--hud-color-darkest)] h-24 overflow-y-auto flex-grow font-mono text-xs text-[var(--hud-color-darker)]">
                            {statusLog.map((log, i) => <p key={i} className={log.startsWith('ERROR') || log.startsWith('FATAL') ? 'text-[var(--red-color)]' : log.startsWith('SUCCESS') ? 'text-green-400' : ''}>{log}</p>)}
                             {statusLog.length === 0 && <p>&gt; STANDBY FOR LOGGING...</p>}
                        </div>
                    </div>
                </div>

                {/* Right Side: Output */}
                <div className="flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-md text-[var(--hud-color-darker)]">Synthesized Userscript</h4>
                        <button
                            onClick={handleCopy}
                            disabled={!outputScript || isLoading}
                            className="flex items-center space-x-2 px-2 py-1 font-mono text-xs uppercase tracking-wider border border-[var(--hud-color-darkest)] text-[var(--hud-color-darker)] transition-all duration-150 hover:border-[var(--hud-color)] hover:text-[var(--hud-color)] disabled:opacity-50"
                        >
                            {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                    <div className="relative flex-grow bg-black/50 border border-[var(--hud-color-darkest)] min-h-[200px]">
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
