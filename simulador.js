    function logMessage(msg) {
        const logArea = document.getElementById('log');
        logArea.innerHTML += '\n' + msg;
        logArea.scrollTop = logArea.scrollHeight; // Rola para o final
    }

    function enviarPacote() {
        const origemSelect = document.getElementById('origem');
        const destinoSelect = document.getElementById('destino');
        const aclRule = document.getElementById('acl').value;

        const ipOrigem = origemSelect.value;
        const vlanOrigem = origemSelect.options[origemSelect.selectedIndex].getAttribute('data-vlan');
        const nomeOrigem = origemSelect.options[origemSelect.selectedIndex].text;

        const ipDestino = destinoSelect.value;
        const vlanDestino = destinoSelect.options[destinoSelect.selectedIndex].getAttribute('data-vlan');
        const nomeDestino = destinoSelect.options[destinoSelect.selectedIndex].text;

        logMessage(`\n--- Novo Pacote de [${nomeOrigem}] para [${nomeDestino}] ---`);

        // Verificação Lógica de Camada 2 (Mesma VLAN)
        if (vlanOrigem === vlanDestino) {
            logMessage(`[Switch] Destino na mesma VLAN (${vlanOrigem}).`);
            logMessage(`[Switch] Entregando pacote diretamente via MAC Address (Camada 2).`);
            logMessage(`✅ SUCESSO: Pacote chegou ao destino.`);
            return;
        }

        // Se for para VLAN diferente, precisa ir para o roteador (Camada 3)
        logMessage(`[Switch] Destino em VLAN diferente. Encaminhando para o Roteador (Default Gateway)...`);
        logMessage(`[Roteador] Recebeu pacote. IP Origem: ${ipOrigem} | IP Destino: ${ipDestino}`);
        logMessage(`[Roteador] Analisando regras da ACL selecionada...`);

        // Lógica de Processamento da ACL
        let block = false;
        let motivo = "";

        if (aclRule === 'deny_vlan10_to_vlan20') {
            // Regra: deny 192.168.10.0 0.0.0.255 192.168.20.0 0.0.0.255
            if (vlanOrigem === "10" && vlanDestino === "20") {
                block = true;
                motivo = "Regra ativa: Bloqueio total da VLAN 10 para VLAN 20.";
            }
        } 
        else if (aclRule === 'deny_pca_to_serva') {
            // Regra: deny host 192.168.10.10 host 192.168.20.10
            if (ipOrigem === "192.168.10.10" && ipDestino === "192.168.20.10") {
                block = true;
                motivo = "Regra ativa: Bloqueio específico do PC-A para o Servidor-A.";
            }
        }

        // Resultado da ACL
        if (block) {
            logMessage(`[ACL] MATCH (Correspondência encontrada)! Ação: DENY (Negar).`);
            logMessage(`[Roteador] Motivo: ${motivo}`);
            logMessage(`❌ FALHA: Pacote foi DESCARTADO (Drop) pelo roteador.`);
        } else {
            logMessage(`[ACL] Nenhuma regra de bloqueio encontrada (Implicit Permit / Permit Any).`);
            logMessage(`[Roteador] Roteando pacote para a VLAN ${vlanDestino}...`);
            logMessage(`✅ SUCESSO: Pacote chegou ao destino.`);
        }
    }

