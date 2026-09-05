"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, MoreVertical, CheckCheck, UserCircle, X, ChevronLeft, ChevronRight, FileText, Download, Eye } from "lucide-react";
import Image from "next/image";

type Anexo = {
  url: string;
  isImage: boolean;
  name: string;
  size: string;
};

type Mensagem = {
  id: string;
  remetente: 'nutri' | 'mae';
  texto: string;
  hora: string;
  anexos?: Anexo[];
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ChatPage() {
  const [mensagem, setMensagem] = useState("");
  const [arquivosSelecionados, setArquivosSelecionados] = useState<{ file: File; anexo: Anexo }[]>([]);
  const [lightbox, setLightbox] = useState<{ urls: string[], index: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [mensagensChat, setMensagensChat] = useState<Mensagem[]>([
    {
      id: '1',
      remetente: 'nutri',
      texto: 'Olá, mãe! Vi que vocês preencheram o Diário Alimentar ontem. Como foi a aceitação do brócolis no jantar?',
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

  const handleAttachmentClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const novosArquivos = Array.from(e.target.files).map(file => ({
        file,
        anexo: {
          url: URL.createObjectURL(file),
          isImage: file.type.startsWith('image/'),
          name: file.name,
          size: formatBytes(file.size)
        }
      }));
      setArquivosSelecionados(prev => [...prev, ...novosArquivos]);
    }
    if (e.target) e.target.value = '';
  };

  const removerAnexo = (indexToRemove: number) => {
    setArquivosSelecionados(prev => {
      URL.revokeObjectURL(prev[indexToRemove].anexo.url);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const enviarMensagem = () => {
    if (!mensagem.trim() && arquivosSelecionados.length === 0) return;

    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      remetente: 'mae',
      texto: mensagem.trim(),
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      anexos: arquivosSelecionados.length > 0 ? arquivosSelecionados.map(a => a.anexo) : undefined
    };

    setMensagensChat(prev => [...prev, novaMensagem]);
    setMensagem("");
    setArquivosSelecionados([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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

  const podeEnviar = mensagem.trim().length > 0 || arquivosSelecionados.length > 0;

  return (
    <>
      <div className="-m-4 md:-m-8 h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-[#EFECE5] relative animation-fade-in">
        
        <header className="flex items-center justify-between px-6 sm:px-8 py-4 bg-[#f0f2f5] z-10 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
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

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/20 [&::-webkit-scrollbar-track]:bg-transparent">
          
          <div className="flex justify-center mb-6">
            <span className="text-xs font-bold text-slate-500 bg-[#e1e2e3] px-4 py-1.5 rounded-lg shadow-sm uppercase tracking-wider">
              Hoje
            </span>
          </div>

          {mensagensChat.map((msg) => {
            const imagens = msg.anexos?.filter(a => a.isImage) || [];
            const documentos = msg.anexos?.filter(a => !a.isImage) || [];

            return (
              <div key={msg.id} className={`flex ${msg.remetente === 'mae' ? 'justify-end' : 'items-end gap-3 max-w-[95%] sm:max-w-[80%]'}`}>
                
                {msg.remetente === 'nutri' && (
                  <div className="h-10 w-10 bg-white shadow-sm rounded-full flex items-center justify-center text-[#4C6C54] shrink-0 mb-1 hidden sm:flex">
                    <UserCircle className="h-6 w-6" />
                  </div>
                )}

                <div className={`p-3 sm:p-4 rounded-xl shadow-sm ${msg.remetente === 'mae' ? 'bg-[#d9fdd3] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                  
                  {/* DOCUMENTOS */}
                  {documentos.length > 0 && (
                    <div className="space-y-2 mb-2 w-[260px] sm:w-[320px] md:w-[400px]">
                      {documentos.map((doc, idx) => (
                        <div key={idx} className="bg-black/5 rounded-xl overflow-hidden border border-black/10">
                          <div className="p-3 flex items-center gap-3 bg-white/50">
                            <div className="h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                              <span className="text-sm font-extrabold uppercase">PDF</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-semibold truncate text-slate-800" title={doc.name}>{doc.name}</p>
                              <p className="text-[13px] text-slate-500 mt-0.5">{doc.size} • Documento</p>
                            </div>
                          </div>
                          <div className="bg-black/5 px-4 py-2.5 flex justify-between items-center text-sm font-semibold text-slate-600 border-t border-black/5">
                             <a href={doc.url} target="_blank" rel="noreferrer" className="hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"><Eye className="h-4 w-4"/> Ver</a>
                             {/* Tag A com propriedade Download faz o download nativo */}
                             <a href={doc.url} download={doc.name} className="hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"><Download className="h-4 w-4"/> Salvar como...</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* IMAGENS */}
                  {imagens.length > 0 && (
                    <div className={`grid gap-1 mb-2 w-[260px] sm:w-[320px] md:w-[450px] ${imagens.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {imagens.slice(0, 4).map((img, idx) => {
                        const total = imagens.length;
                        const isThirdLayoutTop = total === 3 && idx === 0;
                        const sizeClass = isThirdLayoutTop ? 'col-span-2 aspect-video' : (total === 1 ? 'h-64 sm:h-96' : 'h-32 sm:h-56');

                        return (
                          <div key={idx} onClick={() => abrirLightbox(imagens.map(i => i.url), idx)} className={`relative rounded-lg overflow-hidden cursor-pointer group bg-black/5 ${sizeClass}`}>
                            <Image src={img.url} alt="Anexo" fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            {idx === 3 && total > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                <span className="text-white text-3xl font-bold">+{total - 4}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.texto && <p className="text-[16px] leading-relaxed whitespace-pre-wrap px-1">{msg.texto}</p>}
                  
                  <div className={`flex items-center gap-1 mt-1 ${msg.remetente === 'mae' ? 'justify-end' : 'justify-end'}`}>
                    <span className="text-[11px] font-medium text-slate-400">{msg.hora}</span>
                    {msg.remetente === 'mae' && <CheckCheck className="h-4 w-4 text-blue-500" />}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        <div className="bg-[#f0f2f5] px-4 py-3 shrink-0">
          
          {arquivosSelecionados.length > 0 && (
            <div className="px-4 py-3 mb-3 bg-white rounded-2xl flex flex-wrap gap-3 shadow-sm max-h-40 overflow-y-auto">
              {arquivosSelecionados.map((item, index) => (
                <div key={index} className="relative group">
                  {item.anexo.isImage ? (
                    <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 relative">
                      <Image src={item.anexo.url} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center p-2 text-center">
                      <FileText className="h-8 w-8 text-red-500 mb-1" />
                      <span className="text-[10px] font-bold text-slate-600 truncate w-full px-1" title={item.anexo.name}>{item.anexo.name}</span>
                    </div>
                  )}
                  <button onClick={() => removerAnexo(index)} className="absolute -top-2 -right-2 h-6 w-6 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors shadow-md">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 max-w-6xl mx-auto w-full">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" multiple />
            <button onClick={handleAttachmentClick} className="h-12 w-12 flex items-center justify-center text-slate-500 hover:text-[#4C6C54] hover:bg-black/5 rounded-full transition-colors shrink-0" title="Anexar arquivo">
              <Paperclip className="h-6 w-6" />
            </button>
            
            <div className="flex-1 bg-white rounded-3xl shadow-sm px-5 py-1.5 flex items-center focus-within:ring-2 focus-within:ring-[#4C6C54]/50 transition-all">
              <textarea 
                ref={textareaRef} rows={1} value={mensagem} onChange={(e) => setMensagem(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escreva sua mensagem..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-2.5 text-[16px] text-slate-800 placeholder:text-slate-500 min-h-[44px] max-h-[200px] custom-scrollbar"
              />
            </div>

            {podeEnviar ? (
              <button onClick={enviarMensagem} className="h-12 w-12 flex items-center justify-center bg-[#4C6C54] text-white hover:bg-[#3a5340] rounded-full shadow-sm transition-all shrink-0 hover:scale-105">
                <Send className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <div className="h-12 w-12 flex items-center justify-center text-slate-400 bg-transparent shrink-0"><Send className="h-5 w-5 ml-1 opacity-50" /></div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL LIGHTBOX COM ROLETA (CAROUSEL) INFERIOR */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animation-fade-in" onClick={fecharLightbox}>
          
          {/* Top Bar do Lightbox */}
          <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-20">
            <span className="text-white font-medium text-lg ml-2">{lightbox.index + 1} / {lightbox.urls.length}</span>
            <div className="flex items-center gap-2">
              <a href={lightbox.urls[lightbox.index]} download={`Nutrindo-em-Casa-Anexo-${lightbox.index + 1}.jpg`} onClick={(e) => e.stopPropagation()} className="text-white/80 hover:text-white transition-colors p-2" title="Baixar Imagem">
                <Download className="h-6 w-6" />
              </a>
              <button onClick={fecharLightbox} className="text-white/80 hover:text-white transition-colors p-2" title="Fechar">
                <X className="h-8 w-8" />
              </button>
            </div>
          </div>

          {/* Área Central (Imagem + Setas) */}
          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-16">
            {lightbox.index > 0 && (
              <button onClick={fotoAnterior} className="absolute left-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white transition-colors">
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}
            
            <div className="relative w-full h-full max-w-5xl">
              <Image src={lightbox.urls[lightbox.index]} alt="Visualização" fill className="object-contain" />
            </div>

            {lightbox.index < lightbox.urls.length - 1 && (
              <button onClick={proximaFoto} className="absolute right-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/80 text-white transition-colors">
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
          </div>

          {/* Roleta de Fotos (Thumbnail Slider) Estilo WhatsApp */}
          <div className="absolute bottom-6 w-full flex justify-center z-20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 overflow-x-auto max-w-full px-4 custom-scrollbar pb-2">
              {lightbox.urls.map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setLightbox({ ...lightbox, index: idx })}
                  className={`relative h-14 w-14 shrink-0 rounded-md overflow-hidden border-2 transition-all duration-200 ease-in-out ${
                    idx === lightbox.index 
                      ? 'border-green-500 scale-110 opacity-100 shadow-lg' 
                      : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  <Image src={url} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </>
  );
}