// ================================================
// FUELO — Rôles que chaque rôle créateur peut créer
// Source de vérité frontend, doit rester alignée avec
// CREATION_RULES dans backend/controllers/employeController.js
// ================================================

export const CREATABLE_ROLES = {
  owner: [
    { value: 'gerant',      label: 'Gérant',      desc: 'Dashboard, ventes, stock, alertes, services, pompistes' },
    { value: 'logisticien', label: 'Logisticien', desc: 'Citernes, trajets GPS, alertes transport, chauffeurs' },
  ],
  gerant: [
    { value: 'pompiste', label: 'Pompiste', desc: 'Enregistrement des ventes et gestion de service' },
  ],
  logisticien: [
    { value: 'chauffeur', label: 'Chauffeur', desc: 'Transport de citernes et trajets GPS' },
  ],
}
