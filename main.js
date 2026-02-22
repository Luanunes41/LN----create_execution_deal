const axios = require("axios");

exports.main = async (event, callback) => {
    const TOKEN = process.env.token_triagem;

    const headers = {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
    };

    const dealOrigemId = event.object.objectId;

    // ===== CONFIGURAÇÃO (PRODUÇÃO) =====
    const PIPELINE_DESTINO = "0"; // Substitua pelo ID do pipeline de destino
    const STAGE_DESTINO = "0";    // Substitua pelo ID da etapa de destino

    // ===== CONFIGURAÇÃO (TESTE) =====

    const DEAL_TO_DEAL_ASSOCIATION_TYPE_ID = 451;
    const DEAL_TO_CONTACT_ASSOCIATION_TYPE_ID = 3;
    const DEAL_TO_COMPANY_ASSOCIATION_TYPE_ID = 5;

    // ===== PROPRIEDADES A COPIAR ===== 
    const PROPERTIES_TO_COPY = [
        "closedate",
        "dealtype",
    ];

    let novoDealId = null;

    try {
        // ===== BUSCAR DEAL ORIGEM =====
        const dealRes = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/deals/${dealOrigemId}?properties=${PROPERTIES_TO_COPY.join(",")}`,
            { headers }
        );

        const dealOrigem = dealRes.data;

        // ===== COPIAR PROPRIEDADES =====
        const propriedadesNovoDeal = {};

        PROPERTIES_TO_COPY.forEach((prop) => {
            const value = dealOrigem.properties?.[prop];
            const hasValue =
                value !== null &&
                value !== undefined &&
                !(typeof value === "string" && value.trim() === "");

            if (hasValue) {
                propriedadesNovoDeal[prop] = value;
            }
        });

        // ===== CRIAR DEAL DESTINO =====
        const novoDealRes = await axios.post(
            "https://api.hubapi.com/crm/v3/objects/deals",
            {
                properties: {
                    dealname: `Execução | ${dealOrigemId}`,
                    pipeline: PIPELINE_DESTINO,
                    dealstage: STAGE_DESTINO,
                    ...propriedadesNovoDeal
                }
            },
            { headers }
        );

        novoDealId = novoDealRes.data.id;

        // ===== ASSOCIAR DEAL ↔ DEAL =====
        await axios.put(
            `https://api.hubapi.com/crm/v3/objects/deals/${dealOrigemId}/associations/deals/${novoDealId}/${DEAL_TO_DEAL_ASSOCIATION_TYPE_ID}`,
            {},
            { headers }
        );

        // ===== ASSOCIAR CONTATOS =====
        const contatosRes = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/deals/${dealOrigemId}/associations/contacts`,
            { headers }
        );

        const contatos = contatosRes.data.results || [];

        for (const contato of contatos) {
            await axios.put(
                `https://api.hubapi.com/crm/v3/objects/deals/${novoDealId}/associations/contacts/${contato.id}/${DEAL_TO_CONTACT_ASSOCIATION_TYPE_ID}`,
                {},
                { headers }
            );
        }

        // ===== ASSOCIAR EMPRESA (SE EXISTIR) =====
        const empresaRes = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/deals/${dealOrigemId}/associations/companies`,
            { headers }
        );

        const empresas = empresaRes.data.results || [];

        if (empresas.length > 0) {
            const empresaId = empresas[0].id;

            await axios.put(
                `https://api.hubapi.com/crm/v3/objects/deals/${novoDealId}/associations/companies/${empresaId}/${DEAL_TO_COMPANY_ASSOCIATION_TYPE_ID}`,
                {},
                { headers }
            );
        }

        // ===== CALLBACK SUCESSO =====
        callback({
            outputFields: {
                status: "success",
                deal_origem_id: dealOrigemId,
                deal_destino_id: novoDealId
            }
        });

    } catch (error) {
        const msg =
            error.response?.data?.message ||
            error.response?.data?.errors?.[0]?.message ||
            error.message;

        callback({
            outputFields: {
                status: "error",
                error_message: msg,
                deal_destino_id: novoDealId || ""
            }
        });
    }
};
