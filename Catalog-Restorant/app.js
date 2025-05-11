// DOM Elements
const pageContainer = document.getElementById('page-container');
const searchInput = document.getElementById('search-input');
const menuToggle = document.getElementById('menu-toggle');
const navLinks = document.querySelector('.nav-links');
const heroSection = document.querySelector('.hero');
const toastContainer = document.getElementById('toast-container');

// API URL - Restaurant data source
const API_BASE_URL = 'https://restaurant-api.dicoding.dev';
const API_SMALL_IMAGE = `${API_BASE_URL}/images/small/`;
const API_MEDIUM_IMAGE = `${API_BASE_URL}/images/medium/`;
const API_LARGE_IMAGE = `${API_BASE_URL}/images/large/`;

// Local Storage Keys
const FAVORITE_RESTAURANTS_KEY = 'favorite-restaurants';

// App State
let restaurants = [];
let filteredRestaurants = [];
let favoriteRestaurants = JSON.parse(localStorage.getItem(FAVORITE_RESTAURANTS_KEY) || '[]');

// Mobile Navigation Toggle
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.innerHTML = navLinks.classList.contains('active') 
        ? '<i class="fas fa-times"></i>' 
        : '<i class="fas fa-bars"></i>';
});

// Search functionality
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm.length > 0) {
        filteredRestaurants = restaurants.filter(restaurant => 
            restaurant.name.toLowerCase().includes(searchTerm) ||
            restaurant.description.toLowerCase().includes(searchTerm) ||
            restaurant.city.toLowerCase().includes(searchTerm)
        );
        renderRestaurantList(filteredRestaurants);
    } else {
        filteredRestaurants = restaurants;
        renderRestaurantList(restaurants);
    }
});

// Router
const routes = {
    '/': {
        template: homeTemplate,
        title: 'Beranda',
        init: initHome
    },
    '/detail': {
        template: detailTemplate,
        title: 'Detail Restoran',
        init: initDetail
    },
    '/favorite': {
        template: favoriteTemplate,
        title: 'Restoran Favorit',
        init: initFavorite
    },
    '/add': {
        template: addRestaurantTemplate,
        title: 'Tambah Restoran',
        init: initAddRestaurant
    },
    '/about': {
        template: aboutTemplate,
        title: 'Tentang Kami',
        init: null
    }
};

// Function to navigate to a specific route
function navigateTo(path, params = {}) {
    const url = new URL(window.location);
    url.hash = path;
    
    // Add query parameters if necessary
    if (path === '/detail' && params.id) {
        url.hash = `${path}?id=${params.id}`;
    }
    
    window.location = url;
}

// Function to parse current route
function parseRoute() {
    const hash = window.location.hash.substring(1) || '/';
    const [path, queryString] = hash.split('?');
    
    // Parse query parameters
    const params = {};
    if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
    }
    
    return { path, params };
}

// Router handler
async function handleRouteChange() {
    const { path, params } = parseRoute();
    const route = routes[path] || routes['/'];
    
    // Show/hide hero section based on route
    if (path === '/') {
        heroSection.style.display = 'flex';
    } else {
        heroSection.style.display = 'none';
    }
    
    // Update active link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.removeAttribute('aria-current');
    });
    
    const activeLink = document.querySelector(`#${path.substring(1) || 'home'}-link`);
    if (activeLink) {
        activeLink.setAttribute('aria-current', 'page');
    }
    
    // Close mobile menu if open
    navLinks.classList.remove('active');
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Update page title
    document.title = `CulinArt - ${route.title}`;
    
    // Render content
    pageContainer.innerHTML = route.template(params);
    
    // Initialize route functionality
    if (route.init) {
        await route.init(params);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// ===== API Functions =====
// Fetch all restaurants
async function fetchRestaurants() {
    try {
        const response = await fetch(`${API_BASE_URL}/list`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message);
        }
        
        return data.restaurants;
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        throw error;
    }
}

// Fetch restaurant detail
async function fetchRestaurantDetail(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/detail/${id}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message);
        }
        
        return data.restaurant;
    } catch (error) {
        console.error('Error fetching restaurant detail:', error);
        throw error;
    }
}

// Add new restaurant
async function addRestaurant(restaurantData