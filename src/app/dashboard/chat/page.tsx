"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Send, Paperclip, CheckCheck, MoreVertical, FileText, 
  ExternalLink, Download, Sparkles, X, ChevronLeft, ChevronRight 
} from "lucide-react";

interface ArquivoAnexo {
  id: string;
  nome: string;
  tamanho: string;
  tipo: "imagem" | "pdf" | "documento";
  url: string;
}

interface Mensagem {
  id: number;
  remetente: "nutri" | "usuario";
  texto?: string;
  arquivos?: ArquivoAnexo[];
  horario: string;
  dataEnvio?: string;
}

export default function PaginaChat() {
  const [mensagem, setMensagem] = useState("");
  const [arquivosPendentes, setArquivosPendentes] = useState<ArquivoAnexo[]>([]);
  const [imagemVisualizandoIndex, setImagemVisualizandoIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fimChatRef = useRef<HTMLDivElement>(null);

  const [conversas, setConversas] = useState<Mensagem[]>([
    {
      id: 1,
      remetente: "nutri",
      texto: "Olá, mãe! Vi que vocês preencheram o Diário Alimentar ontem. Como foi a aceitação do brócolis no jantar?",
      horario: "09:41",
      dataEnvio: "Hoje às 09:41"
    },
    {
      id: 2,
      remetente: "usuario",
      texto: "Bom dia, Dra! Ele cheirou e tocou no brócolis, mas na hora de colocar na boca ele chorou um pouco. Nós não forçamos, conforme combinamos.",
      horario: "10:15",
      dataEnvio: "Hoje às 10:15"
    }
  ]);

  const atalhosMensagem = [
    "Dúvida sobre a porção",
    "Houve recusa no jantar",
    "Aceitou novo vegetal hoje! 🎉"
  ];

  // Rola suavemente para a última mensagem
  useEffect(() => {
    fimChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversas]);

  // Captura todas as imagens trocadas no chat para montar o carrossel da galeria
  const todasImagensGaleria = useMemo(() => {
    const lista: { arq: ArquivoAnexo; remetente: string; dataEnvio: string }[] = [];
    conversas.forEach((msg) => {
      if (msg.arquivos) {
        msg.arquivos.forEach((arq) => {
          if (arq.tipo === "imagem") {
            lista.push({
              arq,
              remetente: msg.remetente === "usuario" ? "Você" : "Dra. Laís Leles",
              dataEnvio: msg.dataEnvio || msg.horario
            });
          }
        });
      }
    });
    return lista;
  }, [conversas]);

  // Teclado para fechar ou navegar na galeria
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imagemVisualizandoIndex === null) return;
      if (e.key === "Escape") setImagemVisualizandoIndex(null);
      if (e.key === "ArrowLeft" && imagemVisualizandoIndex > 0) {
        setImagemVisualizandoIndex(imagemVisualizandoIndex - 1);
      }
      if (e.key === "ArrowRight" && imagemVisualizandoIndex < todasImagensGaleria.length - 1) {
        setImagemVisualizandoIndex(imagemVisualizandoIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imagemVisualizandoIndex, todasImagensGaleria.length]);

  // Efeito sonoro suave de envio
  const tocarSomEnvio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Ignora erro em browsers restritivos
    }
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const obterTipoArquivo = (arquivo: File): "imagem" | "pdf" | "documento" => {
    if (arquivo.type.startsWith("image/")) return "imagem";
    if (arquivo.type === "application/pdf" || arquivo.name.toLowerCase().endsWith(".pdf")) return "pdf";
    return "documento";
  };

  const handleSelecionarArquivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const novosArquivos: ArquivoAnexo[] = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      nome: file.name,
      tamanho: formatarTamanho(file.size),
      tipo: obterTipoArquivo(file),
      url: URL.createObjectURL(file)
    }));

    setArquivosPendentes((prev) => [...prev, ...novosArquivos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removerArquivoPendente = (id: string) => {
    setArquivosPendentes((prev) => prev.filter((arq) => arq.id !== id));
  };

  const handleEnviar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mensagem.trim() && arquivosPendentes.length === 0) return;

    const agora = new Date();
    const horarioFormatado = agora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const novaMensagem: Mensagem = {
      id: Date.now(),
      remetente: "usuario",
      texto: mensagem.trim() || undefined,
      arquivos: arquivosPendentes.length > 0 ? [...arquivosPendentes] : undefined,
      horario: horarioFormatado,
      dataEnvio: `Hoje às ${horarioFormatado}`
    };

    setConversas((prev) => [...prev, novaMensagem]);
    setMensagem("");
    setArquivosPendentes([]);
    tocarSomEnvio();
  };

  const abrirGaleriaNaFoto = (url: string) => {
    const index = todasImagensGaleria.findIndex((item) => item.arq.url === url);
    if (index !== -1) setImagemVisualizandoIndex(index);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-68px)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animation-fade-in relative">
      
      {/* CABEÇALHO */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#4C6C54] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            DL
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              Dra. Laís Leles
              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Nutricionista Clínica • <span className="text-emerald-600 font-semibold">Responde em até 2h</span>
            </p>
          </div>
        </div>

        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/50">
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            Hoje
          </span>
        </div>

        {conversas.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-end gap-2 ${msg.remetente === "usuario" ? "justify-end" : "justify-start"}`}
          >
            {msg.remetente === "nutri" && (
              <div className="w-7 h-7 rounded-full bg-[#4C6C54] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mb-0.5 shadow-2xs">
                DL
              </div>
            )}

            <div className="space-y-1.5 max-w-[85%] sm:max-w-[70%]">
              
              {/* ARQUIVOS ANEXADOS */}
              {msg.arquivos && msg.arquivos.map((arq) => {
                // TRATAMENTO ESTILO WHATSAPP PARA IMAGENS
                if (arq.tipo === "imagem") {
                  return (
                    <div 
                      key={arq.id} 
                      onClick={() => abrirGaleriaNaFoto(arq.url)}
                      className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-200/80 cursor-pointer group max-w-[280px] bg-slate-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={arq.url} 
                        alt="Imagem enviada" 
                        className="w-full h-auto max-h-80 object-cover group-hover:scale-102 transition-transform duration-200" 
                      />
                      
                      {/* Selo de Horário e Confirmação no Canto Inferior Direito */}
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-xs flex items-center gap-1 text-[10px] text-white font-medium">
                        <span>{msg.horario}</span>
                        {msg.remetente === "usuario" && <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  );
                }

                // TRATAMENTO PARA DOCUMENTOS E PDFS
                return (
                  <div 
                    key={arq.id} 
                    className="w-64 sm:w-72 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    <div className="h-20 w-full bg-gradient-to-br from-slate-100 to-slate-200/80 flex items-center justify-center border-b border-slate-100">
                      <div className="p-2.5 bg-white/95 rounded-xl shadow-xs text-slate-600 flex items-center gap-2 max-w-[85%]">
                        <FileText className={`h-5 w-5 shrink-0 ${arq.tipo === "pdf" ? "text-red-500" : "text-[#2A546D]"}`} />
                        <span className="text-[11px] font-bold truncate">{arq.nome}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                          arq.tipo === "pdf" 
                            ? "bg-red-50 text-red-600 border border-red-200" 
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {arq.tipo === "pdf" ? "PDF" : "DOC"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate" title={arq.nome}>
                            {arq.nome}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium">{arq.tamanho}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-slate-100 text-center divide-x divide-slate-100 bg-slate-50/70">
                      <a 
                        href={arq.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="py-2 text-xs font-bold text-[#4C6C54] hover:bg-[#4C6C54]/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Ver
                      </a>
                      <a 
                        href={arq.url} 
                        download={arq.nome}
                        className="py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" /> Salvar como...
                      </a>
                    </div>
                  </div>
                );
              })}

              {/* TEXTO DA MENSAGEM */}
              {msg.texto && (
                <div 
                  className={`p-3.5 rounded-2xl space-y-1 shadow-xs ${
                    msg.remetente === "usuario"
                      ? "bg-emerald-50 border border-emerald-100 text-slate-800 rounded-tr-xs"
                      : "bg-white border border-slate-100 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  <p className="text-xs leading-relaxed font-medium">{msg.texto}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400">
                    <span>{msg.horario}</span>
                    {msg.remetente === "usuario" && <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                </div>
              )}

            </div>
          </div>
        ))}
        <div ref={fimChatRef} />
      </div>

      {/* RODAPÉ DO CHAT */}
      <div className="border-t border-slate-100 bg-white shrink-0">
        
        {/* PRÉVIA DE ANEXOS ANTES DO ENVIO */}
        {arquivosPendentes.length > 0 && (
          <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex items-center gap-3 overflow-x-auto animation-fade-in">
            {arquivosPendentes.map((arq) => (
              <div 
                key={arq.id} 
                className="relative bg-white border border-slate-200 rounded-2xl p-2 flex items-center gap-2.5 shrink-0 shadow-xs max-w-[220px]"
              >
                {arq.tipo === "imagem" ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={arq.url} alt={arq.nome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#2A546D] flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0 pr-4">
                  <p className="text-xs font-bold text-slate-800 truncate" title={arq.nome}>{arq.nome}</p>
                  <span className="text-[10px] text-slate-400">{arq.tamanho}</span>
                </div>

                <button
                  type="button"
                  onClick={() => removerArquivoPendente(arq.id)}
                  className="absolute -top-1.5 -right-1.5 bg-slate-800 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors cursor-pointer"
                  title="Cancelar este anexo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 space-y-2.5">
          {/* SUGESTÕES (PREENCHE O INPUT AO CLICAR) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <Sparkles className="h-3 w-3 text-[#EAA345]" /> Sugestões:
            </span>
            {atalhosMensagem.map((texto) => (
              <button
                key={texto}
                type="button"
                onClick={() => setMensagem(texto)}
                className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer"
              >
                {texto}
              </button>
            ))}
          </div>

          {/* BARRA DE DIGITAÇÃO */}
          <form onSubmit={handleEnviar} className="flex items-center gap-2">
            <input 
              type="file"
              ref={fileInputRef}
              multiple
              onChange={handleSelecionarArquivos}
              className="hidden"
            />

            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              title="Anexar arquivos"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <input 
              type="text"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder={arquivosPendentes.length > 0 ? "Adicione uma legenda ou envie os arquivos..." : "Escreva sua mensagem para a Dra. Laís..."}
              className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#EAA345] focus:bg-white"
            />

            <button 
              type="submit"
              disabled={!mensagem.trim() && arquivosPendentes.length === 0}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all shadow-xs shrink-0 ${
                mensagem.trim() || arquivosPendentes.length > 0
                  ? "bg-[#EAA345] hover:bg-[#d89234] text-white cursor-pointer" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

      {/* MODAL DE GALERIA ESTILO WHATSAPP */}
      {imagemVisualizandoIndex !== null && todasImagensGaleria[imagemVisualizandoIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animation-fade-in text-white select-none">
          
          {/* CABEÇALHO SUPERIOR DA GALERIA */}
          <div className="flex items-center justify-between px-2 sm:px-6 py-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#4C6C54] text-white flex items-center justify-center font-bold text-xs">
                DL
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">
                  {todasImagensGaleria[imagemVisualizandoIndex].remetente}
                </h3>
                <p className="text-[11px] text-white/60">
                  {todasImagensGaleria[imagemVisualizandoIndex].dataEnvio}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a 
                href={todasImagensGaleria[imagemVisualizandoIndex].arq.url}
                download={todasImagensGaleria[imagemVisualizandoIndex].arq.nome}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Baixar imagem"
              >
                <Download className="h-5 w-5" />
              </a>
              <button 
                type="button" 
                onClick={() => setImagemVisualizandoIndex(null)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Fechar visualizador (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ÁREA CENTRAL: IMAGEM EM DESTAQUE E SETAS */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2">
            {imagemVisualizandoIndex > 0 && (
              <button 
                type="button" 
                onClick={() => setImagemVisualizandoIndex(imagemVisualizandoIndex - 1)}
                className="absolute left-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer"
                title="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={todasImagensGaleria[imagemVisualizandoIndex].arq.url} 
              alt={todasImagensGaleria[imagemVisualizandoIndex].arq.nome} 
              className="max-h-[72vh] max-w-[85vw] object-contain rounded-lg shadow-2xl transition-all duration-200"
            />

            {imagemVisualizandoIndex < todasImagensGaleria.length - 1 && (
              <button 
                type="button" 
                onClick={() => setImagemVisualizandoIndex(imagemVisualizandoIndex + 1)}
                className="absolute right-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer"
                title="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* CARROSSEL HORIZONTAL DE MINIATURAS NO RODAPÉ */}
          <div className="h-20 shrink-0 flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 bg-black/60 rounded-2xl max-w-2xl mx-auto w-full border border-white/10">
            {todasImagensGaleria.map((item, idx) => (
              <button 
                key={item.arq.id} 
                type="button" 
                onClick={() => setImagemVisualizandoIndex(idx)}
                className={`h-14 w-14 rounded-xl overflow-hidden shrink-0 transition-all cursor-pointer ${
                  idx === imagemVisualizandoIndex 
                    ? "ring-2 ring-emerald-500 scale-105 opacity-100" 
                    : "opacity-40 hover:opacity-80"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.arq.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}