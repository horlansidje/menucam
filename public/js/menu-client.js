// ── État du panier ────────────────────────────────────────────
let panier = {};

function ajouterAuPanier(id, nom, prix) {
  if (panier[id]) {
    panier[id].quantite += 1;
  } else {
    panier[id] = { id, nom, prix, quantite: 1 };
  }
  mettreAJourUI();
  animerBouton(id);
}

function retirerDuPanier(id) {
  if (!panier[id]) return;
  panier[id].quantite -= 1;
  if (panier[id].quantite <= 0) delete panier[id];
  mettreAJourUI();
  mettreAJourPanierModal();
}

function animerBouton(id) {
  const btn = document.getElementById(`btn-${id}`);
  if (!btn) return;
  const qty = panier[id] ? panier[id].quantite : 0;
  btn.textContent = qty > 0 ? qty : '+';
  btn.style.transform = 'scale(1.3)';
  setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function mettreAJourUI() {
  const items = Object.values(panier);
  const total = items.reduce((s, i) => s + i.prix * i.quantite, 0);
  const count = items.reduce((s, i) => s + i.quantite, 0);

  const bar = document.getElementById('panierBar');
  if (count > 0) {
    bar.style.display = 'flex';
    document.getElementById('panierCount').textContent = `${count} article${count > 1 ? 's' : ''}`;
    document.getElementById('panierTotal').textContent = `${total.toLocaleString('fr-FR')} FCFA`;
  } else {
    bar.style.display = 'none';
  }

  // Mettre à jour les boutons add
  document.querySelectorAll('.add-btn').forEach(btn => {
    const id = btn.id.replace('btn-', '');
    const qty = panier[id] ? panier[id].quantite : 0;
    btn.textContent = qty > 0 ? qty : '+';
    btn.style.background = qty > 0 ? '#1a1a2e' : 'var(--orange)';
  });
}

function mettreAJourPanierModal() {
  const items = Object.values(panier);
  const total = items.reduce((s, i) => s + i.prix * i.quantite, 0);

  const container = document.getElementById('panierItems');
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:2rem">Votre panier est vide.</p>';
  } else {
    container.innerHTML = items.map(item => `
      <div class="panier-item">
        <div style="flex:1">
          <div class="pi-nom">${item.nom}</div>
          <div class="pi-prix">${item.prix.toLocaleString('fr-FR')} FCFA × ${item.quantite} = ${(item.prix * item.quantite).toLocaleString('fr-FR')} FCFA</div>
        </div>
        <div class="pi-controls">
          <button class="pi-btn" onclick="retirerDuPanier('${item.id}')">−</button>
          <span class="pi-qty">${item.quantite}</span>
          <button class="pi-btn" onclick="ajouterAuPanier('${item.id}', '${item.nom.replace(/'/g, "\\'")}', ${item.prix})">+</button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('panierTotalModal').textContent = `${total.toLocaleString('fr-FR')} FCFA`;
}

function ouvrirPanier() {
  document.getElementById('panierOverlay').style.display = 'flex';
  mettreAJourPanierModal();
  document.body.style.overflow = 'hidden';
}

function fermerPanier() {
  document.getElementById('panierOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// Fermer en cliquant en dehors
document.getElementById('panierOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) fermerPanier();
});

// ── Commander via WhatsApp ────────────────────────────────────
function commanderWhatsApp() {
  const items = Object.values(panier);
  if (items.length === 0) return;

  const nom   = document.getElementById('clientNom').value.trim() || 'Client';
  const table = document.getElementById('clientTable').value.trim();
  const note  = document.getElementById('clientNote').value.trim();
  const total = items.reduce((s, i) => s + i.prix * i.quantite, 0);

  let message = `🍽️ *Nouvelle commande — ${RESTAURANT_NOM}*\n\n`;
  message += `👤 *Client :* ${nom}\n`;
  if (table) message += `📍 *Table :* ${table}\n`;
  message += `\n*📋 Commande :*\n`;
  items.forEach(item => {
    message += `• ${item.quantite}× ${item.nom} — ${(item.prix * item.quantite).toLocaleString('fr-FR')} FCFA\n`;
  });
  message += `\n💰 *Total : ${total.toLocaleString('fr-FR')} FCFA*`;
  if (note) message += `\n\n📝 *Note :* ${note}`;

  // Enregistrer la commande en base
  enregistrerCommande(items, nom, table, note, total);

  // Ouvrir WhatsApp
  const tel = RESTAURANT_TEL.replace(/\D/g, '');
  const url = tel
    ? `https://wa.me/${tel.startsWith('237') ? tel : '237' + tel}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(url, '_blank');
  fermerPanier();

  // Vider le panier et afficher confirmation
  panier = {};
  mettreAJourUI();
  afficherConfirmation();
}

async function enregistrerCommande(items, nom, table, note, total) {
  try {
    const payload = {
      restaurant_id: RESTAURANT_ID,
      items: items.map(i => ({ id: i.id, nom: i.nom, prix: i.prix, quantite: i.quantite })),
      client_nom: nom,
      client_table: table,
      note,
      total
    };
    await fetch('/commandes/nouvelle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Erreur enregistrement commande:', err);
  }
}

function afficherConfirmation() {
  const div = document.createElement('div');
  div.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);
    display:flex;align-items:center;justify-content:center;z-index:300;
    animation:fadeIn 0.2s ease;
  `;
  div.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:2.5rem 2rem;text-align:center;max-width:320px;margin:1rem;">
      <div style="font-size:3rem;margin-bottom:1rem">✅</div>
      <h2 style="font-family:'Syne',sans-serif;font-size:1.3rem;margin-bottom:0.5rem">Commande envoyée !</h2>
      <p style="color:#6b7280;font-size:14px;line-height:1.6">Votre commande a été transmise via WhatsApp. Le restaurant la prendra en charge dans quelques instants.</p>
      <button onclick="this.closest('[style*=fixed]').remove()" style="margin-top:1.5rem;background:#e85d04;color:#fff;border:none;padding:12px 28px;border-radius:12px;font-weight:700;cursor:pointer;font-size:15px;">Fermer</button>
    </div>
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 8000);
}

// ── Navigation catégories ─────────────────────────────────────
function scrollTocat(cat) {
  const id = cat.replace(/\s/g, '-');
  const el = document.getElementById(`cat-${id}`);
  if (el) {
    const offset = 130;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// Highlight active category on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const cat = entry.target.dataset.cat;
      document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = [...document.querySelectorAll('.cat-btn')].find(b => b.textContent.trim() === cat);
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });

document.querySelectorAll('.menu-section').forEach(s => observer.observe(s));
