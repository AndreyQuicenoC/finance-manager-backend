import { describe, expect, it } from '@jest/globals';
import { buildAccountContext } from '../../src/services/build.ia.context';

describe('buildAccountContext', () => {
  it('should build a rich context string from account data', () => {
    const account = {
      name: 'Cuenta Principal',
      money: 1500,
      category: { tipo: 'Ahorros' },
      tags: [
        {
          name: 'Tag Ingresos',
          description: 'Ingresos mensuales',
          transactions: [
            {
              isIncome: true,
              amount: 1000,
              transactionDate: new Date('2025-01-01T00:00:00.000Z'),
              description: 'Salario',
            },
            {
              isIncome: false,
              amount: 200,
              transactionDate: new Date('2025-01-02T00:00:00.000Z'),
              description: 'Compra',
            },
          ],
        },
      ],
    };

    const context = buildAccountContext(account);

    expect(context).toContain('Eres un asistente financiero');
    expect(context).toContain('Cuenta:');
    expect(context).toContain('Nombre: Cuenta Principal');
    expect(context).toContain('Dinero disponible: 1500');
    expect(context).toContain('Categoría: Ahorros');
    expect(context).toContain('Tag: Tag Ingresos');
    // 1000 - 200 = 800
    expect(context).toContain('Balance: 800');
    expect(context).toContain('Salario');
    expect(context).toContain('Compra');
    expect(context).toContain('Reglas:');
  });
});



