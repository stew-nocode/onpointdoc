export const products = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    label: 'OBC (ERP)'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    label: 'SNI (Notation interne)'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    label: 'Credit Factory'
  }
] as const;

export const modules = [
  {
    id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    label: 'RH / Paie',
    productId: products[0].id
  },
  {
    id: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    label: 'Comptabilité',
    productId: products[0].id
  },
  {
    id: 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    label: 'Scoring',
    productId: products[1].id
  },
  {
    id: 'ccccccc1-cccc-cccc-cccc-ccccccccccc1',
    label: 'Onboarding Crédit',
    productId: products[2].id
  }
] as const;

