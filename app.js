/* -------------------------------------------------------------
   Aethera AI Travel Assistant - Application Logic
------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // App State
  let selectedInterests = new Set();
  let budgetChartInstance = null;
  let activeItinerary = null;
  let currentDestination = '';
  
  // DOM Elements
  const travelForm = document.getElementById('travel-form');
  const btnSubmit = document.getElementById('btn-submit');
  const plannerFormSection = document.getElementById('planner-form-section');
  const loadingSection = document.getElementById('loading-section');
  const loadingStatusText = document.getElementById('loading-status-text');
  const loadingProgress = document.getElementById('loading-progress');
  const resultsDashboard = document.getElementById('results-dashboard');
  const heroSection = document.getElementById('hero-section');
  
  // Form Controls
  const inputStartingLoc = document.getElementById('input-starting-loc');
  const selectMonth = document.getElementById('select-month');
  const inputDuration = document.getElementById('input-duration');
  const inputTravelers = document.getElementById('input-travelers');
  const txtTravelerLabel = document.getElementById('txt-traveler-label');
  const selectCurrency = document.getElementById('select-currency');
  const inputBudgetAmount = document.getElementById('input-budget-amount');
  const selectAccommodation = document.getElementById('select-accommodation');
  const selectTransport = document.getElementById('select-transport');
  const interestsContainer = document.getElementById('interests-container');
  
  // Dashboard Elements
  const destTitle = document.getElementById('dest-title');
  const destDuration = document.getElementById('dest-duration');
  const destMonth = document.getElementById('dest-month');
  const destTravelers = document.getElementById('dest-travelers');
  const destMatch = document.getElementById('dest-match');
  const destWeatherIcon = document.getElementById('dest-weather-icon');
  const destTemp = document.getElementById('dest-temp');
  const destWeatherDesc = document.getElementById('dest-weather-desc');
  const destDescription = document.getElementById('dest-description');
  const itineraryTimelineContainer = document.getElementById('itinerary-timeline-container');
  const valTotalBudget = document.getElementById('val-total-budget');
  const valMaxBudget = document.getElementById('val-max-budget');
  const valBudgetPercentFill = document.getElementById('val-budget-percent-fill');
  const budgetItemsContainer = document.getElementById('budget-items-container');
  const packingListsContainer = document.getElementById('packing-lists-container');
  const packingPercent = document.getElementById('packing-percent');
  const packingFraction = document.getElementById('packing-fraction');
  const packingRadialBar = document.getElementById('packing-radial-bar');
  const foodContainer = document.getElementById('food-container');
  const attractionsContainer = document.getElementById('attractions-container');
  const tipsContainer = document.getElementById('tips-container');
  
  // Actions
  const btnEditPlan = document.getElementById('btn-edit-plan');
  const btnPrint = document.getElementById('btn-print');
  const btnDownload = document.getElementById('btn-download');
  const btnToggleAllDays = document.getElementById('btn-toggle-all-days');
  const addPackingItemForm = document.getElementById('add-packing-item-form');
  const inputPackingName = document.getElementById('input-packing-name');
  const selectPackingCategory = document.getElementById('select-packing-category');
  
  // Modal / Settings Elements
  const btnSettings = document.getElementById('btn-settings');
  const modalSettings = document.getElementById('modal-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const inputApiKey = document.getElementById('input-api-key');
  const btnClearKey = document.getElementById('btn-clear-key');
  const btnSaveKey = document.getElementById('btn-save-key');
  const apiStatusArea = document.getElementById('api-status-area');
  const apiStatusText = document.getElementById('api-status-text');
  
  // Toast
  const toastNotification = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');

  /* -----------------------------------------------------------
     API Key Management & Settings Modal
  ----------------------------------------------------------- */
  
  // Load saved API Key from localStorage on start
  const getApiKey = () => localStorage.getItem('GEMINI_API_KEY') || '';
  const setApiKey = (key) => localStorage.setItem('GEMINI_API_KEY', key);
  const removeApiKey = () => localStorage.removeItem('GEMINI_API_KEY');
  
  const updateAPIIndicator = () => {
    const key = getApiKey();
    const dot = apiStatusArea.querySelector('.status-dot');
    if (key) {
      dot.className = 'status-dot status-live';
      apiStatusText.textContent = 'Live Gemini AI Mode (Connected)';
      apiStatusArea.style.borderColor = 'var(--success)';
    } else {
      dot.className = 'status-dot status-simulated';
      apiStatusText.textContent = 'Simulated AI Mode (Default)';
      apiStatusArea.style.borderColor = 'var(--border-glass)';
    }
  };

  btnSettings.addEventListener('click', () => {
    inputApiKey.value = getApiKey();
    updateAPIIndicator();
    modalSettings.classList.remove('hidden');
  });

  const closeModal = () => modalSettings.classList.add('hidden');
  btnCloseSettings.addEventListener('click', closeModal);
  modalSettings.addEventListener('click', (e) => {
    if (e.target === modalSettings) closeModal();
  });

  btnSaveKey.addEventListener('click', () => {
    const key = inputApiKey.value.trim();
    if (key) {
      setApiKey(key);
      showToast('API Key saved successfully!');
    } else {
      removeApiKey();
      showToast('Switched to simulated AI mode.');
    }
    updateAPIIndicator();
    closeModal();
  });

  btnClearKey.addEventListener('click', () => {
    removeApiKey();
    inputApiKey.value = '';
    updateAPIIndicator();
    showToast('API Key cleared.');
    closeModal();
  });

  function showToast(msg, isError = false) {
    toastMessage.textContent = msg;
    if (isError) {
      toastNotification.classList.add('toast-error');
    } else {
      toastNotification.classList.remove('toast-error');
    }
    toastNotification.classList.remove('hidden');
    setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 3000);
  }

  /* -----------------------------------------------------------
     Form Counters & Tags
  ----------------------------------------------------------- */
  
  // Trip Duration Counter
  document.getElementById('btn-duration-minus').addEventListener('click', () => {
    let val = parseInt(inputDuration.value);
    if (val > 1) inputDuration.value = val - 1;
  });
  document.getElementById('btn-duration-plus').addEventListener('click', () => {
    let val = parseInt(inputDuration.value);
    if (val < 14) inputDuration.value = val + 1;
  });

  // Travelers Counter
  const updateTravelerLabel = (count) => {
    if (count === 1) txtTravelerLabel.textContent = 'Solo Traveler';
    else if (count === 2) txtTravelerLabel.textContent = 'Couple';
    else if (count <= 4) txtTravelerLabel.textContent = `Family / Small Group (${count})`;
    else txtTravelerLabel.textContent = `Large Group (${count})`;
  };

  document.getElementById('btn-travelers-minus').addEventListener('click', () => {
    let val = parseInt(inputTravelers.value);
    if (val > 1) {
      inputTravelers.value = val - 1;
      updateTravelerLabel(val - 1);
    }
  });
  document.getElementById('btn-travelers-plus').addEventListener('click', () => {
    let val = parseInt(inputTravelers.value);
    if (val < 10) {
      inputTravelers.value = val + 1;
      updateTravelerLabel(val + 1);
    }
  });

  // Interests multi-select
  interestsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.interest-tag');
    if (!btn) return;
    
    const interest = btn.getAttribute('data-interest');
    if (selectedInterests.has(interest)) {
      selectedInterests.delete(interest);
      btn.classList.remove('selected');
    } else {
      selectedInterests.add(interest);
      btn.classList.add('selected');
    }
  });

  /* -----------------------------------------------------------
     Tabs Controller
  ----------------------------------------------------------- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  /* -----------------------------------------------------------
     Form Submission & Validation
  ----------------------------------------------------------- */
  travelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate Inputs
    let isValid = true;

    // Starting location
    if (!inputStartingLoc.value.trim()) {
      inputStartingLoc.parentElement.classList.add('has-error');
      isValid = false;
    } else {
      inputStartingLoc.parentElement.classList.remove('has-error');
    }

    // Month
    if (!selectMonth.value) {
      selectMonth.parentElement.classList.add('has-error');
      isValid = false;
    } else {
      selectMonth.parentElement.classList.remove('has-error');
    }

    // Budget Amount
    const budgetVal = parseFloat(inputBudgetAmount.value);
    if (isNaN(budgetVal) || budgetVal < 100) {
      inputBudgetAmount.parentElement.parentElement.classList.add('has-error');
      isValid = false;
    } else {
      inputBudgetAmount.parentElement.parentElement.classList.remove('has-error');
    }

    // Accommodation
    if (!selectAccommodation.value) {
      selectAccommodation.parentElement.classList.add('has-error');
      isValid = false;
    } else {
      selectAccommodation.parentElement.classList.remove('has-error');
    }

    // Transport
    if (!selectTransport.value) {
      selectTransport.parentElement.classList.add('has-error');
      isValid = false;
    } else {
      selectTransport.parentElement.classList.remove('has-error');
    }

    // Interests
    if (selectedInterests.size === 0) {
      document.getElementById('err-interests').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('err-interests').style.display = 'none';
    }

    if (!isValid) {
      showToast('Please correct form errors.', true);
      return;
    }

    // Gathering Form Data
    const formData = {
      startingLocation: inputStartingLoc.value.trim(),
      travelMonth: selectMonth.value,
      duration: parseInt(inputDuration.value),
      travelers: parseInt(inputTravelers.value),
      budgetCategory: document.querySelector('input[name="budget-level"]:checked').value,
      maxBudget: budgetVal,
      currency: selectCurrency.value,
      accommodation: selectAccommodation.value,
      transportation: selectTransport.value,
      interests: Array.from(selectedInterests)
    };

    // Transition UI to loading state
    plannerFormSection.classList.add('hidden');
    heroSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const apiKey = getApiKey();
      let itineraryData = null;

      if (apiKey) {
        itineraryData = await fetchLiveGeminiItinerary(formData, apiKey);
      } else {
        itineraryData = await runSimulatedAI(formData);
      }

      renderDashboard(itineraryData, formData);
      
      loadingSection.classList.add('hidden');
      resultsDashboard.classList.remove('hidden');
      
      // Force trigger Lucide icon rendering on dynamically loaded elements
      lucide.createIcons();
    } catch (err) {
      console.error(err);
      loadingSection.classList.add('hidden');
      plannerFormSection.classList.remove('hidden');
      heroSection.classList.remove('hidden');
      showToast(err.message || 'Failed to generate itinerary. Please try again.', true);
    }
  });

  // Edit Preferences
  btnEditPlan.addEventListener('click', () => {
    resultsDashboard.classList.add('hidden');
    plannerFormSection.classList.remove('hidden');
    heroSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* -----------------------------------------------------------
     Live Gemini API Request
  ----------------------------------------------------------- */
  async function fetchLiveGeminiItinerary(data, key) {
    updateLoadingProgress(10, 'Connecting to Gemini AI Engine...', 'Securing server link...');
    
    const prompt = `You are Aethera, a luxury AI travel design specialist.
Create an extremely detailed, highly personalized travel planning proposal based on these user settings:
- Starting Location: ${data.startingLocation}
- Travel Month: ${data.travelMonth}
- Duration: ${data.duration} Days
- Travelers count: ${data.travelers} (${txtTravelerLabel.textContent})
- Budget Tier: ${data.budgetCategory} (Backpacker, Mid-Range, or Luxury)
- Max Budget Amount: ${data.maxBudget} ${data.currency}
- Preferred Accommodation Type: ${data.accommodation}
- Preferred Transportation: ${data.transportation}
- Core Travel Interests: ${data.interests.join(', ')}

Please choose the absolute BEST single destination match in the world that satisfies these parameters. If the user interests lean towards nature/adventure, select a famous natural wonder. If culture/city, choose a grand metropolis.
Ensure the trip is realistic for the travel month's weather.

Your response must be JSON format ONLY. Do not include markdown code block formatting (such as \`\`\`json) in your raw response. Return only the raw JSON.
The JSON must adhere strictly to this schema:
{
  "destination": "City, Country",
  "matchScore": 98,
  "weather": {
    "temp": "21°C",
    "desc": "Pleasant, mild evenings"
  },
  "description": "Provide a 2-3 sentence overview explaining why this is the perfect destination matching their budget and specific interests.",
  "itinerary": [
    {
      "day": 1,
      "theme": "Day Theme/Focus",
      "activities": [
        {
          "time": "Morning",
          "title": "Activity Title",
          "desc": "Detailed activity description, things to look out for.",
          "cost": "$20 or $0"
        },
        {
          "time": "Afternoon",
          "title": "Activity Title",
          "desc": "Detailed activity description.",
          "cost": "$0"
        },
        {
          "time": "Evening",
          "title": "Activity Title",
          "desc": "Evening plans, dinners, vistas, local events.",
          "cost": "$40"
        }
      ]
    }
  ],
  "budget": {
    "currency": "${data.currency}",
    "totalEstimated": 2450,
    "categories": [
      { "name": "Accommodation", "cost": 1100, "desc": "Covers ${data.duration} nights of lodging" },
      { "name": "Transportation", "cost": 600, "desc": "Flights, rail passes, local taxis" },
      { "name": "Food & Dining", "cost": 450, "desc": "Bistro lunches, dining, local tastings" },
      { "name": "Activities", "cost": 200, "desc": "Entry tickets, historical tours, tour guides" },
      { "name": "Miscellaneous", "cost": 100, "desc": "Souvenirs, emergencies, snacks" }
    ]
  },
  "packingList": {
    "Clothing": ["Item A", "Item B"],
    "Toiletries": ["Item A", "Item B"],
    "Electronics": ["Item A", "Item B"],
    "Documents": ["Item A", "Item B"],
    "Essential": ["Item A", "Item B"]
  },
  "localFood": [
    { "name": "Name of Specialty dish", "emoji": "🍱", "desc": "What is it, what ingredients, how it is made." },
    { "name": "Specialty Dish 2", "emoji": "🍜", "desc": "Description..." }
  ],
  "attractions": [
    { "name": "Attraction Landmark 1", "desc": "Brief history/reason to visit." },
    { "name": "Attraction Landmark 2", "desc": "Description..." }
  ],
  "tips": [
    { "title": "Cultural Etiquette", "desc": "Etiquette, greetings, dress code.", "type": "culture" },
    { "title": "Local Transport", "desc": "Best way to get around (Metro, cards).", "type": "transit" },
    { "title": "Safety & Scams", "desc": "Tipping standards, safety advice, areas to watch.", "type": "safety" }
  ]
}

Ensure the itinerary matches exactly ${data.duration} days. Make the activities reflect the user's selected interests: if Foodie is selected, include culinary tours or night markets. If Adventure is selected, outline hikes, snorkeling, or outdoor guides. Write details eloquently.
`;

    updateLoadingProgress(35, 'Transmitting parameters to Gemini...', 'Analyzing budget constraints...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    updateLoadingProgress(70, 'Receiving AI formulation...', 'Formatting daily activities...');

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}. Please verify your Gemini API key in settings.`);
    }

    const resJson = await response.json();
    
    updateLoadingProgress(90, 'Parsing travel blueprints...', 'Compiling custom checklists...');

    try {
      const text = resJson.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(text);
      return parsedData;
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON', e);
      throw new Error('Gemini API returned an invalid itinerary format. Try clicking "Generate" again.');
    }
  }

  /* -----------------------------------------------------------
     Simulated AI Local Engine
  ----------------------------------------------------------- */
  const localDestinations = [
    {
      name: "Tokyo, Japan",
      tags: ["Culture", "Food", "Shopping", "History"],
      temp: "18°C",
      weatherDesc: "Crisp & Sunny",
      weatherIcon: "cloud-sun",
      idealMonths: ["April", "May", "September", "October", "November"],
      description: "A futuristic metropolis blending age-old shrines, bustling street markets, and incredible gastronomy. Perfectly suits your cultural curiosity and culinary cravings.",
      baseDayActivities: [
        { time: "Morning", title: "Historic Senso-ji Temple & Asakusa", desc: "Wander through Tokyo's oldest temple gate and explore traditional Nakamise-dori shopping stalls.", cost: 0 },
        { time: "Afternoon", title: "Shibuya Crossing & Meiji Shrine", desc: "Witness the world's busiest pedestrian crossing, then step into a serene forest sanctuary dedicated to Emperor Meiji.", cost: 0 },
        { time: "Evening", title: "Shinjuku Omoide Yokocho Food Tour", desc: "Dine on grilled yakitori skewers and draft beer in vintage neon alleys.", cost: 25 }
      ],
      optionalActivities: {
        Adventure: [
          { time: "Morning", title: "Mount Mitake Hiking Trail", desc: "Take a rail commute to escape into nature and hike past shrines, streams, and mossy rock gardens.", cost: 15 },
          { time: "Afternoon", title: "Go-Karting through Akihabara", desc: "Drive custom mini-karts through the neon-drenched streets of Tokyo's electronic hub.", cost: 50 },
          { time: "Evening", title: "Indoor Rock Climbing", desc: "Challenge yourself on climbing walls at a high-tech gym in Shinjuku.", cost: 20 }
        ],
        Culture: [
          { time: "Morning", title: "Traditional Japanese Tea Ceremony", desc: "Learn the Zen art of matcha whisking in a quiet Ueno garden house.", cost: 30 },
          { time: "Afternoon", title: "Edo-Tokyo Museum", desc: "Explore giant interactive models of ancient castles and Edo-period dwellings.", cost: 8 },
          { time: "Evening", title: "Kabuki Theater Performance", desc: "Watch traditional classical drama acts at the landmark Kabukiza Theatre in Ginza.", cost: 40 }
        ],
        Food: [
          { time: "Morning", title: "Tsukiji Outer Market Sushi Tasting", desc: "Sample freshly sliced tuna, grilled tamagoyaki egg, and sea urchin from street stalls.", cost: 35 },
          { time: "Afternoon", title: "Ramen Cooking Workshop", desc: "Blend custom broth and hand-stretch wheat noodles under a master chef.", cost: 45 },
          { time: "Evening", title: "Izakaya Hopping in Ebisu", desc: "Explore local food stalls trying tempura, wagyu beef sliders, and sake pairings.", cost: 50 }
        ],
        Nature: [
          { time: "Morning", title: "Shinjuku Gyoen National Garden", desc: "Walk through manicured French, English, and Japanese landscape gardens.", cost: 4 },
          { time: "Afternoon", title: "Ueno Park & Pond Boating", desc: "Paddle in swan boats across the lotus-covered Shinobazu Pond.", cost: 10 },
          { time: "Evening", title: "Sunset Vista at Shibuya Sky", desc: "Look out across a panoramic 360-degree open-air deck as Mt. Fuji silhouettes in the distance.", cost: 18 }
        ],
        Relaxation: [
          { time: "Morning", title: "Onsen Bathing Spa", desc: "Relax in healing, mineral-rich thermal springs at Spa LaQua.", cost: 28 },
          { time: "Afternoon", title: "Zen Garden Meditation", desc: "Sit quietly viewing Zen rock arrangements at Ryogen-in Temple.", cost: 5 },
          { time: "Evening", title: "Premium Matcha Dessert Cafe", desc: "Indulge in artisanal green tea parfaits and treats in Ginza.", cost: 15 }
        ],
        Shopping: [
          { time: "Morning", title: "Ginza Luxury Boutiques", desc: "Browse architectural flagships and high-end department store basements.", cost: 0 },
          { time: "Afternoon", title: "Takeshita Street & Harajuku", desc: "Hunt for wacky street fashion, crazy vintage shops, and giant cotton candy.", cost: 0 },
          { time: "Evening", title: "Akihabara Electronic Town", desc: "Shop retro gaming cartridges, anime figurines, and multi-story gadgets.", cost: 0 }
        ],
        Nightlife: [
          { time: "Morning", title: "Slept-In Morning Walk", desc: "Enjoy a slow, late coffee in Tokyo's hipster enclave, Shimokitazawa.", cost: 6 },
          { time: "Afternoon", title: "Golden Gai Exploration", desc: "Visit tiny bars in Shinjuku and grab craft beers.", cost: 15 },
          { time: "Evening", title: "Roppongi DJ Lounge & Karaoke", desc: "Sing your heart out in private neon karaoke rooms with friends.", cost: 30 }
        ],
        History: [
          { time: "Morning", title: "Imperial Palace Grounds Tour", desc: "Stroll the stone walls, historic bridges, and East Gardens of the active palace.", cost: 0 },
          { time: "Afternoon", title: "National Museum of Tokyo", desc: "View priceless collections of samurai swords, ancient kimonos, and screens.", cost: 10 },
          { time: "Evening", title: "Historical walk of Yanaka Ginza", desc: "Wander through a quiet retro shopping street that survived WWII bombings.", cost: 0 }
        ]
      },
      foods: [
        { name: "Tonkotsu Ramen", emoji: "🍜", desc: "Rich, creamy 16-hour pork bone broth served with tender chashu slices and hand-pulled noodles." },
        { name: "Fresh Nigiri Sushi", emoji: "🍣", desc: "Pristine catches of fatty tuna, sea bream, and salmon served on vinegared sushi rice." },
        { name: "Takoyaki", emoji: "🐙", desc: "Crispy wheat-batter balls stuffed with octopus, drizzled with savory sauce and bonito flakes." }
      ],
      attractions: [
        { name: "Shibuya Crossing", desc: "The legendary multi-directional intersection representing Tokyo's vibrant energy." },
        { name: "Senso-ji Temple", desc: "Asakusa's ancient Buddhist landmark dating back to the year 645 AD." },
        { name: "teamLab Planets", desc: "An immersive digital art museum where you walk through water and flower gardens." }
      ],
      tips: [
        { title: "No Tipping Allowed", desc: "Tipping is not customary in Japan; exceptional service is standard. Leaving cash may result in waiters chasing you down to return it.", type: "culture" },
        { title: "Get a Transit Pass", desc: "Load money onto a mobile Pasmo or Suica card to seamlessly tap in and out of all trains, buses, and convenience stores.", type: "transit" },
        { title: "Carry Cash", desc: "While card usage is rising, many traditional ramen machines and shrines only accept coins and physical paper yen.", type: "safety" }
      ]
    },
    {
      name: "Rome, Italy",
      tags: ["History", "Culture", "Food"],
      temp: "22°C",
      weatherDesc: "Warm & Mediterranean",
      weatherIcon: "sun",
      idealMonths: ["April", "May", "June", "September", "October"],
      description: "A monumental open-air museum where ancient ruins stand next to cozy trattorias. Matches your affinity for world-famous historical landmarks and pasta.",
      baseDayActivities: [
        { time: "Morning", title: "Colosseum & Roman Forum", desc: "Walk the arena floors where gladiators fought, and view the arches of the ancient Roman Republic.", cost: 22 },
        { time: "Afternoon", title: "Trevi Fountain & Pantheon", desc: "Toss a coin into Trevi for good luck, and view the Pantheon's massive unreinforced concrete dome.", cost: 5 },
        { time: "Evening", title: "Trastevere Dinner Stroll", desc: "Cross the Tiber river and dine on traditional carbonara pasta at a candle-lit sidewalk table.", cost: 30 }
      ],
      optionalActivities: {
        History: [
          { time: "Morning", title: "Vatican Museums & Sistine Chapel", desc: "Marvel at Michelangelo's ceiling frescoes and the massive St. Peter's Basilica.", cost: 28 },
          { time: "Afternoon", title: "Appian Way Catacombs", desc: "Explore subterranean Christian burial sites dug into soft volcanic rock.", cost: 10 },
          { time: "Evening", title: "Castel Sant'Angelo sunset", desc: "Climb the ramparts of Hadrian's ancient mausoleum for panoramic city views.", cost: 15 }
        ],
        Food: [
          { time: "Morning", title: "Campo de' Fiori Market", desc: "Taste artisanal cheeses, fresh olives, and truffle spreads under a historic square.", cost: 12 },
          { time: "Afternoon", title: "Pizza making masterclass", desc: "Learn to stretch, flour, and fire a thin-crust Roman pizza in a brick oven.", cost: 40 },
          { time: "Evening", title: "Gelato and Espresso Crawl", desc: "Visit historic cafes for Rome's thickest gelato and creamy double shots.", cost: 10 }
        ],
        Culture: [
          { time: "Morning", title: "Borghese Gallery Masterpieces", desc: "Admire breathtaking Bernini sculptures and dramatic Caravaggio paintings.", cost: 18 },
          { time: "Afternoon", title: "Piazza Navona Street Artists", desc: "Sit beside Bernini's Fountain of the Four Rivers watching street theater.", cost: 0 },
          { time: "Evening", title: "Classical Concert in a Ruins Basilica", desc: "Listen to Vivaldi performed live in a historic Roman church chamber.", cost: 35 }
        ]
      },
      foods: [
        { name: "Pasta Carbonara", emoji: "🍝", desc: "Egg yolk, pecorino romano, cracked black pepper, and crispy guanciale tossed with al dente rigatoni." },
        { name: "Carciofi alla Romana", emoji: "🥬", desc: "Fresh Roman artichokes braised with wild mint, garlic, olive oil, and white wine." },
        { name: "Pizza al Taglio", emoji: "🍕", desc: "Rectangular, airy Roman bakery pizza cut-to-order and sold by weight." }
      ],
      attractions: [
        { name: "The Colosseum", desc: "Rome's massive gladiatorial amphitheater constructed in 80 AD." },
        { name: "Vatican City", desc: "The micro-state containing St. Peter's and centuries of Renaissance art collections." },
        { name: "The Pantheon", desc: "A perfectly preserved 2,000-year-old temple boasting a massive circular dome sky-window." }
      ],
      tips: [
        { title: "Stand at the Bar", desc: "Drinking coffee sitting down at a table can cost triple the price compared to standing at the bar with locals.", type: "culture" },
        { title: "Free Drinking Water", desc: "Look for 'Nasoni' (curved nose iron fountains) spitting out ice-cold mountain spring water all over the city. It's completely free.", type: "transit" },
        { title: "Beware of Pickpockets", desc: "Keep bags zipped and close to your chest, especially on crowded tourist transit lines like Bus 64 and Metro A.", type: "safety" }
      ]
    },
    {
      name: "Bali, Indonesia",
      tags: ["Relaxation", "Nature", "Adventure", "Beach"],
      temp: "28°C",
      weatherDesc: "Warm & Tropical",
      weatherIcon: "palmtree",
      idealMonths: ["June", "July", "August", "September"],
      description: "A tropical island paradise featuring lush rice terraces, historic temples, and pristine surf shores. Ideal for balancing outdoor activities and spiritual unwind.",
      baseDayActivities: [
        { time: "Morning", title: "Tegallalang Rice Terraces Trek", desc: "Walk through terraced green valleys and try the iconic jungle swing.", cost: 10 },
        { time: "Afternoon", title: "Ubud Monkey Forest Walk", desc: "Wander through a sacred mossy forest sanctuary housing hundreds of cheeky macaques.", cost: 6 },
        { time: "Evening", title: "Jimbaran Beach Seafood Dinner", desc: "Feast on grilled red snapper and prawns directly on the beach sands at sunset.", cost: 20 }
      ],
      optionalActivities: {
        Adventure: [
          { time: "Morning", title: "Mount Batur Sunrise Trek", desc: "Hike up an active volcano in the dark to watch the sun rise above clouds.", cost: 45 },
          { time: "Afternoon", title: "Ayung River White Water Rafting", desc: "Navigate Class II & III rapids cutting through deep rain forests and waterfalls.", cost: 30 },
          { time: "Evening", title: "Night Safari Journey", desc: "Ride in caged trams through habitats of tigers, lions, and nocturnal beasts.", cost: 40 }
        ],
        Nature: [
          { time: "Morning", title: "Sekumpul Waterfall Trekking", desc: "Climb down tropical jungle paths to view three towering waterfalls cascade into valleys.", cost: 15 },
          { time: "Afternoon", title: "Snorkeling at Nusa Penida", desc: "Swim alongside majestic manta rays in turquoise waters off the coast.", cost: 35 },
          { time: "Evening", title: "Uluwatu Temple Cliff Walk", desc: "Look out from 70-meter-high cliffs over the Indian Ocean while monkeys stroll by.", cost: 5 }
        ],
        Relaxation: [
          { time: "Morning", title: "Balinese Massage & Flower Bath", desc: "Enjoy a deep-tissue oil massage followed by a luxurious bath filled with red and gold petals.", cost: 25 },
          { time: "Afternoon", title: "Yoga & Sound Healing", desc: "Join meditation workshops inside giant open-air bamboo shalas in Ubud.", cost: 12 },
          { time: "Evening", title: "Seminyak Sunset Beach Lounge", desc: "Recline on beanbags listening to acoustic tunes under colorful umbrellas.", cost: 10 }
        ]
      },
      foods: [
        { name: "Nasi Goreng", emoji: "🍳", desc: "Spiced fried rice topped with fried egg, chicken satay skewers, and crispy prawn crackers." },
        { name: "Babi Guling", emoji: "🐖", desc: "Spit-roasted suckling pig stuffed with lemongrass, turmeric, ginger, and chili." },
        { name: "Sate Lilit", emoji: "🍢", desc: "Minced fish and coconut paste wrapped around lemongrass skewers and grilled over charcoal." }
      ],
      attractions: [
        { name: "Uluwatu Temple", desc: "A sea temple perched majestically on the edge of a steep ocean cliff." },
        { name: "Tegallalang Rice Terraces", desc: "The iconic valley of emerald green agricultural terraces." },
        { name: "Nusa Penida Island", desc: "A short boat ride away, boasting dramatic landscapes like Kelingking T-Rex Beach." }
      ],
      tips: [
        { title: "Dress Modestly at Temples", desc: "Both men and women must wear a sarong ( waist sash) when entering sacred temples. Most temples rent them at gates for free.", type: "culture" },
        { title: "Rent a Scooter (With Care)", desc: "Scooters are the best way to beat traffic, but only ride if you have an international license, helmet, and experience. Otherwise, use Gojek/Grab apps.", type: "transit" },
        { title: "Drink Bottled Water Only", desc: "Avoid tap water ('Bali Belly' is real). Use bottled or filtered water even to brush your teeth, and ensure ice in drinks is made from filtered water.", type: "safety" }
      ]
    },
    {
      name: "Reykjavik, Iceland",
      tags: ["Nature", "Adventure"],
      temp: "2°C",
      weatherDesc: "Cold & Frosty",
      weatherIcon: "snowflake",
      idealMonths: ["December", "January", "February", "June", "July", "August"],
      description: "A gateway to geothermal wonders, glacier hikes, and dancing auroras. Perfectly matches your love for epic outdoor explorations and dramatic landscapes.",
      baseDayActivities: [
        { time: "Morning", title: "Golden Circle Route (Geysir & Gullfoss)", desc: "Watch Strokkur geyser blast steam 30 meters high, then see the double cascade Gullfoss waterfall.", cost: 0 },
        { time: "Afternoon", title: "Thingvellir National Park Walk", desc: "Walk through the rift valley where the North American and Eurasian tectonic plates drift apart.", cost: 0 },
        { time: "Evening", title: "Northern Lights Hunting Tour", desc: "Commute outside city lights with guides to search for glowing green aurora curtains.", cost: 60 }
      ],
      optionalActivities: {
        Adventure: [
          { time: "Morning", title: "Katla Ice Cave Exploration", desc: "Put on crampons and step inside natural blue ice formations beneath glaciers.", cost: 130 },
          { time: "Afternoon", title: "Snowmobiling on Langjokull", desc: "Speed across high volcanic icecaps on a thrilling snowmobile expedition.", cost: 150 },
          { time: "Evening", title: "Geothermal Soup Dinner", desc: "Dine on hearty lamb stew inside greenhouses heated by volcanic vents.", cost: 35 }
        ],
        Nature: [
          { time: "Morning", title: "Seljalandsfoss & Skogafoss", desc: "Walk directly behind the falling curtain of Seljalandsfoss, and see the giant Skogafoss spray.", cost: 0 },
          { time: "Afternoon", title: "Reynisfjara Black Sand Beach", desc: "Stroll basalt columns and dodge powerful sneaker waves on coal-black shores.", cost: 0 },
          { time: "Evening", title: "Blue Lagoon Geothermal Bath", desc: "Soak in silica-rich milky blue waters while sipping a drink in the snow.", cost: 85 }
        ]
      },
      foods: [
        { name: "Icelandic Lamb Soup", emoji: "🥣", desc: "Warm, slow-simmered soup stuffed with local grass-fed lamb, potatoes, rutabaga, and herbs." },
        { name: "Skyr Yogurt", emoji: "🥛", desc: "A creamy, high-protein dairy product with a thick texture, eaten with milk and fresh berries." },
        { name: "Plokkfiskur", emoji: "🐟", desc: "A comfort dish of boiled cod and mashed potatoes baked with white onion cream sauce." }
      ],
      attractions: [
        { name: "Gullfoss Waterfall", desc: "A spectacular two-tiered canyon waterfall plunging into deep glacial gorges." },
        { name: "The Blue Lagoon", desc: "Iceland's signature geothermal outdoor spa heated to a constant 38°C." },
        { name: "Hallgrimskirkja", desc: "Reykjavik's massive church, inspired by volcanic basalt rock formations." }
      ],
      tips: [
        { title: "Layer Your Clothing", desc: "Icelandic weather changes within minutes. Always carry thermal layers, windproof/waterproof shells, and wool socks.", type: "safety" },
        { title: "Card Payments Everywhere", desc: "Iceland is almost entirely cashless. Even public toilets and remote wilderness parking meters accept credit cards.", type: "transit" },
        { title: "Respect the Environment", desc: "Never step off marked paths or walk on delicate moss. Moss takes decades to grow back if damaged.", type: "culture" }
      ]
    },
    {
      name: "Cairo, Egypt",
      tags: ["History", "Culture"],
      temp: "24°C",
      weatherDesc: "Sunny & Dry",
      weatherIcon: "sun",
      idealMonths: ["October", "November", "December", "January", "February"],
      description: "An ancient capital showcasing millennia-old pyramids, grand mosques, and busy bazaars. A dream destination for history buffs.",
      baseDayActivities: [
        { time: "Morning", title: "Great Pyramids of Giza & Sphinx", desc: "Stand before the last surviving wonder of the ancient world and the limestone Sphinx.", cost: 15 },
        { time: "Afternoon", title: "The Egyptian Museum", desc: "View the golden funerary mask of Tutankhamun and thousands of pharaonic treasures.", cost: 10 },
        { time: "Evening", title: "Khan el-Khalili Bazaar Market", desc: "Navigate narrow medieval alleys buying spices, perfumes, and drinking mint tea.", cost: 5 }
      ],
      optionalActivities: {
        History: [
          { time: "Morning", title: "Saqqara Step Pyramid", desc: "Visit Djoser's pyramid, the oldest stone complex in architectural history.", cost: 12 },
          { time: "Afternoon", title: "Saladin Citadel & Alabaster Mosque", desc: "Climb the hilltop fortress of Cairo and view the grand Ottoman architecture.", cost: 8 },
          { time: "Evening", title: "Nile River Felucca Sunset Ride", desc: "Sail on a traditional wooden sailboat along the Nile as the skyline lights up.", cost: 20 }
        ],
        Culture: [
          { time: "Morning", title: "Coptic Cairo Exploration", desc: "Wander peaceful stone alleys visiting the Hanging Church and St. Sergius.", cost: 0 },
          { time: "Afternoon", title: "Museum of Islamic Art", desc: "Admire ceramic work, wooden woodcarvings, and rare manuscripts.", cost: 6 },
          { time: "Evening", title: "Sufi Whirling Dervish Show", desc: "Watch hypnotic Tannoura spiritual dancers spin in colorful skirts.", cost: 15 }
        ]
      },
      foods: [
        { name: "Koshary", emoji: "🍛", desc: "Egypt's national dish: rice, macaroni, lentils, and chickpeas topped with spicy tomato sauce and crispy onions." },
        { name: "Taameya", emoji: "🧆", desc: "Egyptian falafel made from crushed fava beans instead of chickpeas, fried to green crunchiness." },
        { name: "Molokhia", emoji: "🍲", desc: "A leafy green soup cooked in garlic and coriander broth, served with rice and chicken." }
      ],
      attractions: [
        { name: "Pyramids of Giza", desc: "The legendary royal tombs built for Pharaohs over 4,500 years ago." },
        { name: "Khan el-Khalili", desc: "A vibrant 14th-century marketplace filled with brass, silver, and spices." },
        { name: "Citadel of Saladin", desc: "A massive medieval Islamic fortification housing majestic mosques." }
      ],
      tips: [
        { title: "Hire Local Guides", desc: "Navigating historical ruins can be overwhelming due to sellers. A licensed guide keeps sellers at bay and clarifies the complex history.", type: "safety" },
        { title: "Agree on Taxi Prices", desc: "Always make sure white taxis turn on meters, or use Uber to get pre-calculated prices without negotiating.", type: "transit" },
        { title: "Conservative Dress", desc: "Keep shoulders and knees covered in public areas, and women should carry a scarf to cover hair inside mosques.", type: "culture" }
      ]
    }
  ];

  function runSimulatedAI(data) {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        if (progress === 20) {
          updateLoadingProgress(20, 'Consulting planetary transit calendars...', 'Calculating matching scores...');
        } else if (progress === 40) {
          updateLoadingProgress(40, 'Cross-referencing budget profiles...', 'Checking average weather temperatures...');
        } else if (progress === 60) {
          updateLoadingProgress(60, 'Selecting optimal destination...', 'Structuring daily itineraries...');
        } else if (progress === 80) {
          updateLoadingProgress(80, 'Compiling custom packing checklists...', 'Fetching local food highlights...');
        } else if (progress === 100) {
          clearInterval(interval);
          
          // Generate final data
          try {
            const result = generateSimulatedData(data);
            resolve(result);
          } catch (err) {
            reject(new Error('Failed to generate itinerary. Please try again.'));
          }
        }
      }, 500);
    });
  }

  function updateLoadingProgress(pct, status, subtext) {
    loadingProgress.style.width = `${pct}%`;
    loadingStatusText.textContent = status;
    document.getElementById('loading-subtext').textContent = subtext;
  }

  function generateSimulatedData(data) {
    // 1. Destination Matching Score Algorithm
    let bestDest = localDestinations[0];
    let maxScore = -1;

    localDestinations.forEach(dest => {
      // Base score: overlap of interests
      let overlap = dest.tags.filter(tag => data.interests.includes(tag)).length;
      let score = overlap * 25; // 25 points per matching interest

      // Month match bonus
      if (dest.idealMonths.includes(data.travelMonth)) {
        score += 15;
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestDest = dest;
      }
    });

    // Capping maxScore at 100
    const finalScore = Math.min(98, Math.max(75, maxScore));

    // 2. Day-wise Itinerary Generation
    const itinerary = [];
    const chosenInterests = data.interests;
    
    // Cycle through selected interests to fetch activities
    let interestIdx = 0;

    for (let d = 1; d <= data.duration; d++) {
      let dayTheme = "Classic Sights";
      let dayActivities = [];

      if (d === 1) {
        dayTheme = "Arrival & Introduction";
        dayActivities = JSON.parse(JSON.stringify(bestDest.baseDayActivities));
      } else if (d === data.duration) {
        dayTheme = "Souvenirs & Departure";
        dayActivities = [
          { time: "Morning", title: "Souvenir Shopping & local cafes", desc: "Purchase unique local treats and crafts from a neighborhood marketplace.", cost: 15 },
          { time: "Afternoon", title: "Leisurely neighborhood walk", desc: "Take a final slow stroll taking photos of scenic areas.", cost: 0 },
          { time: "Evening", title: "Depart starting homebound commute", desc: "Transfer to the transit hub/airport for your flight home.", cost: 0 }
        ];
      } else {
        // Grab activities from interest pools
        const currentInterest = chosenInterests[interestIdx % chosenInterests.length];
        interestIdx++;

        dayTheme = `${currentInterest} Exploration`;
        
        // Check if interest exists in destination's custom pool, fallback to base
        const pool = bestDest.optionalActivities[currentInterest] || bestDest.baseDayActivities;
        dayActivities = JSON.parse(JSON.stringify(pool));
      }

      itinerary.push({
        day: d,
        theme: dayTheme,
        activities: dayActivities
      });
    }

    // 3. Budget Calculator
    // Units in USD (or base currency).
    let dailyAcc = 40;
    let dailyTrans = 10;
    let dailyFood = 20;
    let dailyAct = 15;
    let dailyMisc = 8;

    if (data.budgetCategory === 'midrange') {
      dailyAcc = 110;
      dailyTrans = 25;
      dailyFood = 45;
      dailyAct = 30;
      dailyMisc = 15;
    } else if (data.budgetCategory === 'luxury') {
      dailyAcc = 280;
      dailyTrans = 80;
      dailyFood = 95;
      dailyAct = 70;
      dailyMisc = 40;
    }

    // Adjust for traveler count and days
    const accommodationCost = dailyAcc * data.duration;
    const transportationCost = dailyTrans * data.duration * Math.ceil(data.travelers / 2);
    const foodCost = dailyFood * data.duration * data.travelers;
    const activitiesCost = dailyAct * data.duration * data.travelers;
    const miscCost = dailyMisc * data.duration * data.travelers;

    const totalEstimatedBase = accommodationCost + transportationCost + foodCost + activitiesCost + miscCost;
    
    // Currency multiplier (approximations)
    const currencyMultipliers = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.78,
      JPY: 150.0,
      AUD: 1.5
    };
    
    const mult = currencyMultipliers[data.currency] || 1.0;
    
    const categories = [
      { name: "Accommodation", cost: Math.round(accommodationCost * mult), desc: `Covers ${data.duration} nights of lodging` },
      { name: "Transportation", cost: Math.round(transportationCost * mult), desc: "Train passes, car rentals, and regional transits" },
      { name: "Food & Dining", cost: Math.round(foodCost * mult), desc: "Sidewalk dinners, lunches, street bites" },
      { name: "Activities", cost: Math.round(activitiesCost * mult), desc: "Historical guides, entry tickets, tours" },
      { name: "Miscellaneous", cost: Math.round(miscCost * mult), desc: "Emergency funds, gifts, local snacks" }
    ];

    const totalEstimated = categories.reduce((sum, cat) => sum + cat.cost, 0);

    // 4. Packing List Generator
    const clothingItems = ["Comfy walking sneakers", "Underwear & socks", "Casual shirts", "Jeans or trousers"];
    const toiletriesItems = ["Toothbrush & paste", "Shampoo & body wash", "Deodorant", "Travel moisturizer"];
    const electronicsItems = ["Phone charger", "Universal plug adapter", "Power bank"];
    const documentsItems = ["Passport & travel visas", "Flight ticket prints", "Hotel bookings", "Credit cards & cash"];
    const essentialItems = ["First aid Band-Aids", "Refillable water bottle", "Lip balm", "Tissues"];

    // Temperature based packing
    const tempNum = parseInt(bestDest.temp);
    if (tempNum < 10) {
      clothingItems.push("Heavy thermal coat", "Thermal base layers", "Gloves", "Woolen scarf & beanie");
      essentialItems.push("Hand warmers");
    } else if (tempNum <= 20) {
      clothingItems.push("Light windproof jacket", "Layered sweaters");
      essentialItems.push("Travel umbrella");
    } else {
      clothingItems.push("Swimwear", "Sunglasses", "Shorts & sandals", "Brimmed sun hat");
      essentialItems.push("Sunscreen SPF 50", "Insect repellent spray");
    }

    // Interest based packing
    if (data.interests.includes("Adventure")) {
      clothingItems.push("Hiking boots");
      essentialItems.push("Small outdoor daypack", "Waterproof drybag");
    }
    if (data.interests.includes("Shopping")) {
      essentialItems.push("Collapsible packable tote bag");
    }
    if (data.interests.includes("Nightlife")) {
      clothingItems.push("Smart-casual evening outfit", "Perfume/Cologne atomizer");
    }

    return {
      destination: bestDest.name,
      matchScore: finalScore,
      weather: {
        temp: bestDest.temp,
        desc: bestDest.weatherDesc,
        icon: bestDest.weatherIcon
      },
      description: bestDest.description,
      itinerary: itinerary,
      budget: {
        currency: data.currency,
        totalEstimated: totalEstimated,
        categories: categories
      },
      packingList: {
        Clothing: clothingItems,
        Toiletries: toiletriesItems,
        Electronics: electronicsItems,
        Documents: documentsItems,
        Essential: essentialItems
      },
      localFood: bestDest.foods,
      attractions: bestDest.attractions,
      tips: bestDest.tips
    };
  }

  /* -----------------------------------------------------------
     Itinerary Render Engine
  ----------------------------------------------------------- */
  function renderDashboard(data, formInputs) {
    currentDestination = data.destination;
    activeItinerary = data;

    // Header Meta
    destTitle.textContent = data.destination;
    destDuration.innerHTML = `<i data-lucide="calendar"></i> ${formInputs.duration} Day${formInputs.duration > 1 ? 's' : ''}`;
    destMonth.innerHTML = `<i data-lucide="sun"></i> ${formInputs.travelMonth}`;
    destTravelers.innerHTML = `<i data-lucide="users"></i> ${formInputs.travelers} Traveler${formInputs.travelers > 1 ? 's' : ''}`;
    destMatch.innerHTML = `<i data-lucide="thumbs-up"></i> ${data.matchScore}% Match`;
    
    // Weather
    destTemp.textContent = data.weather.temp;
    destWeatherDesc.textContent = data.weather.desc;
    
    // Select correct weather icon
    let iconName = 'cloud-sun';
    const descLower = data.weather.desc.toLowerCase();
    if (descLower.includes('sunny') || descLower.includes('hot') || descLower.includes('mediterranean')) iconName = 'sun';
    else if (descLower.includes('cold') || descLower.includes('snow') || descLower.includes('frosty')) iconName = 'snowflake';
    else if (descLower.includes('rain') || descLower.includes('wet') || descLower.includes('humid')) iconName = 'cloud-rain';
    destWeatherIcon.setAttribute('data-lucide', iconName);

    // Overview Description
    destDescription.textContent = data.description;

    // 1. ITINERARY Accordion population
    itineraryTimelineContainer.innerHTML = '';
    data.itinerary.forEach((day, index) => {
      const dayCard = document.createElement('div');
      dayCard.className = `day-card ${index === 0 ? 'active' : ''}`;
      
      dayCard.innerHTML = `
        <div class="day-header">
          <div class="day-title-group">
            <span class="day-badge">Day ${day.day}</span>
            <div>
              <h4>${day.theme}</h4>
            </div>
          </div>
          <i data-lucide="chevron-down" class="day-icon-chevron"></i>
        </div>
        <div class="day-content">
          <div class="timeline-list">
            ${day.activities.map(act => `
              <div class="timeline-item ${act.time.toLowerCase()}">
                <div class="timeline-dot"></div>
                <div class="activity-header">
                  <div class="activity-time-title">
                    <span class="time-slot">${act.time}</span>
                    <span class="activity-title">${act.title}</span>
                  </div>
                  ${act.cost ? `<span class="activity-cost">${act.cost}</span>` : ''}
                </div>
                <p class="activity-desc">${act.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      dayCard.querySelector('.day-header').addEventListener('click', () => {
        dayCard.classList.toggle('active');
      });

      itineraryTimelineContainer.appendChild(dayCard);
    });

    // Reset expand/collapse text
    btnToggleAllDays.textContent = "Expand All Days";

    // 2. BUDGET RENDER
    const currencySymbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$' };
    const curSym = currencySymbols[data.budget.currency] || '$';

    valTotalBudget.textContent = `${curSym}${data.budget.totalEstimated.toLocaleString()}`;
    valMaxBudget.textContent = `of ${curSym}${formInputs.maxBudget.toLocaleString()} max budget`;

    const pctUsed = Math.min(100, (data.budget.totalEstimated / formInputs.maxBudget) * 100);
    valBudgetPercentFill.style.width = `${pctUsed}%`;
    if (pctUsed > 95) {
      valBudgetPercentFill.style.background = 'var(--danger)';
    } else if (pctUsed > 80) {
      valBudgetPercentFill.style.background = 'var(--accent)';
    } else {
      valBudgetPercentFill.style.background = 'linear-gradient(to right, var(--primary), var(--secondary))';
    }

    // Chart.js doughnut
    renderBudgetChart(data.budget);

    // Budget List
    budgetItemsContainer.innerHTML = '';
    const colors = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];
    data.budget.categories.forEach((cat, index) => {
      const pct = Math.round((cat.cost / data.budget.totalEstimated) * 100) || 0;
      const card = document.createElement('div');
      card.className = 'budget-item-card';
      card.innerHTML = `
        <div class="budget-item-meta">
          <div class="budget-color-indicator" style="background-color: ${colors[index % colors.length]}"></div>
          <div>
            <span class="budget-item-name">${cat.name}</span>
            <p class="budget-item-desc">${cat.desc}</p>
          </div>
        </div>
        <div class="budget-item-val">
          <span class="budget-item-price">${curSym}${cat.cost.toLocaleString()}</span>
          <span class="budget-item-pct">${pct}%</span>
        </div>
      `;
      budgetItemsContainer.appendChild(card);
    });

    // 3. PACKING LIST RENDER
    // Load from local storage if exists, otherwise initialize new
    let savedState = loadPackingChecklistState(data.destination);
    
    // Group packing list items into category cards
    packingListsContainer.innerHTML = '';
    Object.keys(data.packingList).forEach(catName => {
      const items = data.packingList[catName];
      const categoryCard = document.createElement('div');
      categoryCard.className = 'packing-category-card';
      
      let icon = 'backpack';
      if (catName === 'Clothing') icon = 'shirt';
      else if (catName === 'Toiletries') icon = 'smile';
      else if (catName === 'Electronics') icon = 'cpu';
      else if (catName === 'Documents') icon = 'file-text';
      else if (catName === 'Essential') icon = 'shield-alert';

      categoryCard.innerHTML = `
        <h4><i data-lucide="${icon}"></i> ${catName}</h4>
        <div class="packing-list-items" data-category="${catName}">
          ${items.map(item => {
            const itemKey = `${catName}-${item}`;
            const isChecked = savedState[itemKey] ? true : false;
            return `
              <label class="packing-item ${isChecked ? 'checked' : ''}">
                <input type="checkbox" data-itemkey="${itemKey}" ${isChecked ? 'checked' : ''}>
                <span class="checkbox-custom"></span>
                <span class="item-name">${item}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;

      packingListsContainer.appendChild(categoryCard);
    });

    // Attach listeners to newly created packing items
    attachChecklistListeners();
    updatePackingProgress();

    // 4. FOOD GUIDE RENDER
    foodContainer.innerHTML = '';
    data.localFood.forEach(food => {
      const foodCard = document.createElement('div');
      foodCard.className = 'food-card';
      foodCard.innerHTML = `
        <div class="food-emoji">${food.emoji}</div>
        <div class="food-meta">
          <h4>${food.name}</h4>
          <p>${food.desc}</p>
        </div>
      `;
      foodContainer.appendChild(foodCard);
    });

    // 5. ATTRACTIONS & TIPS RENDER
    attractionsContainer.innerHTML = '';
    data.attractions.forEach((att, index) => {
      const attCard = document.createElement('div');
      attCard.className = 'attraction-card';
      attCard.innerHTML = `
        <div class="attraction-num">${index + 1}</div>
        <div class="attraction-info">
          <h4>${att.name}</h4>
          <p>${att.desc}</p>
        </div>
      `;
      attractionsContainer.appendChild(attCard);
    });

    tipsContainer.innerHTML = '';
    data.tips.forEach(tip => {
      const tipCard = document.createElement('div');
      tipCard.className = `tip-card tip-${tip.type}`;
      
      let icon = 'info';
      if (tip.type === 'culture') icon = 'landmark';
      else if (tip.type === 'transit') icon = 'train';
      else if (tip.type === 'safety') icon = 'shield-alert';

      tipCard.innerHTML = `
        <div class="tip-icon"><i data-lucide="${icon}"></i></div>
        <div class="tip-info">
          <h4>${tip.title}</h4>
          <p>${tip.desc}</p>
        </div>
      `;
      tipsContainer.appendChild(tipCard);
    });
  }

  /* -----------------------------------------------------------
     Chart.js budget visualization
  ----------------------------------------------------------- */
  function renderBudgetChart(budget) {
    if (budgetChartInstance) {
      budgetChartInstance.destroy();
    }

    const labels = budget.categories.map(c => c.name);
    const dataVals = budget.categories.map(c => c.cost);
    const colors = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

    const ctx = document.getElementById('budget-doughnut-chart').getContext('2d');
    
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    budgetChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataVals,
          backgroundColor: colors,
          borderColor: 'rgba(15, 23, 42, 0.9)',
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Use custom lists for legend details
          },
          tooltip: {
            padding: 12,
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const cur = budget.currency;
                const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$' };
                const sym = symbols[cur] || '$';
                return ` ${context.label}: ${sym}${context.parsed.toLocaleString()}`;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  /* -----------------------------------------------------------
     Checklist State Management
  ----------------------------------------------------------- */
  function loadPackingChecklistState(dest) {
    const key = `packing_state_${dest.replace(/\s+/g, '_')}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  }

  function savePackingChecklistState(dest, state) {
    const key = `packing_state_${dest.replace(/\s+/g, '_')}`;
    localStorage.setItem(key, JSON.stringify(state));
  }

  function attachChecklistListeners() {
    const checkboxes = packingListsContainer.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(chk => {
      chk.addEventListener('change', () => {
        const itemkey = chk.getAttribute('data-itemkey');
        const isChecked = chk.checked;
        const parentLabel = chk.closest('.packing-item');
        
        if (isChecked) {
          parentLabel.classList.add('checked');
        } else {
          parentLabel.classList.remove('checked');
        }
        
        // Save back
        const state = loadPackingChecklistState(currentDestination);
        if (isChecked) state[itemkey] = true;
        else delete state[itemkey];
        savePackingChecklistState(currentDestination, state);

        updatePackingProgress();
      });
    });
  }

  function updatePackingProgress() {
    const checkboxes = packingListsContainer.querySelectorAll('input[type="checkbox"]');
    const checked = packingListsContainer.querySelectorAll('input[type="checkbox"]:checked');
    
    const total = checkboxes.length;
    const count = checked.length;
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);

    packingPercent.textContent = `${pct}%`;
    packingFraction.textContent = `${count}/${total} Items`;

    // Radial Progress Ring fill calculation
    // Circle perimeter: 2 * PI * r = 2 * 3.14159 * 40 = 251.2
    const offset = 251.2 - (pct / 100) * 251.2;
    packingRadialBar.style.strokeDashoffset = offset;
  }

  // Add Custom Packing Item
  addPackingItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const itemName = inputPackingName.value.trim();
    const categoryName = selectPackingCategory.value;

    if (!itemName) return;

    // Append to active packing list
    if (activeItinerary && activeItinerary.packingList) {
      if (!activeItinerary.packingList[categoryName]) {
        activeItinerary.packingList[categoryName] = [];
      }
      activeItinerary.packingList[categoryName].push(itemName);

      // Re-render the categories list matching the target category
      const targetCategoryList = packingListsContainer.querySelector(`.packing-list-items[data-category="${categoryName}"]`);
      
      const itemKey = `${categoryName}-${itemName}`;
      const label = document.createElement('label');
      label.className = 'packing-item';
      label.innerHTML = `
        <input type="checkbox" data-itemkey="${itemKey}">
        <span class="checkbox-custom"></span>
        <span class="item-name">${itemName}</span>
      `;
      targetCategoryList.appendChild(label);

      // Reset Form
      inputPackingName.value = '';

      // Re-attach listeners and recalculate progress
      attachChecklistListeners();
      updatePackingProgress();
      showToast(`Added "${itemName}" to ${categoryName}`);
    }
  });

  /* -----------------------------------------------------------
     Itinerary Day Cards expansion controls
  ----------------------------------------------------------- */
  btnToggleAllDays.addEventListener('click', () => {
    const dayCards = itineraryTimelineContainer.querySelectorAll('.day-card');
    const isExpanding = btnToggleAllDays.textContent === "Expand All Days";

    dayCards.forEach(card => {
      if (isExpanding) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    btnToggleAllDays.textContent = isExpanding ? "Collapse All Days" : "Expand All Days";
  });

  /* -----------------------------------------------------------
     PDF Generation & Print Layout Toggles
  ----------------------------------------------------------- */
  
  // 1. Native Print dialog triggers media queries
  btnPrint.addEventListener('click', () => {
    // Expand all accordions first so they are visible on paper
    const dayCards = itineraryTimelineContainer.querySelectorAll('.day-card');
    dayCards.forEach(card => card.classList.add('active'));
    window.print();
  });

  // 2. Direct PDF compile using html2pdf.js
  btnDownload.addEventListener('click', () => {
    // Show a loading feedback toast
    showToast('Compiling PDF brochure, please wait...');

    // Save current active elements state to restore later
    const dayCards = itineraryTimelineContainer.querySelectorAll('.day-card');
    const activeStates = Array.from(dayCards).map(card => card.classList.contains('active'));
    const prevActiveTabBtn = document.querySelector('.tab-btn.active');
    const prevActivePane = document.querySelector('.tab-pane.active');

    // Prepare container for PDF export:
    // Expand all day cards
    dayCards.forEach(card => card.classList.add('active'));
    
    // Add temporary body class that styles layout in printable block format
    document.body.classList.add('pdf-exporting');

    // Configure html2pdf options
    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     `Aethera-Itinerary-${currentDestination.replace(/[\s,]+/g, '-')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#080c14', // Match theme background
        logging: false 
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css'] } // Use custom page-break-before rules defined in CSS
    };

    const targetEl = document.getElementById('results-dashboard');

    html2pdf().set(opt).from(targetEl).toContainer().toCanvas().toPdf().save().then(() => {
      // Restore previous UI layouts after PDF is completed
      document.body.classList.remove('pdf-exporting');
      
      dayCards.forEach((card, idx) => {
        if (activeStates[idx]) card.classList.add('active');
        else card.classList.remove('active');
      });

      showToast('PDF downloaded successfully!');
    }).catch(err => {
      console.error(err);
      document.body.classList.remove('pdf-exporting');
      showToast('PDF download failed. Try printing as PDF.', true);
    });
  });
});
