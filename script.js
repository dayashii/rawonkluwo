document.addEventListener('DOMContentLoaded', () => {
    // --- Define Menu Items ---
    const menuItemsData = [
        // IDs validated on populateMenu
        { id: 'rawon-kluwek', name: 'Rawon Kluwek', price: 20000 },
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
    const orderHistoryKey = 'restaurantOrderHistory';

    // --- Get DOM Elements ---
    const menuTableBody = document.querySelector('#menu-table tbody');
    const totalPriceElement = document.getElementById('total-price');
    const resetButton = document.getElementById('reset-button');
    const customerNameInput = document.getElementById('customer-name-input');
    const saveActiveButton = document.getElementById('save-active-button');
    const loadableOrdersList = document.getElementById('loadable-orders-list');
    const showHistoryButton = document.getElementById('show-history-button');
    const historyModal = document.getElementById('history-modal');
    const historyContent = document.getElementById('history-content');
    const closeModalButton = historyModal.querySelector('.close-button');
    const exportTxtButton = document.getElementById('export-txt-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    // New Button Element
    const clearHistoryButton = document.getElementById('clear-history-button'); // *** ADDED

    // --- Helper Function: Format Currency ---
    function formatCurrency(amount) {
        return amount.toLocaleString('id-ID');
    }

    // --- Function: Populate Menu Table & Validate IDs ---
    function populateMenu() {
         menuTableBody.innerHTML = '';
         menuItemsData.forEach(item => {
            const row = document.createElement('tr');
            const validId = (item.id || `item-${Math.random()}`).toString().replace(/\s+/g, '-').toLowerCase();
            item.id = validId; // Update the item's ID in the data array

            row.innerHTML = `
                <td>${item.name}</td>
                <td class="quantity-controls">
                    <button class="quantity-decrease" data-id="${validId}">-</button>
                    <span class="quantity" id="quantity-${validId}">0</span>
                    <button class="quantity-increase" data-id="${validId}">+</button>
                </td>
                <td class="price">Rp ${formatCurrency(item.price)}</td>
                <td class="subtotal" id="subtotal-${validId}">Rp 0</td>
            `;
            menuTableBody.appendChild(row);
        });
    }

    // --- Function: Get Current Order Details from Form ---
    function getCurrentOrderDetails() {
        const items = [];
        let currentTotal = 0;
        menuItemsData.forEach(item => {
            const quantityElement = document.getElementById(`quantity-${item.id}`);
             if (!quantityElement) return;
            const quantity = parseInt(quantityElement.textContent) || 0;
            if (quantity > 0) {
                items.push({ id: item.id, quantity: quantity, name: item.name, price: item.price });
                currentTotal += quantity * item.price;
            }
        });
        return { items, total: currentTotal };
    }

    // --- Function: Update Total Price & Subtotals Display ---
    function updateTotalsDisplay() {
        const { total, items } = getCurrentOrderDetails();
         menuItemsData.forEach(item => {
            const subtotalElement = document.getElementById(`subtotal-${item.id}`);
             if (!subtotalElement) return;
            const orderItem = items.find(oi => oi.id === item.id);
            const subtotal = orderItem ? orderItem.quantity * item.price : 0;
            subtotalElement.textContent = `Rp ${formatCurrency(subtotal)}`;
         });
        totalPriceElement.textContent = `Rp ${formatCurrency(total)}`;
    }

    // --- Function: Reset Current Order Form ---
    function resetOrderForm() {
        document.querySelectorAll('.quantity').forEach(span => { span.textContent = '0'; });
        customerNameInput.value = '';
        updateTotalsDisplay();
    }

     // --- Functions for Local Storage (History) ---
    function getOrderHistory() {
        const dataJSON = localStorage.getItem(orderHistoryKey);
        try { return dataJSON ? JSON.parse(dataJSON) : []; }
        catch (e) { console.error(`Error parsing order history:`, e); return []; }
    }
    function saveOrderHistory(history) {
        try { localStorage.setItem(orderHistoryKey, JSON.stringify(history)); }
        catch (e) { console.error(`Error saving order history:`, e); alert("Could not save data."); }
    }
     // *** ADDED: Function to Clear History ***
     function clearAllHistory() {
         try {
             localStorage.removeItem(orderHistoryKey); // Remove the item completely
             console.log("Order history cleared from localStorage.");
             return true;
         } catch (e) {
              console.error(`Error clearing order history:`, e);
              alert("Could not clear history.");
              return false;
         }
     }

    // --- Function to Add/Update an Order in History ---
    function addOrUpdateOrderInHistory(order) {
        const history = getOrderHistory();
        const existingIndex = history.findIndex(o => o.id === order.id);
        if (existingIndex > -1) { history[existingIndex] = order; }
        else { history.push(order); }
        saveOrderHistory(history);
    }

    // --- Function: Display Loadable (Active) Orders ---
    function displayLoadableOrders() {
        const history = getOrderHistory();
        const activeOrders = history.filter(order => order.status === 'active');
        loadableOrdersList.innerHTML = '';

        if (activeOrders.length === 0) {
            loadableOrdersList.innerHTML = '<li>No active orders saved yet.</li>';
            return;
        }

        activeOrders.forEach(order => {
            const listItem = document.createElement('li');
            listItem.dataset.orderId = order.id;

            const orderInfoSpan = document.createElement('span');
            orderInfoSpan.classList.add('order-info');
            orderInfoSpan.innerHTML = `
                <span class="order-name">${order.customerName || 'Unnamed Order'}</span>
                <span class="order-total">Rp ${formatCurrency(order.total)}</span>
            `;
            orderInfoSpan.addEventListener('click', () => loadOrder(order.id));
            listItem.appendChild(orderInfoSpan);

            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('order-list-actions');

            // Approve Button
            const approveBtn = document.createElement('button');
            approveBtn.classList.add('approve-list-btn', 'button-success');
            approveBtn.dataset.orderId = order.id;
            approveBtn.title = 'Mark Order as Approved';
            approveBtn.textContent = 'Approve';
            actionsDiv.appendChild(approveBtn);

            // Discard Button
            const discardBtn = document.createElement('button');
            discardBtn.classList.add('discard-list-btn', 'button-warning');
            discardBtn.dataset.orderId = order.id;
            discardBtn.title = 'Mark Order as Discarded';
            discardBtn.textContent = 'Discard';
            actionsDiv.appendChild(discardBtn);

            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-list-btn', 'button-danger');
            deleteBtn.dataset.orderId = order.id;
            deleteBtn.title = 'Delete Order Permanently';
            deleteBtn.textContent = 'Delete';
            actionsDiv.appendChild(deleteBtn);

            listItem.appendChild(actionsDiv);
            loadableOrdersList.appendChild(listItem);
        });

        // (Re)Attach the single delegated event listener
        loadableOrdersList.removeEventListener('click', handleActiveListActions);
        loadableOrdersList.addEventListener('click', handleActiveListActions);
    }

    // --- Unified Handler for Actions on the Active Orders List ---
    function handleActiveListActions(event) {
        const target = event.target;
        if (!target.matches('.approve-list-btn, .discard-list-btn, .delete-list-btn')) return;

        const orderId = target.dataset.orderId;
        if (!orderId) return;

        const customerName = getCustomerNameById(orderId);
        let history = getOrderHistory();
        const orderIndex = history.findIndex(o => o.id === orderId);
        if (orderIndex === -1) { alert('Error: Could not find the order.'); return; }

        if (target.classList.contains('approve-list-btn')) {
            history[orderIndex].status = 'approved';
            saveOrderHistory(history);
            displayLoadableOrders();
            alert(`Order for "${customerName}" marked as approved.`);
            customerNameInput.focus();
        }
        else if (target.classList.contains('discard-list-btn')) {
            if (confirm(`Mark order for "${customerName}" as 'discarded'?`)) {
                history[orderIndex].status = 'discarded';
                saveOrderHistory(history);
                displayLoadableOrders();
                alert(`Order for "${customerName}" marked as discarded.`);
                customerNameInput.focus();
            }
        }
        else if (target.classList.contains('delete-list-btn')) {
            if (confirm(`Permanently delete order for "${customerName}"?`)) {
                history.splice(orderIndex, 1);
                saveOrderHistory(history);
                displayLoadableOrders();
                alert(`Order for "${customerName}" permanently deleted.`);
                customerNameInput.focus();
            }
        }
    }

    // Helper to get customer name
    function getCustomerNameById(orderId) {
         const order = getOrderHistory().find(o => o.id === orderId);
         return order ? order.customerName : 'Unknown Order';
    }

    // --- Function to Load an Order into the Form ---
    function loadOrder(orderId) {
         const orderToLoad = getOrderHistory().find(order => order.id === orderId);
         if (orderToLoad) {
             resetOrderForm();
             customerNameInput.value = orderToLoad.customerName;
             document.querySelectorAll('.quantity').forEach(span => { span.textContent = '0'; });
             orderToLoad.items.forEach(item => {
                 const quantityElement = document.getElementById(`quantity-${item.id}`);
                 if (quantityElement) quantityElement.textContent = item.quantity;
             });
             updateTotalsDisplay();
             alert(`Order for "${orderToLoad.customerName}" loaded (Status: ${orderToLoad.status}).`);
             customerNameInput.focus();
         } else {
             alert("Could not find the selected order ID.");
         }
     }

    // --- Event Listener: Save Active Button ---
    saveActiveButton.addEventListener('click', () => {
        const customerName = customerNameInput.value.trim();
        if (!customerName) { alert("Please enter Customer Name."); customerNameInput.focus(); return; }
        const currentOrder = getCurrentOrderDetails();
        if (currentOrder.items.length === 0) { alert("Cannot save empty order."); return; }
        const activeOrder = { id: Date.now().toString(), customerName, items: currentOrder.items, total: currentOrder.total, savedAt: new Date().toISOString(), status: 'active' };
        addOrUpdateOrderInHistory(activeOrder);
        displayLoadableOrders();
        resetOrderForm();
        alert(`Order for "${customerName}" saved as active.`);
        customerNameInput.focus();
    });

    // --- Event Listener: Clear History Button --- // *** ADDED
    clearHistoryButton.addEventListener('click', () => {
        const currentHistory = getOrderHistory();
        if (currentHistory.length === 0) {
            alert("Order history is already empty.");
            return;
        }
        if (confirm("Are you absolutely sure you want to clear ALL order history? This cannot be undone.")) {
            if (clearAllHistory()) { // Call the clearing function
                displayLoadableOrders(); // Refresh the (now empty) active list
                alert("All order history has been cleared.");
                customerNameInput.focus(); // Set focus back
            }
        }
    });


    // --- History Modal Logic (Unchanged) ---
    showHistoryButton.addEventListener('click', () => {
        const history = getOrderHistory(); historyContent.innerHTML = '';
        if (history.length === 0) { historyContent.innerHTML = '<p>No history.</p>'; }
        else { const ul = document.createElement('ul'); history.slice().reverse().forEach(o => { const li = document.createElement('li'); const d = new Date(o.savedAt).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'}); let iS = o.items.map(i=>`${i.quantity}x ${i.name}`).join(', '); const sC = `status-${o.status||'unk'}`; const sT = (o.status||'Unk').toUpperCase(); li.innerHTML = `<span class="status-badge ${sC}">${sT}</span><strong>${o.customerName}</strong><div class="history-meta">Saved: ${d}</div><div class="history-details">Items: ${iS||'N/A'}</div><span class="history-total">Rp ${formatCurrency(o.total)}</span>`; li.addEventListener('click',(e)=>{if(e.target.classList.contains('status-badge'))return; if(confirm(`Load order for "${o.customerName}"?`)){loadOrder(o.id);historyModal.style.display='none';}}); ul.appendChild(li); }); historyContent.appendChild(ul); }
        historyModal.style.display = 'block';
    });
    closeModalButton.addEventListener('click', () => { historyModal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target == historyModal) historyModal.style.display = 'none'; });

    // --- Export Functions (Unchanged) ---
    function triggerDownload(content, filename, mimeType) { const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
    function generatePlainText(history) { let t = "Order History\n====================================\n\n"; if (history.length === 0) return t + "No history available.\n"; history.forEach((o, i) => { const d = new Date(o.savedAt).toLocaleString('id-ID'); t += `Order #${i + 1} (ID: ${o.id})\nStatus: ${(o.status || 'unk').toUpperCase()}\nCustomer: ${o.customerName}\nDate: ${d}\nTotal: Rp ${formatCurrency(o.total)}\nItems:\n`; if (o.items && o.items.length > 0) o.items.forEach(it => { t += `  - ${it.quantity} x ${it.name} @ Rp ${formatCurrency(it.price || 0)}\n`; }); else t += `  (No item details)\n`; t += "------------------------------------\n\n"; }); return t; }
    function generateCSV(history) { const h = ["OrderID", "Status", "CustomerName", "DateTimeSavedISO", "TotalAmount", "ItemQuantity", "ItemName", "ItemPrice"]; let c = h.map(x => `"${x.replace(/"/g, '""')}"`).join(',') + '\n'; if (history.length === 0) return c + '"No history available."\n'; history.forEach(o => { const di = new Date(o.savedAt).toISOString(); const st = (o.status || 'unk').toUpperCase(); const cn = `"${(o.customerName || '').replace(/"/g, '""')}"`; if (o.items && o.items.length > 0) o.items.forEach(it => { const ina = `"${(it.name || '').replace(/"/g, '""')}"`; const r = [`"${o.id}"`,`"${st}"`,cn,`"${di}"`,`"${o.total}"`,`"${it.quantity}"`,ina,`"${it.price || 0}"`]; c += r.join(',') + '\n'; }); else { const r = [`"${o.id}"`,`"${st}"`,cn,`"${di}"`,`"${o.total}"`,`""`,`"(No item details)"`,`""`]; c += r.join(',') + '\n'; } }); return c; }
    exportTxtButton.addEventListener('click', () => { triggerDownload(generatePlainText(getOrderHistory()), 'order_history.txt', 'text/plain;charset=utf-8;'); });
    exportCsvButton.addEventListener('click', () => { const bom = "\uFEFF"; triggerDownload(bom + generateCSV(getOrderHistory()), 'order_history.csv', 'text/csv;charset=utf-8;'); });

    // --- Event Listeners for Quantity Buttons (Delegated - Unchanged) ---
    menuTableBody.addEventListener('click', (event) => { const t = event.target; const i = t.dataset.id; if (!i || !(t.classList.contains('quantity-increase') || t.classList.contains('quantity-decrease'))) return; const qE = document.getElementById(`quantity-${i}`); if (!qE) return; let q = parseInt(qE.textContent); if (t.classList.contains('quantity-increase')) q++; else if (t.classList.contains('quantity-decrease') && q > 0) q--; qE.textContent = q; updateTotalsDisplay(); });

    // --- Event Listener for Reset Form Button (Unchanged) ---
    resetButton.addEventListener('click', () => { if (confirm("Clear form?")) resetOrderForm(); });

    // --- Initial Setup on Load ---
    populateMenu();
    displayLoadableOrders();
    updateTotalsDisplay();
    customerNameInput.focus();

    const yearSpan = document.getElementById('current-year'); if (yearSpan) yearSpan.textContent = new Date().getFullYear();
});
