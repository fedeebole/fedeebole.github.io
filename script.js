// =============== Configuración y utilidades ===============
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const ARS = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
const nowStr = () => {
  const d = new Date();
  return d.toLocaleDateString('es-AR') + " - " + d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
};

// TODO: tu número real (solo dígitos, con país si querés: 549351XXXXXXX)
const WHATSAPP_NUMBER = "3515737465";
// tu email para el botón de contacto
const EMAIL = "eldescorchecba@gmail.com";

// =============== Datos de ejemplo ===============
const PRODUCTS = [
  {id:"malbec1", nombre:"Malbec Reserva", bodega:"Catena", variedad:"Malbec", categoria:"Tinto", precio: 12500, image:"https://images.unsplash.com/photo-1604908554007-06259bdb83a0?q=80&w=800&auto=format&fit=crop"},
  {id:"blanco1", nombre:"Chardonnay", bodega:"Rutini", variedad:"Chardonnay", categoria:"Blanco", precio: 9800, image:"https://images.unsplash.com/photo-1541976076758-347942db1971?q=80&w=800&auto=format&fit=crop"},
  {id:"rosado1", nombre:"Rosé Patagónico", bodega:"NQN", variedad:"Rosé", categoria:"Rosado", precio: 8900, image:"https://images.unsplash.com/photo-1581700261290-2671c44d7e1a?q=80&w=800&auto=format&fit=crop"},
  {id:"espumante1", nombre:"Brut Nature", bodega:"Norton", variedad:"Espumante", categoria:"Espumante", precio: 15400, image:"https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800&auto=format&fit=crop"},
  {id:"promo1", nombre:"Caja Mix x3", bodega:"Selección", variedad:"Mix", categoria:"Regalos", precio: 29900, image:"https://images.unsplash.com/photo-1514361977593-9d0612d9580a?q=80&w=800&auto=format&fit=crop"},
  {id:"eco1", nombre:"Blend Joven", bodega:"Trapiche", variedad:"Blend", categoria:"Economicos", precio: 5900, image:"https://images.unsplash.com/photo-1514361977593-9d0612d9580a?q=80&w=800&auto=format&fit=crop"},
];

// =============== Firebase Auth (inyectado desde index) ===============
const {
  auth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut
} = window.__AUTH__ || {};

// =============== Estado de usuario + carrito por usuario ===============
let currentUser = null;
const userKey = () => currentUser?.uid ? `user_${currentUser.uid}` : `user_guest`;
const cartKey = () => `carrito_vinos_${userKey()}`;

function loadCart() {
  try { return JSON.parse(localStorage.getItem(cartKey()) || "[]"); }
  catch { return []; }
}
function saveCart() {
  localStorage.setItem(cartKey(), JSON.stringify(cart));
}

// =============== Render de productos (carrusel) ===============
const track   = $("#productTrack");
const prevBtn = $("#prodPrev");
const nextBtn = $("#prodNext");

function renderProducts(list=PRODUCTS){
  track.innerHTML = "";
  list.forEach(p=>{
    const el = document.createElement('div');
    el.className = "card product-card";
    el.innerHTML = `
      <img src="${p.image}" alt="${p.nombre}" />
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <strong>${p.nombre}</strong>
          <span class="tag">${p.categoria}</span>
        </div>
        <div class="muted">${p.bodega} · ${p.variedad}</div>
        <div class="price">${ARS(p.precio)}</div>
        <button class="btn" data-add="${p.id}">Agregar al carrito</button>
      </div>`;
    track.appendChild(el);
  });
  updateArrows();
}
renderProducts();

// Desplazamiento por flechas
function pageWidth(){ return track.parentElement.clientWidth; } // viewport
function updateArrows(){
  const left = Math.ceil(track.scrollLeft);
  const max  = track.scrollWidth - track.clientWidth - 1;
  prevBtn.disabled = left <= 0;
  nextBtn.disabled = left >= max;
}
prevBtn.addEventListener('click', ()=> track.scrollBy({left:-pageWidth(), behavior:'smooth'}));
nextBtn.addEventListener('click', ()=> track.scrollBy({left: pageWidth(), behavior:'smooth'}));
track.addEventListener('scroll', updateArrows);
window.addEventListener('resize', updateArrows);

// =============== Filtro por categoría ===============
function applyCategoryFilter(cat){
  const filtered = PRODUCTS.filter(p => p.categoria === cat || (cat==="Economicos" && p.precio<=6000));
  renderProducts(filtered.length?filtered:PRODUCTS);
}
$$(".cat-card").forEach(card=>{
  card.addEventListener('click', ()=>{
    const cat = card.dataset.filter;
    applyCategoryFilter(cat);
  });
});

// =============== Swiper (carrusel categorías) ===============
new Swiper('.categoriesSwiper', {
  slidesPerView: 1.2,
  spaceBetween: 12,
  breakpoints: {
    480: { slidesPerView: 2.2 },
    768: { slidesPerView: 3.2 },
    1024:{ slidesPerView: 4.2 },
    1280:{ slidesPerView: 5.2 }
  },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
  pagination: { el: '.swiper-pagination', clickable: true },
});

// =============== Carrito ===============
const bubble = $("#cartBubble");
let cart = loadCart();

function qtyInCart(){ return cart.reduce((a,b)=>a+b.qty,0); }
function subtotal(){ return cart.reduce((a,b)=>a + b.qty*b.precio,0); }
function shipping(){ return cart.length ? 0 : 0; } // política real a definir
function discount(){ return 0; }

function syncBubble(){ bubble.textContent = qtyInCart(); }

// Agregar desde cards
document.addEventListener('click', (e)=>{
  const id = e.target?.dataset?.add;
  if(!id) return;
  const prod = PRODUCTS.find(x=>x.id===id);
  const line = cart.find(x=>x.id===id);
  if(line) line.qty += 1; else cart.push({id:prod.id, nombre:prod.nombre, precio:prod.precio, image:prod.image, qty:1});
  saveCart(); syncBubble(); renderCart(); openDrawer();
});

// Render carrito
const drawer = $("#drawer");
const linesBox = $("#cartLines");
const $subtotal = $("#subtotal"), $discount=$("#discount"), $shipping=$("#shipping"), $total=$("#total");

function renderCart(){
  linesBox.innerHTML = "";
  if(cart.length===0){ linesBox.innerHTML = `<p class="muted">Tu carrito está vacío.</p>`; }
  cart.forEach(item=>{
    const line = document.createElement('div');
    line.className = "line";
    line.innerHTML = `
      <img src="${item.image}" alt="${item.nombre}" />
      <div>
        <div style="display:flex;justify-content:space-between;gap:8px">
          <strong>${item.nombre}</strong>
          <span class="remove" data-del="${item.id}">Quitar</span>
        </div>
        <div class="muted">${ARS(item.precio)} c/u</div>
        <div class="qty" style="margin-top:6px">
          <button data-dec="${item.id}">-</button>
          <span>${item.qty}</span>
          <button data-inc="${item.id}">+</button>
        </div>
      </div>
      <div><strong>${ARS(item.precio*item.qty)}</strong></div>
    `;
    linesBox.appendChild(line);
  });
  const st = subtotal(), dc = discount(), sh = shipping(), tt = st - dc + sh;
  $subtotal.textContent = ARS(st);
  $discount.textContent = ARS(dc);
  $shipping.textContent = ARS(sh);
  $total.textContent = ARS(tt);
  syncBubble();
}

// Eventos qty/eliminar
linesBox.addEventListener('click', (e)=>{
  const inc = e.target.dataset.inc, dec = e.target.dataset.dec, del = e.target.dataset.del;
  if(inc){ const it = cart.find(x=>x.id===inc); it.qty++; }
  if(dec){ const it = cart.find(x=>x.id===dec); it.qty = Math.max(1, it.qty-1); }
  if(del){ cart = cart.filter(x=>x.id!==del); }
  saveCart(); renderCart();
});

// Abrir/cerrar carrito
function openDrawer(){ drawer.classList.add('open'); }
function closeDrawer(){ drawer.classList.remove('open'); }
$("#openCart").addEventListener('click', (e)=>{ e.preventDefault(); openDrawer(); });
$("#closeCart").addEventListener('click', closeDrawer);

// Vaciar
$("#clearBtn").addEventListener('click', ()=>{ cart = []; saveCart(); renderCart(); });

// =============== WhatsApp (pedido) ===============
$("#whatsappBtn").addEventListener('click', ()=>{
  if(cart.length===0) return alert("Tu carrito está vacío.");

  const st = subtotal(), dc = discount(), sh = shipping(), tt = st - dc + sh;

  const tienda = "Tienda de Vinos";
  const fecha = nowStr();
  const nombre = currentUser?.email || "<TU NOMBRE>";
  const tel = "<TU TELÉFONO>";
  const pago = "<EFECTIVO | TRANSFERENCIA | TARJETA>";
  const entrega = "<DELIVERY>";
  const direccion = "<CALLE Y NRO, CIUDAD, PROVINCIA>";
  const maps = "<LINK_MAPS>";

  const lineas = cart.map(it => `${it.qty}x ${it.nombre} - ${ARS(it.precio)} c/u`).join("%0A");

  const msg =
`¡Hola! Te paso el resumen de mi pedido 🍷

Tienda: ${tienda}
Fecha: ${fecha}
Usuario: ${nombre}

Forma de pago: ${pago}
Total estimado: ${ARS(tt)}

Entrega: ${entrega}
Dirección: ${direccion}
🗺 Ubicación: ${maps}

Mi pedido es:
${lineas}

Subtotal: ${ARS(st)}
Descuentos: -${ARS(dc)}
Costo de envío: +${ARS(sh)}
TOTAL: ${ARS(tt)}

¿Me confirmás disponibilidad, total final y tiempo de entrega? ¡Gracias!`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
});

// =============== Contacto: links de íconos (WA + Mail) ===============
(function contactLinks(){
  const wa = document.getElementById('waLink');
  const ml = document.getElementById('mailLink');
  if(wa) wa.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  if(ml) ml.href = `mailto:${EMAIL}`;
})();

// =============== UI de cuenta (modal + menú) ===============
const authModal   = $("#authModal");
const btnOpenAuth = $("#btnOpenAuth");
const closeAuth   = $("#closeAuth");
const btnLogin    = $("#btnLogin");
const btnSignup   = $("#btnSignup");
const btnMagic    = $("#btnMagic");
const authEmail   = $("#authEmail");
const authPass    = $("#authPass");
const accountMenu = $("#accountMenu");
const accountLabel= $("#accountLabel");
const whoamiRow   = $("#whoamiRow");
const whoamiEmail = $("#whoamiEmail");
const btnLogout   = $("#btnLogout");

// abrir/cerrar modal
btnOpenAuth?.addEventListener('click', ()=>{
  if(typeof auth === "undefined") return alert("Auth no inicializado. Verifica tu config de Firebase en index.html");
  if(currentUser){ // si está logueado, abrir menú
    accountMenu.classList.toggle('open');
  }else{
    accountMenu.classList.remove('open');
    authModal.showModal();
  }
});
closeAuth?.addEventListener('click', ()=> authModal.close());

// acciones
btnLogin?.addEventListener('click', async ()=>{
  try{
    await signInWithEmailAndPassword(auth, authEmail.value.trim(), authPass.value);
    authModal.close();
  }catch(e){ alert(e.message); }
});
btnSignup?.addEventListener('click', async ()=>{
  try{
    await createUserWithEmailAndPassword(auth, authEmail.value.trim(), authPass.value);
    authModal.close();
  }catch(e){ alert(e.message); }
});
btnMagic?.addEventListener('click', async ()=>{
  try{
    const email = authEmail.value.trim();
    const actionCodeSettings = { url: window.location.href, handleCodeInApp: true };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem("emailForSignIn", email);
    alert("Te enviamos un link a tu email. Abrilo desde este navegador.");
  }catch(e){ alert(e.message); }
});
btnLogout?.addEventListener('click', async ()=>{
  try{ await signOut(auth); accountMenu.classList.remove('open'); }catch(e){ alert(e.message); }
});

// completar flujo magic link si vuelve con el link
if (typeof isSignInWithEmailLink === "function" &&
    isSignInWithEmailLink(auth, window.location.href)) {
  let email = localStorage.getItem("emailForSignIn");
  if(!email) email = prompt("Para terminar, escribí tu email:");
  signInWithEmailLink(auth, email, window.location.href).catch(err=>alert(err.message));
}

// =============== Sesión: reaccionar al login/logout ===============
onAuthStateChanged(auth, (user)=>{
  currentUser = user || null;

  // UI header
  if(currentUser){
    accountLabel.textContent = "Mi Cuenta";
    whoamiRow.style.display = "block";
    whoamiEmail.textContent = currentUser.email || "";
    btnLogout.style.display = "inline-flex";
  }else{
    accountLabel.textContent = "Ingresar";
    whoamiRow.style.display = "none";
    whoamiEmail.textContent = "";
    btnLogout.style.display = "none";
  }

  // migrar carrito si venía de guest: simple (no colisiona)
  const prevCart = cart;
  cart = loadCart();
  if(!cart?.length && prevCart?.length){
    cart = prevCart;
    saveCart();
  }
  renderCart();
  syncBubble();
});

// =============== Init ===============
(function init(){
  document.getElementById("y").textContent = new Date().getFullYear();
  renderCart();
  syncBubble();
})();
