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
  
  // Estado para a Galeria em Tela Cheia (Lightbox)
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

  // Funções da Galeria Tela Cheia (Lightbox)
  const abrirLightbox = (urls: string[], index: number) => setLightbox({ urls, index });
  const fecharLightbox = () => setLightbox(null);
  const proximaFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightbox && lightbox.index < lightbox.urls.length - 1) {
      setLightbox({ ...lightbox, index: lightbox.index + 1 });
    }
  };
  const fotoAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightbox && lightbox.index > 0) {
      setLightbox({ ...lightbox, index: lightbox.index - 1 });
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animation-fade-in">
        
        {/* Cabeçalho */}
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

        {/* Histórico de Mensagens */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FA] scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          
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

              <div className={`p-4 rounded-2xl shadow-sm ${msg.remetente === 'mae' ? 'bg-[#4C6C54] text-white rounded-br-sm max-w-[95%] sm:max-w-[80%]' : 'bg-white border border-slate-100 rounded-bl-sm text-slate-700'}`}>
                
                {/* GRID INTELIGENTE ESTILO WHATSAPP */}
                {msg.anexos && msg.anexos.length > 0 && (
                  <div className={`grid gap-1 mb-2 ${msg.anexos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {msg.anexos.slice(0, 4).map((imgUrl, idx) => {
                      const total = msg.anexos!.length;
                      const isLastCell = idx === 3;
                      const hasMore = total > 4;
                      const remaining = total - 3;
                      
                      // Lógica de layout: Se tem 3 imagens, a primeira ocupa a linha inteira no topo
                      const isThirdLayoutTop = total === 3 && idx === 0;
                      const sizeClass = isThirdLayoutTop ? 'col-span-2 aspect-video' : (total === 1 ? 'h-48 sm:h-64' : 'aspect-square');

                      return (
                        <div 
                          key={idx} 
                          onClick={() => abrirLightbox(msg.anexos!, idx)}
                          className={`relative rounded-lg overflow-hidden border border-black/10 cursor-pointer group bg-black/5 ${sizeClass}`}
                        >
                          <Image src={imgUrl} alt="Anexo" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          
                          {/* Overlay Escuro com Número (Quando tem mais de 4 fotos) */}
                          {isLastCell && hasMore && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                              <span className="text-white text-2xl font-bold">+{remaining}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
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

        {/* Rodapé: Previews de Upload */}
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

          {/* Campo de Digitação */}
          <div className="p-4 sm:p-5">
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
            <p className="text-center text-[11px] font-medium text-slate-400 mt-3">
              As mensagens são protegidas com criptografia de ponta a ponta.
            </p>
          </div>
        </div>

      </div>

      {/* MODAL LIGHTBOX (TELA CHEIA) ESTILO WHATSAPP */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animation-fade-in"
          onClick={fecharLightbox}
        >
          {/* Top Bar Lightbox */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
            <span className="text-white font-medium text-sm">
              {lightbox.index + 1} de {lightbox.urls.length}
            </span>
            <button onClick={fecharLightbox} className="text-white/80 hover:text-white transition-colors p-2">
              <X className="h-8 w-8" />
            </button>
          </div>

          {/* Seta Esquerda */}
          {lightbox.index > 0 && (
            <button 
              onClick={fotoAnterior}
              className="absolute left-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Imagem Central */}
          <div className="relative w-full h-full max-w-5xl max-h-[85vh] m-4">
            <Image 
              src={lightbox.urls[lightbox.index]} 
              alt="Visualização ampliada" 
              fill 
              className="object-contain" 
            />
          </div>

          {/* Seta Direita */}
          {lightbox.index < lightbox.urls.length - 1 && (
            <button 
              onClick={proximaFoto}
              className="absolute right-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </>
  );
}