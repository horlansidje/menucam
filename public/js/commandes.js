const socket = io();
socket.emit('rejoindre_restaurant', restaurantId);

socket.on('nouvelle_commande', data => {
  const c = data.commande;
  const toast = document.createElement('div');
  toast.className = 'toast-notif';
  toast.innerHTML = `🛒 <strong>Nouvelle commande !</strong> ${c.client_nom} — ${c.total.toLocaleString('fr-FR')} FCFA`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 6000);
  const list = document.getElementById('commandesList');
  if (!list) return;
  list.querySelector('.empty-page')?.remove();
  const icon = c.type_livraison==='livraison'?'🛵':c.type_livraison==='a_emporter'?'🛍️':'🪑';
  const payLabel = c.paiement==='mtn'?'📱 MTN':c.paiement==='orange'?'🟠 Orange':'💬 WA';
  const card = document.createElement('div');
  card.className = 'commande-detail-card'; card.id = `cmd-${c._id}`;
  card.innerHTML = `
    <div class="cmd-header">
      <div class="cmd-client"><div class="cmd-icon">${icon}</div>
        <div><strong>${c.client_nom}</strong><span style="font-size:12px;color:var(--gris);margin-left:6px">#${c.num_commande||''}</span>
          ${c.client_telephone?`<div style="font-size:12px;color:var(--gris)">📞 ${c.client_telephone}</div>`:''}
          ${c.type_livraison==='livraison'&&c.client_adresse?`<div style="font-size:12px;color:var(--bleu)">📍 ${c.client_adresse}</div>`:''}
        </div>
      </div>
      <div class="cmd-meta">
        <span class="cmd-time">🕐 À l'instant</span>
        <span style="font-size:11px;background:var(--gris-light);padding:3px 8px;border-radius:20px">${payLabel}</span>
        <span class="statut-badge statut-en_attente" id="statut-${c._id}">⏳ En attente</span>
      </div>
    </div>
    <div class="cmd-items">${c.items.map(i=>`<div class="cmd-item"><span class="item-qty">${i.quantite}×</span><span class="item-nom">${i.nom}</span><span class="item-prix">${(i.prix*i.quantite).toLocaleString('fr-FR')} F</span></div>`).join('')}</div>
    ${c.note?`<div class="cmd-note">📝 <em>${c.note}</em></div>`:''}
    <div class="cmd-footer">
      <span class="cmd-total">Total : <strong>${c.total.toLocaleString('fr-FR')} FCFA</strong></span>
      <div class="cmd-statut-actions" id="actions-${c._id}">
        <button class="btn-statut prep" onclick="changerStatut('${c._id}','en_preparation',this)">👨‍🍳 Préparer</button>
        <button class="btn-statut annul" onclick="changerStatut('${c._id}','annulee',this)">❌ Annuler</button>
      </div>
    </div>`;
  list.insertBefore(card, list.firstChild);
  const cnt = document.querySelector('.cstat.s-or .cstat-num');
  if (cnt) cnt.textContent = parseInt(cnt.textContent||0) + 1;
});

socket.on('statut_commande', data => {
  const badge = document.getElementById(`statut-${data.commande_id}`);
  if (!badge) return;
  badge.className = `statut-badge statut-${data.statut}`;
  const labels = { en_attente:'⏳ En attente', en_preparation:'👨‍🍳 Préparation', en_livraison:'🛵 Livraison', servie:'✅ Servie', livree:'✅ Livrée', annulee:'❌ Annulée' };
  badge.textContent = labels[data.statut] || data.statut;
});

async function changerStatut(id, statut, btn) {
  btn.disabled = true; btn.style.opacity = '0.6';
  try {
    const res = await fetch(`/commandes/${id}/statut`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ statut }) });
    const data = await res.json();
    if (data.ok) {
      const badge = document.getElementById(`statut-${id}`);
      if (badge) { badge.className = `statut-badge statut-${statut}`; const labels={en_attente:'⏳ En attente',en_preparation:'👨‍🍳 Préparation',en_livraison:'🛵 Livraison',servie:'✅ Servie',livree:'✅ Livrée',annulee:'❌ Annulée'}; badge.textContent=labels[statut]||statut; }
      const actions = document.getElementById(`actions-${id}`);
      if (actions) {
        if (statut==='en_preparation') actions.innerHTML = `<button class="btn-statut serve" onclick="changerStatut('${id}','servie',this)">✅ Servir</button>`;
        else if (statut==='servie'||statut==='livree'||statut==='annulee') actions.innerHTML = '';
      }
    }
  } catch(e) { console.error(e); }
  btn.disabled = false; btn.style.opacity = '1';
}

async function assignerLivreur(id) {
  const sel = document.getElementById(`livreur-${id}`);
  const livreur_id = sel?.value;
  if (!livreur_id) return alert('Choisissez un livreur.');
  const res = await fetch(`/commandes/${id}/statut`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ statut:'en_livraison', livreur_id }) });
  const data = await res.json();
  if (data.ok) {
    const badge = document.getElementById(`statut-${id}`);
    if (badge) { badge.className = 'statut-badge statut-en_livraison'; badge.textContent = '🛵 Livraison'; }
    const actions = document.getElementById(`actions-${id}`);
    if (actions) actions.innerHTML = `<button class="btn-statut serve" onclick="changerStatut('${id}','livree',this)">✅ Livrée</button>`;
  }
}
