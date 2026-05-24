// Socket.io temps réel
const socket = io();
socket.emit('rejoindre_restaurant', restaurantId);

socket.on('nouvelle_commande', (data) => {
  const c = data.commande;
  const toast = document.createElement('div');
  toast.className = 'toast-notif';
  toast.innerHTML = `🛒 <strong>Nouvelle commande !</strong><br>${c.client_nom} — ${c.total.toLocaleString('fr-FR')} FCFA`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 6000);

  // Ajouter la carte en haut de la liste sans refresh
  const list = document.getElementById('commandesList');
  if (!list) return;
  const empty = list.querySelector('.empty-page');
  if (empty) empty.remove();

  const card = document.createElement('div');
  card.className = 'commande-detail-card';
  card.id = `cmd-${c._id}`;
  const itemsHtml = c.items.map(i => `
    <div class="cmd-item">
      <span class="item-qty">${i.quantite}×</span>
      <span class="item-nom">${i.nom}</span>
      <span class="item-prix">${(i.prix * i.quantite).toLocaleString('fr-FR')} FCFA</span>
    </div>
  `).join('');

  card.innerHTML = `
    <div class="cmd-header">
      <div class="cmd-client">
        <span class="cmd-icon">👤</span>
        <div>
          <strong>${c.client_nom}</strong>
          ${c.client_table ? `<span class="cmd-table">Table ${c.client_table}</span>` : ''}
        </div>
      </div>
      <div class="cmd-meta">
        <span class="cmd-time">🕐 À l'instant</span>
        <span class="statut-badge statut-en_attente" id="statut-${c._id}">⏳ En attente</span>
      </div>
    </div>
    <div class="cmd-items">${itemsHtml}</div>
    ${c.note ? `<div class="cmd-note">📝 <em>${c.note}</em></div>` : ''}
    <div class="cmd-footer">
      <span class="cmd-total">Total : <strong>${c.total.toLocaleString('fr-FR')} FCFA</strong></span>
      <div class="cmd-statut-actions">
        <button class="btn-statut prep" onclick="changerStatut('${c._id}', 'en_preparation', this)">👨‍🍳 Prendre en charge</button>
        <button class="btn-statut annul" onclick="changerStatut('${c._id}', 'annulee', this)">❌ Annuler</button>
      </div>
    </div>
  `;
  list.insertBefore(card, list.firstChild);

  // Mettre à jour compteur en attente
  const cstatEl = document.querySelector('.cstat.en-attente .cstat-num');
  if (cstatEl) cstatEl.textContent = parseInt(cstatEl.textContent || 0) + 1;
});

socket.on('statut_commande', (data) => {
  const badge = document.getElementById(`statut-${data.commande_id}`);
  if (badge) {
    badge.className = `statut-badge statut-${data.statut}`;
    badge.textContent =
      data.statut === 'en_attente' ? '⏳ En attente' :
      data.statut === 'en_preparation' ? '👨‍🍳 En préparation' :
      data.statut === 'servie' ? '✅ Servie' : '❌ Annulée';
  }
});

// ── Changer statut ────────────────────────────────────────────
async function changerStatut(id, statut, btn) {
  btn.disabled = true;
  btn.style.opacity = '0.6';
  try {
    const res = await fetch(`/commandes/${id}/statut`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut })
    });
    const data = await res.json();
    if (data.ok) {
      // Mettre à jour le badge
      const badge = document.getElementById(`statut-${id}`);
      if (badge) {
        badge.className = `statut-badge statut-${statut}`;
        badge.textContent =
          statut === 'en_attente' ? '⏳ En attente' :
          statut === 'en_preparation' ? '👨‍🍳 En préparation' :
          statut === 'servie' ? '✅ Servie' : '❌ Annulée';
      }
      // Mettre à jour les boutons d'action
      const card = document.getElementById(`cmd-${id}`);
      if (card) {
        const actions = card.querySelector('.cmd-statut-actions');
        if (actions) {
          if (statut === 'en_preparation') {
            actions.innerHTML = `<button class="btn-statut serve" onclick="changerStatut('${id}', 'servie', this)">✅ Marquer comme servie</button>`;
          } else if (statut === 'servie' || statut === 'annulee') {
            actions.innerHTML = '';
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}
