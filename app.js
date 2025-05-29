// Main JavaScript file for the Financial Dashboard

// Constants and global variables
const CATEGORIES = {
    food: { name: 'Food', color: 'rgba(255, 99, 132, 0.8)' },
    transportation: { name: 'Transportation', color: 'rgba(54, 162, 235, 0.8)' },
    entertainment: { name: 'Entertainment', color: 'rgba(255, 206, 86, 0.8)' },
    housing: { name: 'Housing', color: 'rgba(75, 192, 192, 0.8)' },
    health: { name: 'Health', color: 'rgba(153, 102, 255, 0.8)' },
    education: { name: 'Education', color: 'rgba(255, 159, 64, 0.8)' },
    others: { name: 'Others', color: 'rgba(199, 199, 199, 0.8)' }
};

// Class to manage financial data
class FinancialManager {
    constructor() {
        this.expenses = [];
        this.budget = 0;
        this.loadLocalData();
        this.initializeChart();
        this.updateInterface();
    }

    // Load data from localStorage
    loadLocalData() {
        try {
            const expensesData = localStorage.getItem('expenses');
            const budgetData = localStorage.getItem('budget');
            
            if (expensesData) {
                this.expenses = JSON.parse(expensesData);
            }
            
            if (budgetData) {
                this.budget = parseFloat(budgetData);
            }
        } catch (error) {
            console.error('Error loading local data:', error);
            // In case of error, initialize with empty data
            this.expenses = [];
            this.budget = 0;
        }
    }

    // Save data to localStorage
    saveLocalData() {
        try {
            localStorage.setItem('expenses', JSON.stringify(this.expenses));
            localStorage.setItem('budget', this.budget.toString());
        } catch (error) {
            console.error('Error saving local data:', error);
            alert('Could not save data locally. Please check if local storage is available.');
        }
    }

    // Add a new expense
    addExpense(description, amount, category, date) {
        const newExpense = {
            id: Date.now().toString(), // Unique ID based on timestamp
            description,
            amount: parseFloat(amount),
            category,
            date
        };
        
        this.expenses.push(newExpense);
        this.saveLocalData();
        this.updateInterface();
        
        return newExpense;
    }

    // Remove an existing expense
    removeExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.saveLocalData();
        this.updateInterface();
    }

    // Set monthly budget
    setBudget(amount) {
        this.budget = parseFloat(amount);
        this.saveLocalData();
        this.updateInterface();
    }

    // Calculate total expenses
    calculateTotalExpenses() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    // Calculate remaining balance
    calculateRemainingBalance() {
        return this.budget - this.calculateTotalExpenses();
    }

    // Calculate expenses by category
    calculateExpensesByCategory() {
        const expensesByCategory = {};
        
        // Initialize all categories with zero
        Object.keys(CATEGORIES).forEach(category => {
            expensesByCategory[category] = 0;
        });
        
        // Sum expenses by category
        this.expenses.forEach(expense => {
            if (expensesByCategory[expense.category] !== undefined) {
                expensesByCategory[expense.category] += expense.amount;
            } else {
                expensesByCategory.others += expense.amount;
            }
        });
        
        return expensesByCategory;
    }

    // Initialize the bar chart
    initializeChart() {
        const ctx = document.getElementById('expenses-chart').getContext('2d');
        
        // Chart configuration
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [], // Will be filled in update
                datasets: [{
                    label: 'Expenses by Category ($)',
                    data: [], // Will be filled in update
                    backgroundColor: [], // Will be filled in update
                    borderColor: [], // Will be filled in update
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'var(--chart-grid)'
                        },
                        ticks: {
                            color: 'var(--text-color)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'var(--chart-grid)'
                        },
                        ticks: {
                            color: 'var(--text-color)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--text-color)'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    // Update the chart with current data
    updateChart() {
        const expensesByCategory = this.calculateExpensesByCategory();
        
        // Filter only categories with values
        const filteredCategories = Object.keys(expensesByCategory)
            .filter(category => expensesByCategory[category] > 0);
        
        // Prepare data for the chart
        const labels = filteredCategories.map(category => CATEGORIES[category].name);
        const data = filteredCategories.map(category => expensesByCategory[category]);
        const colors = filteredCategories.map(category => CATEGORIES[category].color);
        
        // Update the chart
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].backgroundColor = colors;
        this.chart.data.datasets[0].borderColor = colors.map(color => color.replace('0.8', '1'));
        
        this.chart.update();
    }

    // Update the expenses table
    updateExpensesTable() {
        const expensesTable = document.getElementById('expenses-list');
        expensesTable.innerHTML = '';
        
        // Sort expenses by date (most recent first)
        const sortedExpenses = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Add each expense to the table
        sortedExpenses.forEach(expense => {
            const row = document.createElement('tr');
            
            // Format amount for display
            const formattedAmount = expense.amount.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
            });
            
            // Format date for display
            const dateObj = new Date(expense.date);
            const formattedDate = dateObj.toLocaleDateString('en-US');
            
            row.innerHTML = `
                <td>${expense.description}</td>
                <td>${CATEGORIES[expense.category].name}</td>
                <td>${formattedDate}</td>
                <td>${formattedAmount}</td>
                <td>
                    <button class="action-btn delete-btn" data-id="${expense.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            expensesTable.appendChild(row);
        });
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                this.removeExpense(id);
            });
        });
    }

    // Update the financial summary
    updateFinancialSummary() {
        const totalExpenses = this.calculateTotalExpenses();
        const remainingBalance = this.calculateRemainingBalance();
        
        // Format values for display
        const formattedBudget = this.budget.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
        
        const formattedExpenses = totalExpenses.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
        
        const formattedBalance = remainingBalance.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
        
        // Update elements in the interface
        document.getElementById('budget-amount').textContent = formattedBudget;
        document.getElementById('expenses-amount').textContent = formattedExpenses;
        document.getElementById('balance-amount').textContent = formattedBalance;
        
        // Update balance color based on value
        const balanceElement = document.getElementById('balance-amount');
        if (remainingBalance < 0) {
            balanceElement.style.color = 'var(--danger-color)';
        } else {
            balanceElement.style.color = 'var(--success-color)';
        }
    }

    // Update the progress bar
    updateProgressBar() {
        const totalExpenses = this.calculateTotalExpenses();
        const progressBar = document.getElementById('expense-progress-bar');
        const percentageElement = document.getElementById('progress-percentage');
        
        let percentage = 0;
        
        if (this.budget > 0) {
            percentage = Math.min(100, (totalExpenses / this.budget) * 100);
        }
        
        progressBar.style.width = `${percentage}%`;
        percentageElement.textContent = `${percentage.toFixed(1)}%`;
        
        // Change progress bar color based on percentage
        if (percentage >= 90) {
            progressBar.style.backgroundColor = 'var(--danger-color)';
        } else if (percentage >= 70) {
            progressBar.style.backgroundColor = 'var(--warning-color)';
        } else {
            progressBar.style.backgroundColor = 'var(--success-color)';
        }
    }

    // Update the entire interface
    updateInterface() {
        this.updateChart();
        this.updateExpensesTable();
        this.updateFinancialSummary();
        this.updateProgressBar();
    }
}

// Class to manage theme (light/dark)
class ThemeManager {
    constructor() {
        this.themeButton = document.getElementById('theme-toggle-btn');
        this.icon = this.themeButton.querySelector('i');
        this.text = this.themeButton.querySelector('span');
        
        this.loadTheme();
        this.setupEvents();
    }
    
    // Load theme saved in localStorage
    loadTheme() {
        const darkTheme = localStorage.getItem('dark-theme') === 'true';
        
        if (darkTheme) {
            document.body.classList.add('dark-mode');
            this.updateThemeButton(true);
        } else {
            document.body.classList.remove('dark-mode');
            this.updateThemeButton(false);
        }
    }
    
    // Toggle between light and dark theme
    toggleTheme() {
        const darkThemeActive = document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark-theme', darkThemeActive);
        this.updateThemeButton(darkThemeActive);
        
        // Update chart to reflect theme colors
        if (financialManager && financialManager.chart) {
            financialManager.chart.update();
        }
    }
    
    // Update the theme button
    updateThemeButton(darkTheme) {
        if (darkTheme) {
            this.icon.className = 'fas fa-sun';
            this.text.textContent = 'Light Mode';
        } else {
            this.icon.className = 'fas fa-moon';
            this.text.textContent = 'Dark Mode';
        }
    }
    
    // Set up events for the theme button
    setupEvents() {
        this.themeButton.addEventListener('click', () => this.toggleTheme());
    }
}

// Class to manage the expense form
class FormManager {
    constructor(financialManager) {
        this.financialManager = financialManager;
        this.form = document.getElementById('expense-form');
        this.descriptionInput = document.getElementById('expense-description');
        this.amountInput = document.getElementById('expense-amount');
        this.categorySelect = document.getElementById('expense-category');
        this.dateInput = document.getElementById('expense-date');
        
        this.descriptionError = document.getElementById('description-error');
        this.amountError = document.getElementById('amount-error');
        this.categoryError = document.getElementById('category-error');
        this.dateError = document.getElementById('date-error');
        
        this.setupEvents();
        this.setDefaultDate();
    }
    
    // Set the default date to today
    setDefaultDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        this.dateInput.value = `${year}-${month}-${day}`;
    }
    
    // Validate the form
    validateForm() {
        let valid = true;
        
        // Reset error messages
        this.descriptionError.style.display = 'none';
        this.amountError.style.display = 'none';
        this.categoryError.style.display = 'none';
        this.dateError.style.display = 'none';
        
        // Validate description
        if (!this.descriptionInput.value.trim()) {
            this.descriptionError.textContent = 'Description is required';
            this.descriptionError.style.display = 'block';
            valid = false;
        }
        
        // Validate amount
        const amount = parseFloat(this.amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            this.amountError.textContent = 'Please enter a valid amount greater than zero';
            this.amountError.style.display = 'block';
            valid = false;
        }
        
        // Validate category
        if (!this.categorySelect.value) {
            this.categoryError.textContent = 'Please select a category';
            this.categoryError.style.display = 'block';
            valid = false;
        }
        
        // Validate date
        if (!this.dateInput.value) {
            this.dateError.textContent = 'Date is required';
            this.dateError.style.display = 'block';
            valid = false;
        }
        
        return valid;
    }
    
    // Clear the form
    clearForm() {
        this.descriptionInput.value = '';
        this.amountInput.value = '';
        this.categorySelect.value = '';
        this.setDefaultDate();
    }
    
    // Set up form events
    setupEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (this.validateForm()) {
                this.financialManager.addExpense(
                    this.descriptionInput.value.trim(),
                    this.amountInput.value,
                    this.categorySelect.value,
                    this.dateInput.value
                );
                
                this.clearForm();
                
                // Show success message
                const message = document.createElement('div');
                message.className = 'success-message';
                message.textContent = 'Expense added successfully!';
                message.style.backgroundColor = 'var(--success-color)';
                message.style.color = 'white';
                message.style.padding = '10px';
                message.style.borderRadius = '5px';
                message.style.marginTop = '10px';
                message.style.textAlign = 'center';
                
                this.form.appendChild(message);
                
                // Remove the message after 3 seconds
                setTimeout(() => {
                    message.remove();
                }, 3000);
            }
        });
    }
}

// Class to manage financial goals
class GoalsManager {
    constructor(financialManager) {
        this.financialManager = financialManager;
        this.budgetInput = document.getElementById('budget-input');
        this.setBudgetButton = document.getElementById('set-budget-btn');
        this.feedbackMessage = document.getElementById('budget-message');
        
        this.setupEvents();
        this.loadBudget();
    }
    
    // Load the current budget into the input
    loadBudget() {
        if (this.financialManager.budget > 0) {
            this.budgetInput.value = this.financialManager.budget;
        }
    }
    
    // Show feedback message
    showMessage(text, type) {
        this.feedbackMessage.textContent = text;
        this.feedbackMessage.className = 'feedback-message ' + type;
        
        // Remove the class after 3 seconds
        setTimeout(() => {
            this.feedbackMessage.className = 'feedback-message';
        }, 3000);
    }
    
    // Set up events
    setupEvents() {
        this.setBudgetButton.addEventListener('click', () => {
            const amount = parseFloat(this.budgetInput.value);
            
            if (!isNaN(amount) && amount > 0) {
                this.financialManager.setBudget(amount);
                
                // Show success message in the fixed element
                this.showMessage('Budget set successfully!', 'success');
            } else {
                // Show error message in the fixed element
                this.showMessage('Please enter a valid amount greater than zero.', 'error');
            }
        });
    }
}

// Application initialization
let financialManager;
let themeManager;
let formManager;
let goalsManager;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    financialManager = new FinancialManager();
    themeManager = new ThemeManager();
    formManager = new FormManager(financialManager);
    goalsManager = new GoalsManager(financialManager);
    
    console.log('Financial Dashboard initialized successfully!');
});
