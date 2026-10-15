"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Heart,
  Loader2,
  Search,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { criarPersonagemDoSRD } from "@/lib/compendio/criar-do-srd";
import { MONSTROS_SRD_5E, type SrdCreature } from "@/lib/compendio/srd-5e";
import { t } from "@/lib/i18n/personagens";
import { cn } from "@/lib/utils";

interface CompendioSrdDialogProps {
  aberto: boolean;
  onFechar: () => void;
  onCriado: (personagemId: string) => void;
}

export function CompendioSrdDialog({
  aberto,
  onFechar,
  onCriado,
}: CompendioSrdDialogProps) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<SrdCreature>(
    MONSTROS_SRD_5E[0] ?? null,
  );
  const [criando, setCriando] = useState(false);

  const monstrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return MONSTROS_SRD_5E;
    return MONSTROS_SRD_5E.filter(
      (m) =>
        m.name.toLowerCase().includes(termo) ||
        m.type.toLowerCase().includes(termo) ||
        m.cr.toLowerCase().includes(termo),
    );
  }, [busca]);

  async function handleCriar(monstro: SrdCreature) {
    if (criando) return;
    setCriando(true);
    try {
      const criado = await criarPersonagemDoSRD(monstro);
      toast.success(t.compendioSrd.criadoComSucesso(monstro.name));
      onCriado(criado.id);
      onFechar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.importarFicha.falhouCriar);
    } finally {
      setCriando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(abertoAgora) => !abertoAgora && onFechar()}>
      <DialogContent className="max-w-3xl sm:max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <DialogTitle>{t.compendioSrd.titulo}</DialogTitle>
          </div>
          <DialogDescription>{t.compendioSrd.subtitulo}</DialogDescription>
        </DialogHeader>

        {/* Barra de pesquisa */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={t.compendioSrd.buscar}
            className="pl-9"
          />
        </div>

        {/* Layout de duas colunas: Lista à esquerda e Ficha/Preview à direita */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 flex-1 min-h-[360px] overflow-hidden">
          {/* Coluna 1: Lista com Scroll */}
          <div className="md:col-span-2 border rounded-lg overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 max-h-[360px]">
              {monstrosFiltrados.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  {t.compendioSrd.nenhumEncontrado}
                </p>
              ) : (
                <div className="p-1 space-y-1">
                  {monstrosFiltrados.map((monstro) => {
                    const ativo = selecionado?.slug === monstro.slug;
                    return (
                      <button
                        key={monstro.slug}
                        type="button"
                        onClick={() => setSelecionado(monstro)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between text-sm",
                          ativo
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-accent text-foreground",
                        )}
                      >
                        <span className="truncate">{monstro.name}</span>
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-mono shrink-0 ml-2",
                            ativo
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          ND {monstro.cr}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Coluna 2: Detalhes do Monstro Selecionado */}
          <div className="md:col-span-3 border rounded-lg p-4 flex flex-col justify-between overflow-hidden bg-muted/20">
            {selecionado ? (
              <ScrollArea className="flex-1 pr-2 max-h-[300px]">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-bold">{selecionado.name}</h3>
                      <span className="text-xs text-muted-foreground italic">
                        ND {selecionado.cr}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selecionado.size} • {selecionado.type} • {selecionado.speed}
                    </p>
                  </div>

                  {/* CA e PV */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 rounded bg-background border p-2">
                      <Shield className="size-4 text-sky-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">CA</div>
                        <div className="font-semibold">{selecionado.ac}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded bg-background border p-2">
                      <Heart className="size-4 text-red-500" />
                      <div>
                        <div className="text-xs text-muted-foreground">PV</div>
                        <div className="font-semibold">{selecionado.maxHp}</div>
                      </div>
                    </div>
                  </div>

                  {/* Atributos */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {t.compendioSrd.atributos}
                    </h4>
                    <div className="grid grid-cols-6 gap-1 text-center">
                      {(
                        [
                          ["FOR", selecionado.abilities.str],
                          ["DES", selecionado.abilities.dex],
                          ["CON", selecionado.abilities.con],
                          ["INT", selecionado.abilities.int],
                          ["SAB", selecionado.abilities.wis],
                          ["CAR", selecionado.abilities.cha],
                        ] as const
                      ).map(([sigla, val]) => (
                        <div
                          key={sigla}
                          className="bg-background border rounded p-1"
                        >
                          <div className="text-[10px] text-muted-foreground">
                            {sigla}
                          </div>
                          <div className="text-xs font-bold">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações */}
                  {selecionado.actions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Zap className="size-3 text-amber-500" />
                        {t.compendioSrd.acoes}
                      </h4>
                      <div className="space-y-1.5">
                        {selecionado.actions.map((acao) => (
                          <div
                            key={acao.name}
                            className="text-xs rounded bg-background/80 border p-2"
                          >
                            <span className="font-semibold">{acao.name}: </span>
                            <span className="text-muted-foreground">
                              {acao.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : null}

            {/* Rodapé com botão de criação */}
            <div className="pt-3 mt-3 border-t flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                {t.compendioSrd.atencaoLicenca}
              </span>
              <Button
                disabled={!selecionado || criando}
                onClick={() => selecionado && void handleCriar(selecionado)}
                size="sm"
                className="gap-2"
              >
                {criando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <BookOpen className="size-4" />
                )}
                {criando ? t.compendioSrd.criando : t.compendioSrd.adicionar}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
