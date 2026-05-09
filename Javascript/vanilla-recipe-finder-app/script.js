// ============================================================
// RECIPE FINDER - JAVASCRIPT
// Production-quality vanilla JavaScript implementation
// ============================================================

// ============================================================
// API Configuration
// ============================================================

const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// ============================================================
// DOM Elements
// ============================================================

const elements = {
    // Search
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),

    // Results
    recipesGrid: document.getElementById('recipesGrid'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    emptyState: document.getElementById('emptyState'),
    noResultsState: document.getElementById('noResultsState'),
    errorState: document.getElementById('errorState'),
    noResultsMessage: document.getElementById('noResultsMessage'),
    errorMessage: document.getElementById('errorMessage'),

    // Modal
    recipeModal: document.getElementById('recipeModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalOverlay: document.querySelector('.modal-overlay'),
    modalMealImage: document.getElementById('modalMealImage'),
    modalMealName: document.getElementById('modalMealName'),
    modalMealCategory: document.getElementById('modalMealCategory'),
    modalIngredientsList: document.getElementById('modalIngredientsList'),
    modalInstructions: document.getElementById('modalInstructions'),
    youtubeSection: document.getElementById('youtubeSection'),
    youtubeLink: document.getElementById('youtubeLink'),
};

// ============================================================
// State Management
// ============================================================

const state = {
    currentRecipes: [],
    currentMeal: null,
    isSearching: false,
    hasSearched: false,
};

// ============================================================
// API Functions
// ============================================================

/**
 * Search meals by name from TheMealDB API
 * @param {string} searchTerm - The meal name to search for
 * @returns {Promise<Array>} Array of meal objects or empty array on error
 */
async function searchMealsByName(searchTerm) {
    try {
        const response = await fetch(`${API_BASE_URL}/search.php?s=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.meals || [];
    } catch (error) {
        console.error('Error fetching meals:', error);
        throw error;
    }
}

/**
 * Fetch detailed meal information by ID
 * @param {string} mealId - The meal ID
 * @returns {Promise<Object>} Meal object with full details
 */
async function getMealById(mealId) {
    try {
        const response = await fetch(`${API_BASE_URL}/lookup.php?i=${mealId}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.meals?.[0] || null;
    } catch (error) {
        console.error('Error fetching meal details:', error);
        throw error;
    }
}

/**
 * Parse ingredients and measures from a meal object
 * @param {Object} meal - Meal object from API
 * @returns {Array<string>} Array of formatted ingredient strings
 */
function parseIngredients(meal) {
    const ingredients = [];
    
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];

        if (ingredient && ingredient.trim()) {
            const ingredientText = measure && measure.trim() 
                ? `${measure} ${ingredient}` 
                : ingredient;
            ingredients.push(ingredientText);
        }
    }

    return ingredients;
}

// ============================================================
// UI Rendering Functions
// ============================================================

/**
 * Show loading spinner and hide other states
 */
function showLoadingSpinner() {
    elements.loadingSpinner.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.noResultsState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.recipesGrid.classList.add('hidden');
}

/**
 * Hide loading spinner
 */
function hideLoadingSpinner() {
    elements.loadingSpinner.classList.add('hidden');
}

/**
 * Show empty state (no search performed yet)
 */
function showEmptyState() {
    elements.emptyState.classList.remove('hidden');
    elements.noResultsState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.recipesGrid.classList.add('hidden');
    elements.loadingSpinner.classList.add('hidden');
}

/**
 * Show no results state
 */
function showNoResults(searchTerm) {
    elements.noResultsMessage.textContent = `No recipes found for "${searchTerm}". Try another search.`;
    elements.noResultsState.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.recipesGrid.classList.add('hidden');
    elements.loadingSpinner.classList.add('hidden');
}

/**
 * Show error state
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.errorMessage.textContent = message || 'Failed to fetch recipes. Please try again.';
    elements.errorState.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.noResultsState.classList.add('hidden');
    elements.recipesGrid.classList.add('hidden');
    elements.loadingSpinner.classList.add('hidden');
}

/**
 * Show recipes grid
 */
function showRecipesGrid() {
    elements.recipesGrid.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.noResultsState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.loadingSpinner.classList.add('hidden');
}

/**
 * Render recipes grid with recipe cards
 * @param {Array} recipes - Array of recipe objects
 */
function renderRecipes(recipes) {
    elements.recipesGrid.innerHTML = '';

    recipes.forEach((recipe, index) => {
        const card = createRecipeCard(recipe);
        elements.recipesGrid.appendChild(card);
        
        // Add staggered animation
        setTimeout(() => {
            card.style.animation = 'cardSlideIn 0.5s ease-out';
        }, index * 30);
    });

    showRecipesGrid();
}

/**
 * Create a recipe card element
 * @param {Object} recipe - Recipe object
 * @returns {HTMLElement} Recipe card element
 */
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    card.innerHTML = `
        <div class="recipe-card-image-wrapper">
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-card-image">
        </div>
        <div class="recipe-card-body">
            <h3 class="recipe-card-name">${escapeHtml(recipe.strMeal)}</h3>
            <span class="recipe-card-category">${escapeHtml(recipe.strCategory || 'Uncategorized')}</span>
            <button class="recipe-card-button" data-meal-id="${recipe.idMeal}">
                View Recipe
            </button>
        </div>
    `;

    card.querySelector('.recipe-card-button').addEventListener('click', (e) => {
        e.preventDefault();
        openRecipeModal(recipe.idMeal);
    });

    // Allow clicking the entire card to open modal (except button)
    card.addEventListener('click', (e) => {
        if (e.target.closest('.recipe-card-button')) return;
        openRecipeModal(recipe.idMeal);
    });

    return card;
}

/**
 * Render modal with meal details
 * @param {Object} meal - Full meal object from API
 */
function renderModalContent(meal) {
    const ingredients = parseIngredients(meal);

    // Set image and basic info
    elements.modalMealImage.src = meal.strMealThumb;
    elements.modalMealImage.alt = meal.strMeal;
    elements.modalMealName.textContent = escapeHtml(meal.strMeal);
    elements.modalMealCategory.textContent = escapeHtml(meal.strCategory || 'Uncategorized');

    // Set instructions
    elements.modalInstructions.textContent = escapeHtml(meal.strInstructions);

    // Render ingredients list
    elements.modalIngredientsList.innerHTML = '';
    ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = escapeHtml(ingredient);
        elements.modalIngredientsList.appendChild(li);
    });

    // Handle YouTube link
    if (meal.strYoutube) {
        elements.youtubeSection.classList.remove('hidden');
        elements.youtubeLink.href = meal.strYoutube;
    } else {
        elements.youtubeSection.classList.add('hidden');
    }

    state.currentMeal = meal;
}

/**
 * Open recipe modal with meal details
 * @param {string} mealId - The meal ID to load and display
 */
async function openRecipeModal(mealId) {
    try {
        const meal = await getMealById(mealId);
        
        if (!meal) {
            showError('Failed to load recipe details.');
            return;
        }

        renderModalContent(meal);
        elements.recipeModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening recipe modal:', error);
        showError('Failed to load recipe details. Please try again.');
    }
}

/**
 * Close recipe modal
 */
function closeRecipeModal() {
    elements.recipeModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================================
// Search Handler
// ============================================================

/**
 * Handle search action
 */
async function handleSearch() {
    const searchTerm = elements.searchInput.value.trim();

    // Validation
    if (!searchTerm) {
        showEmptyState();
        state.hasSearched = false;
        return;
    }

    state.hasSearched = true;
    state.isSearching = true;
    showLoadingSpinner();

    try {
        const recipes = await searchMealsByName(searchTerm);

        if (recipes.length === 0) {
            showNoResults(searchTerm);
            state.currentRecipes = [];
        } else {
            state.currentRecipes = recipes;
            renderRecipes(recipes);
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to search recipes. Please check your connection and try again.');
        state.currentRecipes = [];
    } finally {
        state.isSearching = false;
    }
}

// ============================================================
// Event Listeners
// ============================================================

// Search button click
elements.searchBtn.addEventListener('click', handleSearch);

// Enter key in search input
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Modal close button
elements.closeModalBtn.addEventListener('click', closeRecipeModal);

// Modal overlay click (close modal)
elements.modalOverlay.addEventListener('click', closeRecipeModal);

// Prevent modal close when clicking on content
elements.modalContent = document.querySelector('.modal-content');
elements.modalContent.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Keyboard escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.recipeModal.classList.contains('hidden')) {
        closeRecipeModal();
    }
});

// ============================================================
// Initialization
// ============================================================

/**
 * Initialize the application
 */
function init() {
    // Show empty state on load
    showEmptyState();
    
    // Focus search input
    elements.searchInput.focus();
    
    console.log('Recipe Finder initialized');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}