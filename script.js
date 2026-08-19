// Escreve mensagens no console do simulador
function logMessage(msg) {
    const logArea = document.getElementById('log');
    if (logArea) {
        logArea.innerHTML += '\n' + msg;
        logArea.scrollTop = logArea.scrollHeight;
    }
}

// Anima o pacote fisicamente de um ponto A para um ponto B na tela
async function animarMovimento(elOrigem, elDestino, cor = '#68B2F8') {
    const rectA = elOrigem.getBoundingClientRect();
    const rectB = elDestino.getBoundingClientRect();

    // Posição central dos dois elementos
    const startX = rectA.left + window.scrollX + (rectA.width / 2) - 11;
    const startY = rectA.top + window.scrollY + (rectA.height / 2) - 11;
    const endX = rectB.left + window.scrollX + (rectB.width / 2) - 11;
    const endY = rectB.top + window.scrollY + (rectB.height / 2) - 11;

    // Cria a bolinha do pacote
    const pacote = document.createElement('div');
    pacote.className = 'pacote-animado';
    pacote.style.backgroundColor = cor;
    pacote.style.left = `${startX}px`;
    pacote.style.top = `${startY}px`;
    document.body.appendChild(pacote);

    // Executa a animação
    const animacao = pacote.animate([
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(1.2)` }
    ], {
        duration: 900,
        easing: 'ease-in-out',
        fill: 'forwards'
    });

    await animacao.finished;
    return pacote;
}

// Função executada ao clicar no botão
async function enviarPacote() {
    const origId = document.getElementById('origem').value;
    const destId = document.getElementById('destino').value;
    const aclRule = document.getElementById('acl').value;

    const elOrigem = document.getElementById(origId);
    const elDestino = document.getElementById(destId);
    const elRoteador = document.getElementById('node-router');

    if (!elOrigem || !elDestino || !elRoteador) {
        alert('Erro: Elementos da rede não foram encontrados na tela.');
        return;
    }

    const vlanOrigem = elOrigem.getAttribute('data-vlan');
    const vlanDestino = elDestino.getAttribute('data-vlan');
    const ipOrigem = elOrigem.getAttribute('data-ip');
    const ipDestino = elDestino.getAttribute('data-ip');

    logMessage(`\n--- [PACETE ENVIADO] ${ipOrigem} ➔ ${ipDestino} ---`);

    // 1. MESMA VLAN (Comunicação Camada 2 - Sem Roteador)
    if (vlanOrigem === vlanDestino) {
        logMessage(`[Switch L2] Origem e destino estão na VLAN ${vlanOrigem}.`);
        logMessage(`[Switch L2] Entregando pacote diretamente...`);

        const p = await animarMovimento(elOrigem, elDestino, '#68B2F8');
        p.style.backgroundColor = '#28a745'; // Fica verde
        logMessage(`✅ SUCESSO: Pacote entregue ao destino!`);

        setTimeout(() => p.remove(), 1000);
        return;
    }

    // 2. VLANs DIFERENTES (Necessita Roteamento Camada 3 + Validação da ACL)
    logMessage(`[Switch L2] VLANs diferentes (${vlanOrigem} ➔ ${vlanDestino}). Encaminhando para o Roteador...`);
    const p1 = await animarMovimento(elOrigem, elRoteador, '#7037CD');

    // Checagem das regras de ACL
    let bloqueado = false;
    let motivo = "";

    if (aclRule === 'deny_vlan10_to_vlan20' && vlanOrigem === "10" && vlanDestino === "20") {
        bloqueado = true;
        motivo = "ACL Regra: Deny VLAN 10 ➔ VLAN 20.";
    } else if (aclRule === 'deny_pca_to_serva' && origId === "node-pca" && destId === "node-serva") {
        bloqueado = true;
        motivo = "ACL Regra: Deny Host 192.168.10.10 ➔ Host 192.168.20.10.";
    }

    // SE A ACL BLOQUEAR:
    if (bloqueado) {
        logMessage(`[Roteador ACL] MATCH! Ação: DENY (Descarte).`);
        logMessage(`[Bloqueio] ${motivo}`);
        
        // O pacote fica vermelho e desaparece no Roteador (Simulando o Drop)
        p1.style.backgroundColor = '#dc3545';
        p1.animate([
            { transform: p1.style.transform + ' scale(1.3)', opacity: 1 },
            { transform: p1.style.transform + ' scale(0)', opacity: 0 }
        ], { duration: 500, fill: 'forwards' });

        logMessage(`❌ FALHA: Pacote foi DESCARTADO pelo Roteador!`);
        setTimeout(() => p1.remove(), 600);
    } 
    // SE A ACL PERMITIR:
    else {
        logMessage(`[Roteador ACL] PERMITIDO! Roteando pacote para o destino...`);
        p1.remove(); // Remove o primeiro percurso

        const p2 = await animarMovimento(elRoteador, elDestino, '#506EE5');
        p2.style.backgroundColor = '#28a745'; // Fica verde no destino
        logMessage(`✅ SUCESSO: Pacote entregue ao destino!`);
        setTimeout(() => p2.remove(), 1000);
    }
}