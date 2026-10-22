fetch("assets/data/products.json")
.then(res => res.json())
.then(data => {
    displayProducts(data);
});

function displayProducts(items){
    let container = document.getElementById("productsContainer");
    container.innerHTML = "";

    items.forEach(item => {
        container.innerHTML += `
        <div class="col-md-4">
            <div class="card">
                <img src="${item.img}" class="card-img-top">
                <div class="card-body">
                    <h5>${item.name}</h5>
                    <p>₹${item.price}</p>
                    <button class="btn btn-primary" onclick="addToCart(${item.id})">Add to Cart</button>
                    <button class="btn btn-warning" onclick="addToFav(${item.id})">❤️ Favorite</button>
                </div>
            </div>
        </div>`;
    });
}
