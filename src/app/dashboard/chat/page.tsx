"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, MoreVertical, CheckCheck, UserCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [lightbox, setLightbox] = useState<{ urls: string[], index: number } | null>(null);
  
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [mensagem]);

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
  };

  const enviarMensagem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const abrirLightbox = (urls: string[], index: number) => setLightbox({ urls, index });
  const fecharLightbox = () => setLightbox(null);
  const proximaFoto = (e: React.MouseEvent) => { e.stopPropagation(); if (lightbox && lightbox.index < lightbox.urls.length - 1) setLightbox({ ...lightbox, index: lightbox.index + 1 }); };
  const fotoAnterior = (e: React.MouseEvent) => { e.stopPropagation(); if (lightbox && lightbox.index > 0) setLightbox({ ...lightbox, index: lightbox.index - 1 }); };

  const podeEnviar = mensagem.trim().length > 0 || arquivos.length > 0;

  return (
    <>
      {/* Container Full Screen ignorando o padding do Dashboard */}
      <div className="-m-4 md:-m-8 h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-[#EFECE5] relative overflow-hidden animation-fade-in">
        
        {/* Cabeçalho */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f0f2f5] z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-[#4C6C54] shadow-sm">
                <UserCircle className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Dra. Laís Leles</h2>
              <p className="text-sm text-slate-500 font-medium">Nutricionista Responsável</p>
            </div>
          </div>
          <button className="h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors">
            <MoreVertical className="h-6 w-6" />
          </button>
        </header>

        {/* Fundo do Chat */}
        <div 
          ref={chatContainerRef} 
          className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="flex justify-center mb-6">
            <span className="text-xs font-bold text-slate-500 bg-[#e1e2e3] px-4 py-1.5 rounded-lg shadow-sm uppercase tracking-wider">
              Hoje
            </span>
          </div>

          {mensagensChat.map((msg) => (
            <div key={msg.id} className={`flex ${msg.remetente === 'mae' ? 'justify-end' : 'items-end gap-3 max-w-[95%] sm:max-w-[80%]'}`}>
              
              <div className={`p-3 sm:p-4 rounded-xl shadow-sm ${msg.remetente === 'mae' ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                
                {/* Grid de Imagens com Largura Fixa para não espremer */}
                {msg.anexos && msg.anexos.length > 0 && (
                  <div className={`grid gap-1 mb-2 w-[240px] sm:w-[320px] md:w-[400px] ${msg.anexos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {msg.anexos.slice(0, 4).map((imgUrl, idx) => {
                      const total = msg.anexos!.length;
                      const isThirdLayoutTop = total === 3 && idx === 0;
                      const sizeClass = isThirdLayoutTop ? 'col-span-2 aspect-video' : (total === 1 ? 'h-64 sm:h-80' : 'h-32 sm:h-48');

                      return (
                        <div 
                          key={idx} 
                          onClick={() => abrirLightbox(msg.anexos!, idx)}
                          className={`relative rounded-lg overflow-hidden cursor-pointer group bg-black/5 ${sizeClass}`}
                        >
                          <Image src={imgUrl} alt="Anexo" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          {idx === 3 && total > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">+{total - 3}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {msg.texto && <p className="text-[16px] leading-relaxed whitespace-pre-wrap">{msg.texto}</p>}
                
                <div className={`flex items-center gap-1.5 mt-1 ${msg.remetente === 'mae' ? 'justify-end' : 'justify-end'}`}>
                  <span className="text-[11px] font-medium text-slate-400">
                    {msg.hora}
                  </span>
                  {msg.remetente === 'mae' && <CheckCheck className="h-4 w-4 text-blue-500" />}
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Rodapé: Input Ocupando Toda a Largura */}
        <div className="bg-[#f0f2f5] px-4 py-3 shrink-0">
          
          {previews.length > 0 && (
            <div className="px-4 py-3 mb-3 bg-white rounded-2xl flex flex-wrap gap-3 shadow-sm max-h-32 overflow-y-auto">
              {previews.map((preview, index) => (
                <div key={index} className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-slate-200">
                  <Image src={preview} alt="Preview" fill className="object-cover" />
                  <button onClick={() => removerAnexo(index)} className="absolute top-1 right-1 h-6 w-6 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={enviarMensagem} className="flex items-end gap-2 w-full">
            <input type="file" id="upload-anexo" onChange={handleFileChange} className="hidden" accept="image/*" multiple />
            <label 
              htmlFor="upload-anexo"
              className="h-12 w-12 flex items-center justify-center text-slate-500 hover:bg-slate-200/50 rounded-full transition-colors shrink-0 cursor-pointer"
            >
              <Paperclip className="h-6 w-6" />
            </label>
            
            <div className="flex-1 bg-white rounded-3xl shadow-sm px-4 py-1 flex items-center">
              <textarea 
                ref={textareaRef}
                rows={1}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem"
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 text-[16px] text-slate-800 placeholder:text-slate-500 min-h-[48px] max-h-[160px] custom-scrollbar"
              />
            </div>

            {podeEnviar ? (
              <button type="submit" className="h-12 w-12 flex items-center justify-center bg-[#4C6C54] text-white hover:bg-[#3a5340] rounded-full shadow-sm transition-all shrink-0">
                <Send className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <div className="h-12 w-12 flex items-center justify-center text-slate-400 bg-transparent shrink-0">
                 <Send className="h-5 w-5 ml-1 opacity-50" />
              </div>
            )}
          </form>
        </div>
      </div>

      {/* MODAL LIGHTBOX */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animation-fade-in" onClick={fecharLightbox}>
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
            <span className="text-white font-medium">{lightbox.index + 1} / {lightbox.urls.length}</span>
            <button onClick={fecharLightbox} className="text-white hover:text-slate-300 p-2"><X className="h-8 w-8" /></button>
          </div>
          {lightbox.index > 0 && <button onClick={fotoAnterior} className="absolute left-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white"><ChevronLeft className="h-8 w-8" /></button>}
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] m-4">
            <Image src={lightbox.urls[lightbox.index]} alt="Visualização" fill className="object-contain" />
          </div>
          {lightbox.index < lightbox.urls.length - 1 && <button onClick={proximaFoto} className="absolute right-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white"><ChevronRight className="h-8 w-8" /></button>}
        </div>
      )}
    </>
  );
}