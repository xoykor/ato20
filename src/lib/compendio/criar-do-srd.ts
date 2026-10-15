import {
  createCharacter,
  criarAtributo,
  editarAtributo,
  criarMedidor,
  editarMedidor,
} from "@/lib/vault/characters";
import { criarDetalhe } from "@/lib/vault/detalhes";
import type { SrdCreature } from "./srd-5e";
import type { Personagem } from "@/types/character";

/**
 * Cria um personagem no cofre da campanha a partir de uma criatura do SRD 5.1,
 * populando seus atributos (FOR, DES, CON, INT, SAB, CAR, CA), medidor de PV
 * e blocos de ações e informações.
 */
export async function criarPersonagemDoSRD(
  monstro: SrdCreature,
): Promise<Personagem> {
  const personagem = await createCharacter(monstro.name);
  const id = personagem.id;

  try {
    // 1. Medidor de PV
    const medidores = personagem.medidores ?? [];
    const parPv = medidores.find(
      (m) =>
        m.nome.toLowerCase() === "pv" ||
        m.nome.toLowerCase() === "hp" ||
        m.nome.toLowerCase() === "vida",
    );

    if (parPv) {
      await editarMedidor(id, parPv.id, {
        maximo: monstro.maxHp,
        atual: monstro.hp,
      });
    } else {
      await criarMedidor(id, "PV", "#ef4444", "barra", monstro.maxHp);
    }

    // 2. Atributos D&D 5e
    const atributosAlvo: Array<{ sigla: string; valor: number }> = [
      { sigla: "CA", valor: monstro.ac },
      { sigla: "FOR", valor: monstro.abilities.str },
      { sigla: "DES", valor: monstro.abilities.dex },
      { sigla: "CON", valor: monstro.abilities.con },
      { sigla: "INT", valor: monstro.abilities.int },
      { sigla: "SAB", valor: monstro.abilities.wis },
      { sigla: "CAR", valor: monstro.abilities.cha },
    ];

    const atributosExistentes = personagem.atributos ?? [];
    for (const { sigla, valor } of atributosAlvo) {
      const par = atributosExistentes.find(
        (a) => a.sigla.toUpperCase() === sigla.toUpperCase(),
      );
      if (par) {
        await editarAtributo(id, par.id, { valor });
      } else {
        await criarAtributo(id, sigla, valor);
      }
    }

    // 3. Ações e Detalhes
    for (const action of monstro.actions) {
      await criarDetalhe(id, {
        grupo: "Ações",
        rotulo: action.name,
        tipo: "texto",
        valor: action.desc,
      });
    }

    await criarDetalhe(id, {
      grupo: "Informações",
      rotulo: "ND / CR",
      tipo: "texto",
      valor: monstro.cr,
    });

    await criarDetalhe(id, {
      grupo: "Informações",
      rotulo: "Tipo & Tamanho",
      tipo: "texto",
      valor: `${monstro.size} - ${monstro.type}`,
    });

    await criarDetalhe(id, {
      grupo: "Informações",
      rotulo: "Deslocamento",
      tipo: "texto",
      valor: monstro.speed,
    });
  } catch (erro) {
    console.warn("Aviso ao preencher detalhes do monstro SRD:", erro);
  }

  return personagem;
}
