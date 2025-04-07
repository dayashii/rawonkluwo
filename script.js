document.addEventListener('DOMContentLoaded', () => {
    // --- Define Menu Items ---
    const menuItemsData = [
        { id: 'rawon kluwek', name: 'Rawon Kluwek', price: 20000 },
	{ id: 'nasi-tempong', name: 'NASI TEMPONG', price: 20000 },
	{ id: 'mendoan', name: 'MENDOAN', price: 2000 },
        { id: 'stmj', name: 'STMJ', price: 15000 },
	{ id: 'susu-segar', name: 'SUSU SEGAR', price: 10000 },
	{ id: 'susu-madu', name: 'SUSU MADU', price: 10000 },
	{ id: 'susu-coklat', name: 'SUSU COKLAT', price: 10000 },
	{ id: 'susu-jahe', name: 'SUSU JAHE', price: 10000 },
	{ id: 'susu-madu-jahe', name: 'SUSU MADU JAHE', price: 10000 },
	{ id: 'susu-telur-madu', name: 'SUSU TELUR MADU', price: 15000 },
	{ id: 'susu-telur-jahe', name: 'SUSU TELUR JAHE', price: 15000 },
	{ id: 'susu-telur', name: 'SUSU TELUR', price: 12500 }, 
        { id: 'ketan-bubuk', name: 'KETAN BUBUK', price: 5000 },
        { id: 'kopi-saring', name: 'KOPI SARING', price: 5000 }, 
        { id: 'kopi-susu', name: 'KOPI SUSU', price: 7500 },   
    ];
    const localStorageKey = 'savedRestaurantOrders';

    // --- Get DOM Elements ---
    const menuTableBody = document.querySelector('#menu-table tbody');
    const totalPriceElement = document.getElementById('total-price');
    const resetButton = document.getElementById('reset-button');
    const customerNameInput = document.getElementById('customer-name-input');
    const saveOrderButton = document.getElementById('save-order-button');
    const savedOrdersList = document.getElementById('saved-orders-list');

    // --- Helper Function: Format Currency (Indonesian Rupiah) ---
    function formatCurrency(amount) {
        return amount.toLocaleString('id-ID');
    }

    // --- Function: Populate Menu Table ---
    function populateMenu() {
         menuTableBody.innerHTML = ''; // Clear existing rows first
         menuItemsData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td class="quantity-controls">
                    <button class="quantity-decrease" data-id="${item.id}">-</button>
                    <span class="quantity" id="quantity-${item.id}">0</span>
                    <button class="quantity-increase" data-id="${item.id}">+</button>
                </td>
                <td class="price">Rp ${formatCurrency(item.price)}</td>
                <td class="subtotal" id="subtotal-${item.id}">Rp 0</td>
            `;
            menuTableBody.appendChild(row);
        });
    }

    // --- Function: Get Current Order Details ---
    function getCurrentOrder() {
        const items = [];
        let currentTotal = 0;
        menuItemsData.forEach(item => {
            const quantityElement = document.getElementById(`quantity-${item.id}`);
            const quantity = parseInt(quantityElement.textContent) || 0;
            if (quantity > 0) {
                items.push({ id: item.id, quantity: quantity, name: item.name }); // Store name too for easier display later if needed
                currentTotal += quantity * item.price;
            }
        });
        return { items, total: currentTotal };
    }

    // --- Function: Update Total Price Display ---
    function updateTotalsDisplay() {
        const { total } = getCurrentOrder(); // Use getCurrentOrder to calculate total based on DOM
        // Update subtotals in the table
         menuItemsData.forEach(item => {
            const quantityElement = document.getElementById(`quantity-${item.id}`);
            const subtotalElement = document.getElementById(`subtotal-${item.id}`);
            const quantity = parseInt(quantityElement.textContent) || 0;
            const subtotal = quantity * item.price;
            subtotalElement.textContent = `Rp ${formatCurrency(subtotal)}`;
         });
        // Update grand total display
        totalPriceElement.textContent = `Rp ${formatCurrency(total)}`;
    }

    // --- Function: Reset Current Order Form ---
    function resetOrderForm() {
        // Reset all quantities to 0
        document.querySelectorAll('.quantity').forEach(span => {
            span.textContent = '0';
        });
        // Clear customer name
        customerNameInput.value = '';
        // Update totals display (will become 0)
        updateTotalsDisplay();
    }

     // --- Functions for Local Storage ---
    function getSavedOrders() {
        const ordersJSON = localStorage.getItem(localStorageKey);
        try {
            return ordersJSON ? JSON.parse(ordersJSON) : [];
        } catch (e) {
            console.error("Error parsing saved orders from localStorage:", e);
            return [];
        }
    }

    function saveOrders(orders) {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(orders));
        } catch (e) {
            console.error("Error saving orders to localStorage:", e);
            alert("Could not save order. Local storage might be full or unavailable.");
        }
    }

    // --- Function: Display Saved Orders in the List ---
    function displaySavedOrders() {
        const orders = getSavedOrders();
        savedOrdersList.innerHTML = '';

        if (orders.length === 0) {
            savedOrdersList.innerHTML = '<li>No saved orders yet.</li>';
            return;
        }

        orders.forEach(order => {
            const listItem = document.createElement('li');
            listItem.dataset.orderId = order.id; 

            
            listItem.innerHTML = `
                <span class="order-info">
                    <span class="order-name">${order.customerName || 'Unnamed Order'}</span>
                    - <span class="order-total">Rp ${formatCurrency(order.total)}</span>
                </span>
                <button class="delete-order-btn" data-order-id="${order.id}" title="Delete Order">X</button>
            `;

            savedOrdersList.appendChild(listItem);
        });
    }

    saveOrderButton.addEventListener('click', () => {
        const customerName = customerNameInput.value.trim();
        if (!customerName) {
            alert("Please enter a Customer Name or Table Number before saving.");
            customerNameInput.focus();
            return;
        }

        const currentOrder = getCurrentOrder();

        if (currentOrder.items.length === 0) {
            alert("Cannot save an empty order.");
            return;
        }

        const newOrder = {
            id: Date.now().toString(), 
            customerName: customerName,
            items: currentOrder.items,
            total: currentOrder.total,
            savedAt: new Date().toISOString() 
        };

        const savedOrders = getSavedOrders();
        savedOrders.push(newOrder);
        saveOrders(savedOrders);

        displaySavedOrders(); 
        resetOrderForm(); 
        alert(`Order for "${customerName}" saved successfully!`);
    });

    // --- Event Listener: Load or Delete Saved Order (using Event Delegation) ---
    savedOrdersList.addEventListener('click', (event) => {
        const target = event.target;
        const listItem = target.closest('li'); 

        if (!listItem || !listItem.dataset.orderId) return; 

        const orderIdToHandle = listItem.dataset.orderId;

        // Check if the delete button was clicked
        if (target.classList.contains('delete-order-btn')) {
            if (confirm("Are you sure you want to delete this saved order?")) {
                let savedOrders = getSavedOrders();
                savedOrders = savedOrders.filter(order => order.id !== orderIdToHandle); 
                saveOrders(savedOrders); 
                displaySavedOrders();
            }
        }
        // Otherwise, assume the user clicked the main list item to load it
        else {
            const savedOrders = getSavedOrders();
            const orderToLoad = savedOrders.find(order => order.id === orderIdToHandle);

            if (orderToLoad) {
                // Reset form first
                 resetOrderForm();

                // Set customer name
                customerNameInput.value = orderToLoad.customerName;

                // Set quantities based on loaded order
                orderToLoad.items.forEach(item => {
                    const quantityElement = document.getElementById(`quantity-${item.id}`);
                    if (quantityElement) {
                        quantityElement.textContent = item.quantity;
                    }
                });

                // Update totals display based on loaded quantities
                updateTotalsDisplay();
                 alert(`Order for "${orderToLoad.customerName}" loaded.`);
            } else {
                alert("Could not find the selected order to load.");
            }
        }
    });


    // --- Event Listeners for Quantity Buttons (using Event Delegation) ---
    menuTableBody.addEventListener('click', (event) => {
        const target = event.target;
        const itemId = target.dataset.id;

        if (!itemId || !(target.classList.contains('quantity-increase') || target.classList.contains('quantity-decrease'))) {
             return; // Exit if not a quantity button
        }

        const quantityElement = document.getElementById(`quantity-${itemId}`);
        let currentQuantity = parseInt(quantityElement.textContent);

        if (target.classList.contains('quantity-increase')) {
            currentQuantity++;
        } else if (target.classList.contains('quantity-decrease')) {
            if (currentQuantity > 0) { // Prevent going below zero
                currentQuantity--;
            }
        }

        // Update the quantity display
        quantityElement.textContent = currentQuantity;

        // Recalculate totals
        updateTotalsDisplay();
    });

    // --- Event Listener for Reset Button ---
    resetButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset the current order form?")) {
            resetOrderForm();
        }
    });

    // --- Initial Setup on Load ---
    populateMenu(); // Create the menu items in the table
    updateTotalsDisplay(); // Calculate initial total (should be 0)
    displaySavedOrders(); // Load and display any previously saved orders

    // Set dynamic year in footer (if element exists)
    const yearSpan = document.getElementById('current-year');
    if(yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});