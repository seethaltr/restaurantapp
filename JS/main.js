/* main.js - shared across pages */
/* Dependencies: jQuery, Bootstrap JS. Include these in HTML before this file. */

/* CONFIG */
const PRODUCTS_JSON = 'assets/data/products.json'; // path to data
const SITE = {
  name: 'DelishBites',
  currency: '₹'
};

/* UTILITIES */
function $id(id){ return document.getElementById(id); }
function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

/* Toast helper */
function showToast(message){
  const toastEl = $id('liveToast');
  if(!toastEl) return alert(message);
  toastEl.querySelector('.toast-body').textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastEl).show();
}

/* AUTH (very simple localStorage based) */
function registerUser({name,email,password}){
  const user = {name, email, password};
  localStorage.setItem('db_user', JSON.stringify(user));
}
function loginUser(email, password){
  const user = JSON.parse(localStorage.getItem('db_user')||'null');
  if(!user) return { ok:false, msg:'No registered user' };
  if(user.email === email && user.password === password){
    localStorage.setItem('logged_in', JSON.stringify({email:user.email,name:user.name}));
    return { ok:true, user };
  } else return { ok:false, msg:'Invalid credentials' };
}
function logoutUser(){
  localStorage.removeItem('logged_in');
}

/* CART & FAVORITES */
function getCart(){ return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }
function getFav(){ return JSON.parse(localStorage.getItem('favorite') || '[]'); }
function saveFav(f){ localStorage.setItem('favorite', JSON.stringify(f)); }

function addToCart(item){
  const cart = getCart();
  const found = cart.find(i => i.id === item.id);
  if(found) found.qty++;
  else cart.push({...item, qty:1});
  saveCart(cart);
  updateUICounts();
  showToast('Added to cart ✓');
}
function removeFromCart(id){
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  updateUICounts();
  showToast('Removed from cart');
}
function setQtyCart(id, qty){
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(item) item.qty = Math.max(1, qty);
  saveCart(cart);
  updateUICounts();
}

function toggleFav(id){
  const fav = getFav();
  const idx = fav.indexOf(id);
  if(idx === -1) fav.push(id);
  else fav.splice(idx,1);
  saveFav(fav);
  updateUICounts();
  showToast(idx===-1 ? 'Added to favorites' : 'Removed from favorites');
}

/* UI counts (cart & fav badges). Place elements with ids cart-count & fav-count in pages */
function updateUICounts(){
  const cart = getCart();
  const fav = getFav();
  if($id('cart-count')) $id('cart-count').textContent = cart.reduce((s,i)=>s+i.qty,0);
  if($id('fav-count')) $id('fav-count').textContent = fav.length;
}

/* FETCH products */
async function fetchProducts(){
  try {
    const res = await fetch(PRODUCTS_JSON, {cache:'no-store'});
    if(!res.ok) throw new Error('fetch failed');
    return await res.json();
  } catch(e){
    console.warn('fetch failed, using fallback',e);
    return [
      {"id":1,"name":"Chicken Biryani","category":"Biryani","price":220,"img":"assets/images/biryani.jpg","rating":4.6},
      {"id":2,"name":"Veg Burger","category":"Burger","price":125,"img":"assets/images/burger.jpg","rating":4.1},
      {"id":3,"name":"Chocolate Brownie","category":"Dessert","price":95,"img":"assets/images/brownie.jpg","rating":4.4},
      {"id":4,"name":"Pepperoni Pizza","category":"Pizza","price":340,"img":"assets/images/pizza.jpg","rating":4.3}
    ];
  }
}

/* Render helpers for product grid (used on index & products page) */
function makeProductCardHTML(item){
  return `
  <div class="col-12 col-sm-6 col-md-4 col-lg-3 fade-in product-col" data-category="${escapeHtml(item.category)}" data-name="${escapeHtml(item.name)}">
    <div class="card product-card h-100">
      <img src="${escapeHtml(item.img)}" class="card-img-top" alt="${escapeHtml(item.name)}" onerror="this.src='assets/images/placeholder.jpg'">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="card-title mb-0">${escapeHtml(item.name)}</h6>
          <div class="badge bg-light text-dark"> ${SITE.currency}${item.price} </div>
        </div>
        <p class="small text-muted mb-2">${escapeHtml(item.category)} · ★ ${item.rating}</p>
        <div class="mt-auto d-flex gap-2">
          <button class="btn btn-sm btn-primary w-100" onclick='addToCart(${JSON.stringify({id:item.id, price:item.price, name:item.name, img:item.img})})'>Add to cart</button>
          <button class="btn btn-sm btn-outline-secondary icon-btn" onclick='toggleFav(${item.id})' title="Favorite">♥</button>
        </div>
      </div>
    </div>
  </div>`;
}

/* Simple search/filter for product grid - call after products inserted */
function wireSearchAndFilters(){
  // search input with id "search"
  $('#search').on('input', function(){
    const q = $(this).val().toLowerCase().trim();
    $('.product-col').each(function(){
      const name = $(this).data('name').toLowerCase();
      const cat = $(this).data('category').toLowerCase();
      const show = name.indexOf(q) > -1 || cat.indexOf(q) > -1;
      $(this).toggle(show);
    });
  });
  // filter buttons with data-filter
  document.querySelectorAll('[data-filter]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const f = btn.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if(f === 'all') $('.product-col').show();
      else $('.product-col').each(function(){ $(this).toggle($(this).data('category').toLowerCase() === f.toLowerCase()); });
    });
  });
}

/* EmailJS helper for contact form - call emailjs.init('YOUR_PUBLIC_KEY') in contact page script */
function sendContactEmail(templateParams){
  // requires emailjs SDK loaded on contact.html
  return emailjs.send(templateParams.service_id, templateParams.template_id, templateParams.payload);
}

/* Page init helpers */
document.addEventListener('DOMContentLoaded', ()=> {
  updateUICounts();
  // keyboard shortcut "/" to focus search
  document.addEventListener('keydown', e=>{
    if(e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){
      const s = document.querySelector('#search');
      if(s){ e.preventDefault(); s.focus(); }
    }
  });
});
