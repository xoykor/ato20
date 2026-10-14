# Jogando via LAN VPN (Tailscale, ZeroTier, Hamachi)

O ATO20 foi desenhado prioritariamente para o jogo presencial na rede de casa (*local-first*), mas suporta nativamente sessões remotas através de **LAN VPNs** (redes locais virtuais seguras entre amigos).

Com uma LAN VPN, você joga pela internet com a mesma privacidade, sem abrir portas no roteador (*port forwarding*) e sem depender de servidores em nuvem de terceiros.

---

## Como funciona

O *daemon* do ATO20 escuta na porta TCP `20200` em todas as interfaces da sua máquina (`0.0.0.0`). Ao conectar você e seus jogadores a uma rede VPN ponto a ponto, o tráfego dos celulares e da TV transita diretamente por um túnel criptografado entre as máquinas.

O aplicativo detecta automaticamente os adaptadores de VPN instalados (como Tailscale e ZeroTier) e ajusta o QR Code e os links de convite na tela do Mestre.

---

## 1. Escolha uma VPN

Qualquer solução de rede virtual privada funciona. As mais recomendadas:

| Ferramenta | Vantagens | Como usar |
| :--- | :--- | :--- |
| **Tailscale** *(Mais recomendada)* | Gratuito, sem configuração de roteador, aplicativo leve para Android, iOS, Windows e Linux. Suporta MagicDNS (nomes como `meupc.ts.net`). | Crie uma conta gratuita, instale no PC do mestre e nos celulares dos jogadores, e conecte-os na mesma tailnet. |
| **ZeroTier** | Fácil de gerenciar via painel web, funciona como um switch virtual na nuvem. | Crie uma rede no site do ZeroTier e autorize o PC do mestre e os aparelhos dos jogadores. |
| **Hamachi / Radmin VPN** | Tradicionais em comunidades de jogos. | Crie uma sala com nome e senha e peça para os jogadores entrarem. |

---

## 2. No ATO20 (Tela do Mestre)

1. Conecte sua VPN antes de abrir o aplicativo (ou conecte com ele aberto).
2. Na barra superior do Mestre, clique em **Entrar na mesa**.
3. O seletor **Rede do convite** mostrará as redes disponíveis:
   * **Rede Local (Wi-Fi):** Para quem estiver na mesma casa física que o mestre.
   * **Tailscale / ZeroTier / VPN:** Identificada automaticamente com o IP da VPN (ex: `100.85.20.10`).
   * **Personalizado (Hostname / IP):** Digite manualmente um hostname (ex: `meupc.ts.net`) ou IP específico caso use MagicDNS ou proxy reverso.
4. Ao selecionar a VPN:
   * O selo **LAN VPN** será exibido.
   * O **QR Code** e os botões de cópia se atualizam automaticamente com o endereço da VPN.
   * A sua escolha fica salva para as próximas sessões.

---

## 3. Na ponta dos Jogadores e Espectador

1. Os jogadores ativam a VPN no celular.
2. Eles apontam a câmera para o QR Code na tela do mestre (ou acessam o link compartilhado via Discord/WhatsApp).
3. A tela do jogador abre no navegador do celular, autenticando pelo código da mesa normalmente.
4. Para a TV ou projetor remoto: abra o navegador no endereço exibido na aba **TV** do convite.

---

## Dicas e Resolução de Problemas

### Firewall do Windows ou Linux
Ao instalar adaptadores virtuais de rede, alguns sistemas operacionais (especialmente o Windows) classificam a interface da VPN como *Rede Pública* e bloqueiam portas de entrada por padrão.

Se os celulares não conseguirem carregar a página:
* **No Windows:** Abra as configurações do *Firewall do Windows com Segurança Avançada*, vá em *Regras de Entrada*, e certifique-se de que o executável do ATO20 (ou a porta TCP `20200`) tem permissão de entrada na rede da VPN.
* **No Linux (UFW):**
  ```bash
  sudo ufw allow in on tailscale0 to any port 20200 proto tcp
  ```
  *(substitua `tailscale0` pelo nome da sua interface, como `zt0`)*

### Segurança
* As rotas de controle do mestre (publicar cenas, alterar estados críticos, ler manuais de regras) exigem conexão local via *loopback* (`127.0.0.1`) e token de sessão gerado a cada abertura. Elas nunca podem ser acionadas remotamente pela VPN.
* O código da mesa de 6 caracteres previne conexões acidentais. Use VPNs apenas com pessoas conhecidas da sua mesa de jogo.
