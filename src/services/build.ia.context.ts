
// utils/ai/buildContext.ts
interface Transaction {
  isIncome: boolean;
  amount: number;
  transactionDate: Date;
  description: string | null;
}

interface Tag {
  name: string;
  description: string | null;
  transactions: Transaction[];
}

interface AccountContext {
  name: string | null;
  money: number;
  category: {
    tipo: string;
  };
  tags: Tag[];
}

export const buildAccountContext = (account: AccountContext) => {
    let context = `
  Eres un asistente financiero.
  Analiza la siguiente información y responde claramente.
  
  Cuenta:
  - Nombre: ${account.name}
  - Dinero disponible: ${account.money}
  - Categoría: ${account.category.tipo}
  
  Distribución por tags:
  `;
  
    for (const tag of account.tags) {
      const total = tag.transactions.reduce(
        (sum: number, t: Transaction) =>
          t.isIncome ? sum + t.amount : sum - t.amount,
        0
      );
  
      context += `
  Tag: ${tag.name}
  Descripción: ${tag.description || "N/A"}
  Balance: ${total}
  Transacciones:
  `;
  
      for (const tx of tag.transactions) {
        context += `- ${tx.transactionDate.toISOString()} | ${tx.isIncome ? "Ingreso" : "Gasto"} | ${tx.amount} | ${tx.description || ""}\n`;
      }
    }
  
    context += `
  Reglas:
  - No inventes datos
  - Usa solo la información dada
  - Sé claro y educativo
  `;
  
    return context;
  };
