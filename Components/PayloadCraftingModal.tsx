import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { CheckIcon, CopyIcon } from './Icons.tsx';
import { PAYLOAD_CRAFTING_TEMPLATES } from '../constants.ts';

interface PayloadCraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PayloadType = keyof typeof PAYLOAD_CRAFTING_TEMPLATES;

export const PayloadCraftingModal: React.FC<PayloadCraftingModalProps> = ({ isOpen, onClose }) => {
    const [payloadTarget, setPayloadTarget] = useState('/api/data');
    const [lhost, setLhost] = useState('127.0.0.1');
    const [lport, setLport] = useState('8080');
    const [payloadType, setPayloadType] = useState<PayloadType>('xss_probe');
    const [script, setScript] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [errors, setErrors] = useState({ payloadTarget: '', lhost: '', lport: '' });

    const validateInputs = () => {
        const newErrors = { payloadTarget: '', lhost: '', lport: '' };
        let isValid = true;
        
        if (!payloadTarget.trim()) {
            newErrors.payloadTarget = 'Cannot be empty.';
            isValid = false;
        }

        const ipHostnameRegex = /^([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3}|localhost$/;
        if (!lhost || !ipHostnameRegex.test(lhost)) {
            newErrors.lhost = 'Must be a valid IP, hostname, or "localhost".';
            isValid = false;
        }
        
        const portNum = parseInt(lport, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            newErrors.lport = 'Must be a valid port number (1-65535).';
            isValid = false;
        }
        
        setErrors(newErrors);
        return isValid;
    };


    const handleGenerate = () => {
        if (!validateInputs()) {
            setScript('');
            return;
        }
        setIsCopied(false);

        const payloadTemplate = PAYLOAD_CRAFTING_TEMPLATES[payloadType];
        
        const generatedScript = payloadTemplate.template
            .replace(/{LHOST}/g, lhost)
            .replace(/{LPORT}/g, lport)
            .replace(/{ENDPOINT}/g, payloadTarget);
            
        setScript(generatedScript);
    };

    const handleCopy = () => {
        if (!script) return;
        navigator.clipboard.writeText(script).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        });
    };

    if (!isOpen) return null;

    return (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payload-crafting-title"
        >
          <div
            className="hud-container w-full max-w-2xl h-auto flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="hud-corner corner-top-left"></div>
            <div className="hud-corner corner-top-right"></div>
            <div className="hud-corner corner-bottom-left"></div>
            <div className="hud-corner corner-bottom-right"></div>
            
            <div className="flex justify-between items-center flex-shrink-0 relative">
                <h2 id="payload-crafting-title" className="text-xl">Payload Crafting</h2>
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]"
                    aria-label="Close Payload Crafting"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
    
            <div className="mt-4 flex flex-col min-h-0 space-y-4">
              <Select id="payload-type" label="Payload Template" options={Object.entries(PAYLOAD_CRAFTING_TEMPLATES).map(([key, { label }]) => ({ value: key, label }))} value={payloadType} onChange={v => setPayloadType(v as PayloadType)} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                      <label htmlFor="payload-target" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">Target Endpoint</label>
                      <input id="payload-target" type="text" value={payloadTarget} onChange={e => setPayloadTarget(e.target.value)} className={`block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border ${errors.payloadTarget ? 'border-[var(--red-color)]' : 'border-[var(--hud-color-darkest)]'} focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]`} placeholder="/api/data" />
                      {errors.payloadTarget && <p className="text-xs text-red-400 mt-1">{errors.payloadTarget}</p>}
                  </div>
                  <div>
                      <label htmlFor="lhost" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">Exfil Host (LHOST)</label>
                      <input id="lhost" type="text" value={lhost} onChange={e => setLhost(e.target.value)} className={`block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border ${errors.lhost ? 'border-[var(--red-color)]' : 'border-[var(--hud-color-darkest)]'} focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]`} placeholder="127.0.0.1" />
                      {errors.lhost && <p className="text-xs text-red-400 mt-1">{errors.lhost}</p>}
                  </div>
                  <div>
                      <label htmlFor="lport" className="block text-sm uppercase tracking-wider text-[var(--hud-color-darker)] mb-1">Exfil Port (LPORT)</label>
                      <input id="lport" type="text" value={lport} onChange={e => setLport(e.target.value)} className={`block w-full p-2.5 font-mono text-sm text-[var(--hud-color)] bg-black border ${errors.lport ? 'border-[var(--red-color)]' : 'border-[var(--hud-color-darkest)]'} focus:outline-none focus:ring-1 focus:ring-[var(--hud-color)]`} placeholder="8080" />
                      {errors.lport && <p className="text-xs text-red-400 mt-1">{errors.lport}</p>}
                  </div>
              </div>
              
              <Button onClick={handleGenerate}>
                [ Generate Payload Template ]
              </Button>
    
              {script && (
                <div className="animate-fade-in space-y-2">
                    <h4 className="text-sm uppercase tracking-wider text-[var(--hud-color-darker)]">Generated Script:</h4>
                    <div className="relative">
                        <textarea
                            readOnly
                            value={script}
                            className="block w-full h-32 p-3 font-mono text-xs text-[var(--hud-color)] bg-black border border-[var(--hud-color-darkest)] resize-y pr-12"
                            aria-label="Generated payload script"
                        />
                        <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 text-[var(--hud-color)] hover:bg-[var(--hud-color)] hover:text-black"
                            title={isCopied ? "Copied!" : "Copy Script"}
                            aria-label={isCopied ? "Script copied" : "Copy generated script"}
                        >
                            {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                        </button>
                    </div>
                     <p className="text-xs text-center text-[var(--hud-color-darker)]">This payload is a template. Further refinement may be required in the Council.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
};
