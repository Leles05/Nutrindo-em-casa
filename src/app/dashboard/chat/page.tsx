"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, MoreVertical, CheckCheck, UserCircle, X } from "lucide-react";
import Image from "next/image";

type Mensagem = {
  id: string;
  remetente: 'nutri' | 'mae';
  texto: string;
  hora: string;
  anexos?: string[];
};

export default function ChatPage() {
  const [mensagem, setMensagem] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [mensagensChat, setMensagensChat] = useState<Mensagem[]>([
    {
      id: '1',
      remetente: 'nutri',
      texto: 'Olá, mãe! Vi que vocês preencheram o Diário Alimentar ontem. Como foi a aceitação do brócolis no jantar? Tiveram alguma crise?',
      hora: '09:41'
    },
    {
      id: '2',
      remetente: 'mae',
      texto: 'Bom dia, Dra! Ele cheirou e tocou no brócolis, mas na hora de colocar na boca ele chorou um pouco. Nós não forçamos, conforme combinamos.',
      hora: '10:15'
    }
  ]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [mensagensChat]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [mensagem]);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const novosArquivos = Array.from(e.target.files);
      setArquivos(prev => [...prev, ...novosArquivos]);
      
      const novasPreviews = novosArquivos.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...novasPreviews]);
    }
  };

  const removerAnexo = (indexToRemove: number) => {
    setArquivos(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, index) => index !== indexToRemove);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enviarMensagem = () => {
    if (!mensagem.trim() && arquivos.length === 0) return;

    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      remetente: 'mae',
      texto: mensagem.trim(),
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      anexos: previews.length > 0 ? [...previews] : undefined
    };

    setMensagensChat(prev => [...prev, novaMensagem]);
    
    setMensagem("");
    setArquivos([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animation-fade-in">
      
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 bg-[#4C6C54]/10 rounded-full flex items-center justify-center text-[#4C6C54]">
              <UserCircle className="h-8 w-8" />
            </div>
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Dra. Laís Leles</h2>
            <p className="text-sm text-slate-500 font-medium">Nutricionista Responsável</p>
          </div>
        </div>
        <button className="h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* Aplicado custom scrollbar via Tailwind Arbitrary Variants */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FA] scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <div className="flex justify-center">
          <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full uppercase tracking-wider">
            Hoje
          </span>
        </div>

        {mensagensChat.map((msg) => (
          <div key={msg.id} className={`flex ${msg.remetente === 'mae' ? 'justify-end' : 'items-end gap-2 max-w-[85%] sm:max-w-[70%]'}`}>
            
            {msg.remetente === 'nutri' && (
              <div className="h-8 w-8 bg-[#4C6C54]/10 rounded-full flex items-center justify-center text-[#4C6C54] shrink-0 mb-1">
                <UserCircle className="h-5 w-5" />
              </div>
            )}

            <div className={`p-4 rounded-2xl shadow-sm ${msg.remetente === 'mae' ? 'bg-[#4C6C54] text-white rounded-br-sm max-w-[85%] sm:max-w-[70%]' : 'bg-white border border-slate-100 rounded-bl-sm text-slate-700'}`}>
              
              {/* Grid Inteligente de Imagens */}
              {msg.anexos && msg.anexos.length > 0 && (
                <div className={`grid gap-1.5 mb-3 ${msg.anexos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                  {msg.anexos.map((imgUrl, idx) => (
                    <div key={idx} className={`relative rounded-xl overflow-hidden border border-black/10 ${msg.anexos && msg.anexos.length === 1 ? 'h-48 sm:h-64 w-full' : 'h-24 sm:h-32 w-full'}`}>
                      <Image src={imgUrl} alt="Anexo" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {msg.texto && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.texto}</p>}
              
              <div className={`flex items-center gap-1 mt-1.5 ${msg.remetente === 'mae' ? 'justify-end' : ''}`}>
                <span className={`text-[11px] font-medium ${msg.remetente === 'mae' ? 'text-white/70' : 'text-slate-400'}`}>
                  {msg.hora}
                </span>
                {msg.remetente === 'mae' && <CheckCheck className="h-3.5 w-3.5 text-white/70" />}
              </div>
            </div>

          </div>
        ))}
      </div>

      <div className="bg-white border-t border-slate-100">
        
        {previews.length > 0 && (
          <div className="px-6 py-4 bg-white flex flex-wrap gap-4 border-b border-slate-50 animation-fade-in max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            {previews.map((preview, index) => (
              <div key={index} className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                <Image src={preview} alt="Preview" fill className="object-cover" />
                <button 
                  onClick={() => removerAnexo(index)}
                  className="absolute top-1 right-1 h-6 w-6 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-4 sm:p-5">
          {/* Ajustado items-end para manter os botões ancorados embaixo quando o texto crescer */}
          <div className="flex items-end gap-3 bg-slate-50 p-2 border border-slate-200 rounded-3xl focus-within:ring-2 focus-within:ring-[#4C6C54]/50 focus-within:border-[#4C6C54] transition-all shadow-sm">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
              multiple
            />

            <button 
              onClick={handleAttachmentClick}
              className="h-12 w-12 flex items-center justify-center text-slate-500 hover:text-[#4C6C54] hover:bg-[#4C6C54]/10 rounded-2xl transition-colors shrink-0"
              title="Anexar foto"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            
            <textarea 
              ref={textareaRef}
              rows={1}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-[15px] text-slate-700 placeholder:text-slate-400 min-h-[52px] max-h-[150px] scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
            />

            <button 
              onClick={enviarMensagem}
              className={`h-12 w-12 flex items-center justify-center rounded-2xl transition-all shrink-0 ${
                mensagem.trim() || arquivos.length > 0
                  ? 'bg-[#4C6C54] text-white hover:bg-[#3a5340] shadow-md hover:scale-105' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}