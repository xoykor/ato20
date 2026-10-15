import { formatarMetros, METROS_POR_QUADRADO } from "@/lib/geometry/grid";
import {
  tokensAtingidos,
  type MoldeDeMagia,
} from "@/lib/geometry/templates-de-magia";
import type { Vec } from "@/lib/geometry/transform";
import {
  ABERTURA_CONE_PADRAO,
  type CanvasItem,
  type Regua,
  type SceneGrid,
} from "@/types/scene";

/**
 * Converte uma régua em molde de magia geométrico para cálculo de colisão com tokens.
 */
export function reguaParaMolde(medidor: Regua, grid: SceneGrid): MoldeDeMagia {
  const dx = medidor.x2 - medidor.x;
  const dy = medidor.y2 - medidor.y;
  const alcance = Math.hypot(dx, dy);
  const direcaoGraus = (Math.atan2(dy, dx) * 180) / Math.PI;

  switch (medidor.forma) {
    case "circulo":
      return {
        id: medidor.id,
        formato: "circulo",
        origem: { x: medidor.x, y: medidor.y },
        alcance,
      };
    case "cone":
      return {
        id: medidor.id,
        formato: "cone",
        origem: { x: medidor.x, y: medidor.y },
        alcance,
        direcaoGraus,
        aberturaGraus: aberturaDoCone(medidor),
      };
    case "retangulo": {
      const caixa = caixaDoRetangulo(medidor);
      return {
        id: medidor.id,
        formato: "cubo",
        origem: {
          x: caixa.x + caixa.width / 2,
          y: caixa.y + caixa.height / 2,
        },
        alcance: Math.max(caixa.width, caixa.height),
        largura: caixa.width,
      };
    }
    case "linha":
    default:
      return {
        id: medidor.id,
        formato: "linha",
        origem: { x: medidor.x, y: medidor.y },
        alcance,
        direcaoGraus,
        largura: grid.size,
      };
  }
}

/**
 * O que um medidor mede, em metros, pronto para a etiqueta.
 * Se houver tokens na cena, detecta quais estão na área de efeito e exibe o número de alvos.
 */
export function rotuloDoMedidor(
  medidor: Regua,
  grid: SceneGrid,
  itens?: readonly CanvasItem[],
): string {
  const metro = grid.size / METROS_POR_QUADRADO;
  const dx = medidor.x2 - medidor.x;
  const dy = medidor.y2 - medidor.y;
  const comprimento = Math.hypot(dx, dy) / metro;

  let base = "";
  switch (medidor.forma) {
    case "linha":
      base = formatarMetros(comprimento);
      break;
    case "circulo":
      base = `r ${formatarMetros(comprimento)} · ${formatarArea(Math.PI * comprimento ** 2)}`;
      break;
    case "cone": {
      const abertura = aberturaDoCone(medidor);
      const area = (comprimento ** 2 * ((abertura * Math.PI) / 180)) / 2;
      base = `${formatarMetros(comprimento)} · ${abertura}° · ${formatarArea(area)}`;
      break;
    }
    case "retangulo": {
      const largura = Math.abs(dx) / metro;
      const altura = Math.abs(dy) / metro;
      base = `${formatarLado(largura)} × ${formatarMetros(altura)} · ${formatarArea(largura * altura)}`;
      break;
    }
  }

  if (itens && itens.length > 0) {
    const molde = reguaParaMolde(medidor, grid);
    const atingidos = tokensAtingidos(itens, molde);
    if (atingidos.length > 0) {
      return `${base} · ${atingidos.length} ${atingidos.length === 1 ? "alvo" : "alvos"}`;
    }
  }

  return base;
}

/** Metros quadrados: um decimal até 10, inteiro acima, como `formatarMetros`. */
export function formatarArea(metros2: number): string {
  return metros2 < 10 ? `${metros2.toFixed(1)} m²` : `${Math.round(metros2)} m²`;
}

/** Um lado do retângulo, sem a unidade: ela vai no segundo lado. */
function formatarLado(metros: number): string {
  return metros < 10 ? metros.toFixed(1) : String(Math.round(metros));
}

export function aberturaDoCone(medidor: Pick<Regua, "abertura">): number {
  return medidor.abertura ?? ABERTURA_CONE_PADRAO;
}

/** O medidor inteiro deslocado. Mover é o mesmo gesto para as quatro formas. */
export function moverRegua(medidor: Regua, delta: Vec): Regua {
  return {
    ...medidor,
    x: medidor.x + delta.x,
    y: medidor.y + delta.y,
    x2: medidor.x2 + delta.x,
    y2: medidor.y2 + delta.y,
  };
}

/**
 * Menor que isto entre os dois pontos, em unidades de cena, e o medidor é um
 * clique que não virou arrasto: não fica.
 */
export const MEDIDOR_MINIMO = 4;

export function reguaVazia(medidor: Pick<Regua, "x" | "y" | "x2" | "y2">): boolean {
  return Math.hypot(medidor.x2 - medidor.x, medidor.y2 - medidor.y) < MEDIDOR_MINIMO;
}

/**
 * A caixa do retângulo, normalizada: o mestre pode arrastar para qualquer
 * lado, e `x2 < x` é um retângulo tão bom quanto o outro.
 */
export function caixaDoRetangulo(medidor: Regua): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: Math.min(medidor.x, medidor.x2),
    y: Math.min(medidor.y, medidor.y2),
    width: Math.abs(medidor.x2 - medidor.x),
    height: Math.abs(medidor.y2 - medidor.y),
  };
}
