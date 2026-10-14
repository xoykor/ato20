"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Globe, QrCode, Shield, WifiOff } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCampaignStore } from "@/lib/store/use-campaign-store";
import { daemonAddr, type RedeInterface } from "@/lib/vault/bridge";
import { cn } from "@/lib/utils";

/**
 * Como a mesa entra.
 *
 * Substitui o crachá de convite que existia com o Supabase, e o problema é
 * outro: lá o link era um domínio estável e o que faltava era o código; aqui o
 * endereço é o IP desta máquina na rede local (ou na LAN VPN), que ninguém decora.
 *
 * As duas abas resolvem isso de formas diferentes porque os dois aparelhos são
 * diferentes. O CELULAR tem câmera: o QR leva endereço e código de uma vez, e
 * ninguém digita nada. A TV não tem câmera — o que existe ali é um navegador e
 * um controle remoto —, então a aba dela mostra o endereço grande, para ser
 * lido do outro lado da sala e digitado. O QR que estava ali era uma imagem que
 * a TV não tem como usar.
 *
 * O código vai no endereço nos dois casos, e é por isso que não há nenhum campo
 * de código em lugar nenhum.
 */
/** As duas portas da mesa: o celular de quem joga, e a TV que todos veem. */
type Aba = "jogador" | "espectador";

const CHAVE_STORAGE_ESCOLHA = "ato20:rede-convite:escolha";
const CHAVE_STORAGE_HOST = "ato20:rede-convite:host";

function normalizarUrl(hostOuIp: string, portaPadrao: number): string {
  const limpo = hostOuIp.trim();
  if (!limpo) return "";
  if (limpo.startsWith("http://") || limpo.startsWith("https://")) {
    return limpo.replace(/\/+$/, "");
  }
  if (limpo.includes(":")) {
    return `http://${limpo}`;
  }
  return `http://${limpo}:${portaPadrao}`;
}

export function TableInvite() {
  const campaign = useCampaignStore((state) => state.campaign);
  const [lanUrl, setLanUrl] = useState<string | null>(null);
  const [interfaces, setInterfaces] = useState<RedeInterface[]>([]);
  const [porta, setPorta] = useState<number>(20200);
  const [escolhaRede, setEscolhaRede] = useState<string>("auto");
  const [hostManual, setHostManual] = useState<string>("");
  const [aba, setAba] = useState<Aba>("jogador");
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;

    try {
      const salva = localStorage.getItem(CHAVE_STORAGE_ESCOLHA);
      if (salva) setEscolhaRede(salva);
      const hostSalvo = localStorage.getItem(CHAVE_STORAGE_HOST);
      if (hostSalvo) setHostManual(hostSalvo);
    } catch {
      // Ignora erro de localStorage
    }

    void daemonAddr(true).then(
      (info) => {
        if (!ativo) return;

        setLanUrl(info.lanUrl);
        setInterfaces(info.interfaces ?? []);
        if (info.port) setPorta(info.port);
        setCarregado(true);
      },
      () => {
        if (ativo) setCarregado(true);
      },
    );

    return () => {
      ativo = false;
    };
  }, []);

  const salvarEscolha = (novaEscolha: string) => {
    setEscolhaRede(novaEscolha);
    try {
      localStorage.setItem(CHAVE_STORAGE_ESCOLHA, novaEscolha);
    } catch {
      // Ignora falha de localStorage
    }
  };

  const salvarHostManual = (novoHost: string) => {
    setHostManual(novoHost);
    try {
      localStorage.setItem(CHAVE_STORAGE_HOST, novoHost);
    } catch {
      // Ignora falha de localStorage
    }
  };

  if (!campaign || !carregado) return null;

  // Calcula a URL ativa com base na seleção
  let urlAtiva: string | null = null;
  let tipoAtivo: "local" | "vpn" | "personalizado" | "outro" = "local";

  if (escolhaRede === "personalizado") {
    tipoAtivo = "personalizado";
    if (hostManual.trim()) {
      urlAtiva = normalizarUrl(hostManual, porta);
    }
  } else if (escolhaRede !== "auto") {
    const iface = interfaces.find((i) => i.ip === escolhaRede);
    if (iface) {
      urlAtiva = `http://${iface.ip}:${porta}`;
      tipoAtivo = iface.tipo as "local" | "vpn" | "outro";
    }
  }

  // Se não foi resolvida ainda, cai no lanUrl padrão ou primeira interface disponível
  if (!urlAtiva) {
    if (lanUrl) {
      urlAtiva = lanUrl;
      const ifaceEquivalente = interfaces.find((i) => lanUrl.includes(i.ip));
      if (ifaceEquivalente) {
        tipoAtivo = ifaceEquivalente.tipo as "local" | "vpn" | "outro";
      }
    } else if (interfaces.length > 0) {
      urlAtiva = `http://${interfaces[0].ip}:${porta}`;
      tipoAtivo = interfaces[0].tipo as "local" | "vpn" | "outro";
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            {tipoAtivo === "vpn" ? (
              <Shield className="text-primary size-4" />
            ) : urlAtiva ? (
              <QrCode />
            ) : (
              <WifiOff className="text-muted-foreground size-4" />
            )}
            <span className="hidden lg:inline">Entrar na mesa</span>
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogTitle>Entrar na mesa</DialogTitle>
        <DialogDescription>
          {aba === "jogador"
            ? "Aponte a câmera do celular para o quadrado."
            : "Digite este endereço no navegador da TV."}
        </DialogDescription>

        {/* Seletor de interface de rede (Wi-Fi, VPNs como Tailscale/ZeroTier ou host manual) */}
        {(interfaces.length > 1 || !lanUrl || escolhaRede === "personalizado") && (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-2.5 text-xs">
            <div className="flex items-center justify-between font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5">
                {tipoAtivo === "vpn" ? (
                  <Shield className="size-3.5 text-primary" />
                ) : (
                  <Globe className="size-3.5" />
                )}
                Rede do convite:
              </span>
              {tipoAtivo === "vpn" && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  LAN VPN
                </span>
              )}
            </div>

            <select
              value={escolhaRede}
              onChange={(e) => salvarEscolha(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {lanUrl && (
                <option value="auto">
                  Padrão do sistema ({lanUrl.replace(/^http:\/\//, "")})
                </option>
              )}
              {interfaces.map((iface) => (
                <option key={iface.ip} value={iface.ip}>
                  {iface.rotulo}
                </option>
              ))}
              <option value="personalizado">✏️ Personalizado (Hostname / IP)...</option>
            </select>

            {escolhaRede === "personalizado" && (
              <div className="space-y-1 pt-1">
                <Input
                  placeholder="ex: 100.85.20.10 ou meupc.ts.net"
                  value={hostManual}
                  onChange={(e) => salvarHostManual(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Informe o IP da VPN ou hostname atribuído a este computador.
                </p>
              </div>
            )}

            {tipoAtivo === "vpn" && (
              <p className="text-[11px] text-muted-foreground">
                Os jogadores devem estar conectados à mesma VPN (Tailscale, ZeroTier, Hamachi, etc.).
              </p>
            )}
          </div>
        )}

        {urlAtiva ? (
          <Tabs
            value={aba}
            onValueChange={(valor) => setAba(valor as Aba)}
            className="min-w-0 gap-3"
          >
            <TabsList>
              <TabsTrigger value="jogador">Jogador</TabsTrigger>
              <TabsTrigger value="espectador">TV</TabsTrigger>
            </TabsList>

            <TabsContent value="jogador" className="min-w-0 space-y-3">
              <Alvo url={`${urlAtiva}/jogador?code=${campaign.codigo}`} />
            </TabsContent>

            <TabsContent value="espectador" className="min-w-0 space-y-3">
              <Endereco
                url={`${urlAtiva}/espectador?code=${campaign.codigo}`}
                grande
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Nenhuma rede detectada</p>
            <p className="mt-1">
              Selecione <strong>Personalizado</strong> acima e digite o IP ou hostname da sua VPN.
            </p>
          </div>
        )}

        <p className="text-muted-foreground/60 border-t pt-3 text-xs">
          {tipoAtivo === "vpn"
            ? "Conexão via rede virtual (VPN). O código da sala protege o acesso ao vivo."
            : "Vale só na mesma rede. O código evita a entrada por acaso, não alguém decidido no seu Wi-Fi."}
        </p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * O QR de um endereço, com o endereço legível embaixo.
 *
 * Só para o CELULAR. O QR existe porque o endereço é o IP desta máquina na rede
 * local, que ninguém decora e ninguém deveria digitar num teclado de vidro — a
 * câmera resolve isso. A TV não tem câmera, e lá o mesmo quadrado seria uma
 * imagem que ninguém consegue usar; ver a aba dela.
 */
function Alvo({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    void QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      // Claro sempre, e não seguindo o tema: quem lê é a câmera de um celular,
      // e QR invertido é o caso que mais falha em leitor.
      color: { dark: "#000000ff", light: "#ffffffff" },
    }).then(
      (gerado) => {
        if (ativo) setDataUrl(gerado);
      },
      () => {
        // Sem QR a mesa ainda entra pelo endereço escrito abaixo.
        if (ativo) setDataUrl(null);
      },
    );

    return () => {
      ativo = false;
    };
  }, [url]);

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-3">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`QR code para ${url}`}
          className="size-48 rounded-md bg-white p-2"
        />
      ) : (
        <div className="bg-muted size-48 animate-pulse rounded-md" />
      )}

      <Endereco url={url} />
    </div>
  );
}

/**
 * O endereço escrito, e o botão de copiá-lo.
 *
 * Separado do QR porque a aba da TV usa só isto. `grande` é o tamanho de quem
 * vai LER e digitar de longe — na aba do celular o endereço é a legenda de
 * baixo do QR, e ninguém o digita.
 */
function Endereco({ url, grande }: { url: string; grande?: boolean }) {
  const [copiado, setCopiado] = useState(false);

  // `min-w-0` em cada degrau da cadeia — aqui, no `Tabs`, no `TabsContent`:
  // item de flex e de grid tem `min-width: auto`, que é o tamanho do CONTEÚDO,
  // e um endereço que não cabe empurrava a caixa para fora do diálogo em vez de
  // rolar dentro dela.
  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2">
      <code
        className={cn(
          // `block`: `<code>` é inline, e em elemento inline `overflow` e
          // `width` não valem nada. Era o que fazia a linha vazar o diálogo.
          "block w-full min-w-0 text-center select-all",
          grande
            ? // Uma LINHA só, com rolagem lateral se não couber -- e não quebra
              // por caractere. Quebrando, "espectador" virava "assist" numa linha
              // e "ir" na outra, e quem está copiando isso para o controle da TV
              // lê dois pedaços e digita um deles errado.
              // `scroll-fade-x`: a linha não cabe, e cortada a seco ela
              // parecia um endereço que termina ali. Desbotando na borda,
              // ela diz que continua -- e continua rolando.
              "bg-muted rolagem-limpa scroll-fade-x overflow-x-auto rounded-md px-3 py-2 text-left text-sm whitespace-nowrap"
            : "text-muted-foreground text-xs break-all",
        )}
      >
        {url}
      </code>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          void navigator.clipboard.writeText(url).then(
            () => setCopiado(true),
            // `clipboard` exige contexto seguro; em HTTP na rede local ele
            // falha, e o endereço continua legível na tela.
            () => setCopiado(false),
          );
        }}
      >
        {copiado ? <Check /> : <Copy />}
        {copiado ? "Copiado" : "Copiar endereço"}
      </Button>
    </div>
  );
}
