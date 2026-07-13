// Configuration des types d'activités commerciales
// Chaque activité définit ses propres catégories, champs extra et vocabulaire

export type BusinessType =
  | 'BIBLES'
  | 'VETEMENTS'
  | 'CHAUSSURES'
  | 'CUISINE'
  | 'GENERAL';

export interface ExtraField {
  key: string;
  label: string;
  placeholder: string;
  type: 'text' | 'select';
  options?: string[];
  required?: boolean;
}

export interface BusinessConfig {
  type: BusinessType;
  label: string;
  emoji: string;
  description: string;
  categories: string[];
  extraFields: ExtraField[];
  productLabel: string; // "Produit", "Article", "Livre"...
  stockLabel: string;   // "Stock", "Exemplaires"...
}

export const BUSINESS_CONFIGS: Record<BusinessType, BusinessConfig> = {
  BIBLES: {
    type: 'BIBLES',
    label: 'Bibles & Livres Religieux',
    emoji: '📖',
    description: 'Vente de Bibles, cantiques, livres de prières...',
    categories: [
      'Bible', 'Nouveau Testament', 'Ancien Testament',
      'Cantiques', 'Livre de prières', 'Commentaire biblique',
      'Livre de croissance', 'Évangélisation', 'Enfants', 'Autres'
    ],
    extraFields: [
      {
        key: 'version',
        label: 'Version biblique',
        placeholder: 'Ex: Louis Segond, NEG, Darby, Semeur...',
        type: 'select',
        options: ['Louis Segond', 'NEG', 'Darby', 'Semeur', 'TOB', 'King James', 'BDS', 'Autre']
      },
      {
        key: 'langue',
        label: 'Langue',
        placeholder: 'Ex: Français, Anglais...',
        type: 'select',
        options: ['Français', 'Anglais', 'Éwé', 'Fon', 'Haoussa', 'Yoruba', 'Autre']
      },
      {
        key: 'couverture',
        label: 'Type de couverture',
        placeholder: 'Ex: Rigide, Souple...',
        type: 'select',
        options: ['Rigide', 'Souple', 'Luxe / Similicuir', 'Zip', 'Poche']
      },
      {
        key: 'taille',
        label: 'Taille / Format',
        placeholder: 'Ex: Poche, Standard, Gros caractères...',
        type: 'select',
        options: ['Poche', 'Standard', 'Grand format', 'Gros caractères', 'Géante']
      },
      {
        key: 'publicCible',
        label: 'Public cible',
        placeholder: 'Ex: Adulte, Enfant...',
        type: 'select',
        options: ['Adulte', 'Jeune', 'Enfant', 'Pasteur / Évangéliste', 'Étudiant']
      },
    ],
    productLabel: 'Livre',
    stockLabel: 'Exemplaires',
  },

  VETEMENTS: {
    type: 'VETEMENTS',
    label: 'Vêtements & Mode',
    emoji: '👗',
    description: 'Vente de vêtements, habits, mode...',
    categories: [
      'Chemises', 'Pantalons', 'Robes', 'Jupes', 'Vestes',
      'T-shirts', 'Sous-vêtements', 'Pyjamas', 'Costumes',
      'Enfants', 'Bébés', 'Autres'
    ],
    extraFields: [
      {
        key: 'taille',
        label: 'Taille',
        placeholder: 'Ex: S, M, L, XL...',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '36', '38', '40', '42', '44', '46', '48', 'Unique']
      },
      {
        key: 'couleur',
        label: 'Couleur principale',
        placeholder: 'Ex: Blanc, Noir, Bleu...',
        type: 'text',
      },
      {
        key: 'matiere',
        label: 'Matière',
        placeholder: 'Ex: Coton, Polyester...',
        type: 'select',
        options: ['Coton', 'Polyester', 'Lin', 'Soie', 'Laine', 'Synthétique', 'Mixte', 'Autre']
      },
      {
        key: 'genre',
        label: 'Genre',
        placeholder: 'Homme, Femme, Enfant...',
        type: 'select',
        options: ['Homme', 'Femme', 'Enfant', 'Bébé', 'Mixte']
      },
    ],
    productLabel: 'Article',
    stockLabel: 'Pièces en stock',
  },

  CHAUSSURES: {
    type: 'CHAUSSURES',
    label: 'Chaussures & Sandales',
    emoji: '👟',
    description: 'Vente de chaussures, sandales, baskets...',
    categories: [
      'Baskets / Sport', 'Sandales', 'Escarpins', 'Mocassins',
      'Bottes', 'Ballerines', 'Tongs', 'Chaussures habillées',
      'Enfants', 'Bébés', 'Autres'
    ],
    extraFields: [
      {
        key: 'pointure',
        label: 'Pointure / Taille',
        placeholder: 'Ex: 38, 39, 40, 41...',
        type: 'select',
        options: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47']
      },
      {
        key: 'couleur',
        label: 'Couleur',
        placeholder: 'Ex: Noir, Blanc, Marron...',
        type: 'text',
      },
      {
        key: 'matiere',
        label: 'Matière',
        placeholder: 'Ex: Cuir, Plastique...',
        type: 'select',
        options: ['Cuir naturel', 'Cuir synthétique', 'Tissu', 'Caoutchouc', 'Plastique', 'Autre']
      },
      {
        key: 'genre',
        label: 'Genre',
        placeholder: 'Homme, Femme, Enfant...',
        type: 'select',
        options: ['Homme', 'Femme', 'Enfant', 'Bébé', 'Mixte']
      },
    ],
    productLabel: 'Paire',
    stockLabel: 'Paires en stock',
  },

  CUISINE: {
    type: 'CUISINE',
    label: 'Accessoires de Cuisine',
    emoji: '🍳',
    description: 'Vente d\'ustensiles, casseroles, vaisselle...',
    categories: [
      'Casseroles & Marmites', 'Poêles', 'Vaisselle',
      'Couverts', 'Ustensiles', 'Électroménager',
      'Rangement cuisine', 'Emballages', 'Autres'
    ],
    extraFields: [
      {
        key: 'matiere',
        label: 'Matière',
        placeholder: 'Ex: Inox, Aluminium...',
        type: 'select',
        options: ['Inox', 'Aluminium', 'Fonte', 'Plastique', 'Verre', 'Céramique', 'Autre']
      },
      {
        key: 'capacite',
        label: 'Capacité / Taille',
        placeholder: 'Ex: 5L, 10L, Grand...',
        type: 'text',
      },
      {
        key: 'couleur',
        label: 'Couleur',
        placeholder: 'Ex: Gris, Rouge, Blanc...',
        type: 'text',
      },
      {
        key: 'marque',
        label: 'Marque',
        placeholder: 'Ex: Tefal, Ariston, Autre...',
        type: 'text',
      },
    ],
    productLabel: 'Article',
    stockLabel: 'Unités en stock',
  },

  GENERAL: {
    type: 'GENERAL',
    label: 'Commerce Général',
    emoji: '🏪',
    description: 'Commerce général, épicerie, quincaillerie...',
    categories: [
      'Alimentation', 'Boissons', 'Hygiène',
      'Électronique', 'Papeterie', 'Autres'
    ],
    extraFields: [],
    productLabel: 'Produit',
    stockLabel: 'Stock',
  },
};

export function getBusinessConfig(businessType?: string): BusinessConfig {
  if (!businessType) return BUSINESS_CONFIGS.GENERAL;
  return BUSINESS_CONFIGS[businessType as BusinessType] || BUSINESS_CONFIGS.GENERAL;
}

export const ALL_BUSINESS_TYPES: BusinessConfig[] = Object.values(BUSINESS_CONFIGS);
