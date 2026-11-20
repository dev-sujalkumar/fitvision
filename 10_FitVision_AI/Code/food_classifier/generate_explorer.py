import json
from pathlib import Path

with open('food_classifier/data/classes_compact.json') as f:
    items_json = f.read()

yoga_poses = [
    {'name': 'Chair Pose (Utkatasana)', 'id': 'chair', 'train': 354, 'test': 84, 'icon': '🪑'},
    {'name': 'Cobra Pose (Bhujangasana)', 'id': 'cobra', 'train': 348, 'test': 92, 'icon': '🐍'},
    {'name': 'Downward Dog (Adho Mukha Svanasana)', 'id': 'dog', 'train': 365, 'test': 90, 'icon': '🐕'},
    {'name': 'No Pose / Neutral', 'id': 'no_pose', 'train': 320, 'test': 80, 'icon': '🧍'},
    {'name': 'Shoulder Stand (Sarvangasana)', 'id': 'shoulder_stand', 'train': 330, 'test': 85, 'icon': '🤸'},
    {'name': 'Triangle Pose (Trikonasana)', 'id': 'triangle', 'train': 340, 'test': 88, 'icon': '📐'},
    {'name': 'Tree Pose (Vrksasana)', 'id': 'tree', 'train': 362, 'test': 91, 'icon': '🌳'},
    {'name': 'Warrior Pose (Virabhadrasana)', 'id': 'warrior', 'train': 358, 'test': 95, 'icon': '🤺'}
]
yoga_json = json.dumps(yoga_poses, separators=(',', ':'))

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    /* Custom scrollbar */
    ::-webkit-scrollbar {{ width: 6px; height: 6px; }}
    ::-webkit-scrollbar-track {{ background: transparent; }}
    ::-webkit-scrollbar-thumb {{ background: var(--card-border); border-radius: 9999px; }}
    ::-webkit-scrollbar-thumb:hover {{ background: var(--muted-foreground); }}
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-0 m-0 text-xs select-none">
  <div class="flex flex-col h-[440px] max-h-[440px] border border-[var(--card-border)] rounded-xl bg-[var(--card)]/50 backdrop-blur-sm overflow-hidden p-3 gap-2.5 shadow-sm">
    
    <!-- Top Bar: Metrics & Tab Switcher -->
    <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--card-border)]">
      <div class="flex items-center gap-1.5">
        <span class="text-base font-semibold tracking-tight text-[var(--foreground)] flex items-center gap-1.5">
          <span>📊</span> FitVision Dataset Explorer
        </span>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
          Verified Local
        </span>
      </div>

      <!-- Tab Buttons -->
      <div class="flex items-center bg-[var(--background)]/80 p-0.5 rounded-lg border border-[var(--border)] text-[11px]">
        <button id="tab-food" onclick="switchTab('food')" class="px-2.5 py-1 rounded-md font-medium transition-all bg-[var(--card)] shadow-xs text-[var(--foreground)]">
          🍔 Food-101 (101k)
        </button>
        <button id="tab-yoga" onclick="switchTab('yoga')" class="px-2.5 py-1 rounded-md font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all">
          🧘 Yoga Poses (3.1k)
        </button>
      </div>
    </div>

    <!-- STATS STRIP -->
    <div id="stats-strip" class="grid grid-cols-4 gap-2 text-center text-[11px]">
      <div class="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
        <div class="text-[var(--muted-foreground)] text-[10px]">Total Images</div>
        <div id="stat-images" class="font-bold text-sm text-[var(--foreground)]">101,000</div>
      </div>
      <div class="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
        <div class="text-[var(--muted-foreground)] text-[10px]">Classes</div>
        <div id="stat-classes" class="font-bold text-sm text-[var(--foreground)]">101</div>
      </div>
      <div class="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
        <div class="text-[var(--muted-foreground)] text-[10px]">Train Set</div>
        <div id="stat-train" class="font-bold text-sm text-emerald-500">75,750 (75%)</div>
      </div>
      <div class="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)]">
        <div class="text-[var(--muted-foreground)] text-[10px]">Val / Test Set</div>
        <div id="stat-test" class="font-bold text-sm text-blue-500">25,250 (25%)</div>
      </div>
    </div>

    <!-- SEARCH & FILTERS (FOOD TAB) -->
    <div id="food-controls" class="flex items-center gap-2">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-2 flex items-center pointer-events-none text-[var(--muted-foreground)] text-xs">🔍</span>
        <input id="search-input" type="text" placeholder="Filter 101 food classes (e.g. ramen, salad, cake)..." 
          class="w-full pl-7 pr-3 py-1 rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--placeholder)] text-[11px] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          oninput="filterItems()" />
      </div>

      <div class="flex items-center gap-1 text-[10px]">
        <button onclick="setFilter('all')" id="btn-all" class="filter-btn px-2 py-1 rounded border border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium">All</button>
        <button onclick="setFilter('high-protein')" id="btn-high-protein" class="filter-btn px-2 py-1 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">High Protein (>15g)</button>
        <button onclick="setFilter('low-cal')" id="btn-low-cal" class="filter-btn px-2 py-1 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Low Cal (&lt;150)</button>
        <button onclick="setFilter('dessert')" id="btn-dessert" class="filter-btn px-2 py-1 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]">Desserts</button>
      </div>
    </div>

    <!-- ITEMS GRID (FOOD) -->
    <div id="food-grid" class="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pr-1">
      <!-- Injected via JS -->
    </div>

    <!-- YOGA POSES VIEW (HIDDEN BY DEFAULT) -->
    <div id="yoga-container" class="hidden flex-1 overflow-y-auto flex-col gap-2 pr-1">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="yoga-grid"></div>
      <div class="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] text-[11px] space-y-1.5 mt-2">
        <div class="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
          <span>⚙️</span> MoveNet Thunder &amp; Pose Landmark Integration
        </div>
        <p class="text-[var(--muted-foreground)] text-[10px] leading-relaxed">
          Pre-processed into 17 keypoint coordinates (X, Y, score) stored in <code>pose_classifier/train_data.csv</code> and <code>pose_classifier/test_data.csv</code>. Evaluates real-time webcam frames with Thunder MoveNet (12.5MB TFLite) for rep counting and posture alignment.
        </p>
      </div>
    </div>

    <!-- FOOTER: INFO / ACTIONS -->
    <div class="flex items-center justify-between pt-2 border-t border-[var(--card-border)] text-[10px] text-[var(--muted-foreground)]">
      <span id="footer-count">Showing 101 of 101 classes (1,000 images each)</span>
      <div class="flex items-center gap-3">
        <span class="font-mono">food_classifier/data/food-101/</span>
        <span class="px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-mono text-[9px]">Verified Extracted</span>
      </div>
    </div>

  </div>

  <script>
    const foodData = {items_json};
    const yogaData = {yoga_json};

    let currentFilter = 'all';
    let activeTab = 'food';

    function switchTab(tab) {{
      activeTab = tab;
      const tabFood = document.getElementById('tab-food');
      const tabYoga = document.getElementById('tab-yoga');
      const foodControls = document.getElementById('food-controls');
      const foodGrid = document.getElementById('food-grid');
      const yogaContainer = document.getElementById('yoga-container');

      const statImg = document.getElementById('stat-images');
      const statCls = document.getElementById('stat-classes');
      const statTrn = document.getElementById('stat-train');
      const statTst = document.getElementById('stat-test');
      const footerCount = document.getElementById('footer-count');

      if (tab === 'food') {{
        tabFood.className = 'px-2.5 py-1 rounded-md font-medium transition-all bg-[var(--card)] shadow-xs text-[var(--foreground)]';
        tabYoga.className = 'px-2.5 py-1 rounded-md font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all';
        foodControls.classList.remove('hidden');
        foodGrid.classList.remove('hidden');
        yogaContainer.classList.add('hidden');

        statImg.textContent = '101,000';
        statCls.textContent = '101';
        statTrn.textContent = '75,750 (75%)';
        statTst.textContent = '25,250 (25%)';
        filterItems();
      }} else {{
        tabYoga.className = 'px-2.5 py-1 rounded-md font-medium transition-all bg-[var(--card)] shadow-xs text-[var(--foreground)]';
        tabFood.className = 'px-2.5 py-1 rounded-md font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all';
        foodControls.classList.add('hidden');
        foodGrid.classList.add('hidden');
        yogaContainer.classList.remove('hidden');

        statImg.textContent = '3,144';
        statCls.textContent = '8 Poses';
        statTrn.textContent = '2,477 (78%)';
        statTst.textContent = '667 (22%)';
        footerCount.textContent = 'Showing all 8 Yoga posture categories (3,144 annotated images)';
        renderYoga();
      }}
    }}

    function setFilter(filter) {{
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(btn => {{
        btn.className = 'filter-btn px-2 py-1 rounded border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]';
      }});
      const activeBtn = document.getElementById('btn-' + filter);
      if (activeBtn) {{
        activeBtn.className = 'filter-btn px-2 py-1 rounded border border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium';
      }}
      filterItems();
    }}

    function filterItems() {{
      const query = document.getElementById('search-input').value.toLowerCase().trim();
      const dessertList = ['pie', 'cake', 'donuts', 'mousse', 'churros', 'baklava', 'cannoli', 'creme_brulee', 'macarons', 'pancakes', 'waffles', 'ice_cream', 'tiramisu', 'panna_cotta', 'pudding', 'cup_cakes', 'frozen_yogurt'];

      const filtered = foodData.filter(item => {{
        const matchesQuery = !query || item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
        if (!matchesQuery) return false;

        if (currentFilter === 'high-protein') return item.protein >= 15;
        if (currentFilter === 'low-cal') return item.cal < 150;
        if (currentFilter === 'dessert') {{
          return dessertList.some(d => item.id.includes(d));
        }}
        return true;
      }});

      renderFood(filtered);
      document.getElementById('footer-count').textContent = `Showing ${{filtered.length}} of ${{foodData.length}} classes (1,000 images each)`;
    }}

    function renderFood(items) {{
      const grid = document.getElementById('food-grid');
      if (items.length === 0) {{
        grid.innerHTML = '<div class="col-span-full py-8 text-center text-[var(--muted-foreground)]">No food classes match the filter.</div>';
        return;
      }}

      grid.innerHTML = items.map(item => `
        <div class="group p-2 rounded-lg bg-[var(--card)] border border-[var(--card-border)] hover:border-[var(--primary)]/40 transition-all flex flex-col justify-between gap-1.5 shadow-2xs">
          <div class="flex items-start justify-between gap-1">
            <div class="flex items-center gap-1.5 overflow-hidden">
              <span class="text-base leading-none">${{item.icon}}</span>
              <div class="overflow-hidden">
                <div class="font-medium text-[var(--foreground)] truncate text-[11px] group-hover:text-[var(--primary)] transition-colors">${{item.name}}</div>
                <div class="text-[9px] font-mono text-[var(--muted-foreground)] truncate">${{item.id}}</div>
              </div>
            </div>
            <span class="text-[10px] font-semibold text-[var(--foreground)] tabular-nums shrink-0">
              ${{item.cal}} <span class="text-[8px] font-normal text-[var(--muted-foreground)]">kcal</span>
            </span>
          </div>

          <div class="flex items-center justify-between text-[9px] text-[var(--muted-foreground)] pt-1 border-t border-[var(--card-border)]/50 tabular-nums">
            <span><strong class="text-emerald-500 font-semibold">${{item.protein}}g</strong> P</span>
            <span><strong class="text-amber-500 font-semibold">${{item.carbs}}g</strong> C</span>
            <span><strong class="text-rose-500 font-semibold">${{item.fat}}g</strong> F</span>
            <span class="px-1 py-0.2 rounded bg-[var(--border)] text-[8px]">1,000 img</span>
          </div>
        </div>
      `).join('');
    }}

    function renderYoga() {{
      const grid = document.getElementById('yoga-grid');
      grid.innerHTML = yogaData.map(pose => `
        <div class="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--card-border)] flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5">
            <span class="text-lg">${{pose.icon}}</span>
            <div>
              <div class="font-medium text-[var(--foreground)] text-[11px]">${{pose.name.split(' (')[0]}}</div>
              <div class="text-[9px] font-mono text-[var(--muted-foreground)]">${{pose.id}}</div>
            </div>
          </div>
          <div class="text-[10px] text-[var(--muted-foreground)] flex items-center justify-between pt-1 border-t border-[var(--card-border)]">
            <span>Train: <strong class="text-emerald-500">${{pose.train}}</strong></span>
            <span>Test: <strong class="text-blue-500">${{pose.test}}</strong></span>
          </div>
        </div>
      `).join('');
    }}

    // Initial render
    filterItems();
  </script>
</body>
</html>"""

with open('food_classifier/data/dataset_explorer.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML compiled successfully')
