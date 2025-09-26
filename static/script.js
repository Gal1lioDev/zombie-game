(() => {
    const inventoryList = document.getElementById('inventory-list');
    const workspace = document.getElementById('workspace');
    const resetBtn = document.getElementById('resetProgress');
    const infectionText = document.getElementById('infectionText');
    const infectionFill = document.getElementById('infectionFill');
    const zombieOverlay = document.getElementById('zombieOverlay');

    const STORAGE_KEY = 'zombie_cure_discovered_v1';
    const STORAGE_WORKSPACE = 'zombie_cure_workspace_v1';
    const STORAGE_TEAM = 'zombie_cure_team_v1';

    let recipes = {};
    let discovered = new Set();
    let infection = 0;
    let infectionDecay = 0;
    let infectionTimer = null;
    let craftingLocked = false;

    function loadDiscovered() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            discovered = new Set([...window.BASE_ELEMENTS, ...saved]);
        } catch { discovered = new Set(window.BASE_ELEMENTS); }
    }

    function saveDiscovered() {
        const baseSet = new Set(window.BASE_ELEMENTS);
        const extras = [...discovered].filter(x => !baseSet.has(x));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(extras));
    }

    function pill(label) {
        const el = document.createElement('div');
        el.className = 'pill';
        el.textContent = label;
        el.draggable = true;
        el.dataset.name = label;
        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', label);
        });
        return el;
    }

    function renderInventory() {
        inventoryList.innerHTML = '';
        const list = [...discovered].sort((a,b)=>a.localeCompare(b));
        list.forEach(name => inventoryList.appendChild(pill(name)));
    }

    function toast(msg) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(()=> t.remove(), 1600);
    }

    function rectsOverlap(a, b) {
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    function createNode(name, x, y) {
        const node = document.createElement('div');
        node.className = 'node';
        node.textContent = name;
        node.dataset.name = name;
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.draggable = false;

        let offsetX = 0, offsetY = 0, dragging = false;
        node.addEventListener('pointerdown', e => {
            if (craftingLocked) return;
            dragging = true;
            node.setPointerCapture(e.pointerId);
            offsetX = e.clientX - node.offsetLeft;
            offsetY = e.clientY - node.offsetTop;
        });
        node.addEventListener('pointermove', e => {
            if (!dragging) return;
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;
        });
        node.addEventListener('pointerup', () => {
            dragging = false;
            combineIfOverlap(node);
            removeIfOutside(node);
            persistWorkspace();
        });

        workspace.appendChild(node);
        return node;
    }

    function removeIfOutside(node) {
        const wRect = workspace.getBoundingClientRect();
        const nRect = node.getBoundingClientRect();
        if (
            nRect.right < wRect.left || nRect.left > wRect.right ||
            nRect.bottom < wRect.top || nRect.top > wRect.bottom
        ) {
            node.remove();
            toast('Removed from workspace');
        }
    }

    function keyFor(a, b) {
        return `${a}+${b}`;
    }

    function combineIfOverlap(movedNode) {
        const nodes = Array.from(workspace.querySelectorAll('.node'));
        for (const other of nodes) {
            if (other === movedNode) continue;
            if (rectsOverlap(movedNode.getBoundingClientRect(), other.getBoundingClientRect())) {
                const a = movedNode.dataset.name;
                const b = other.dataset.name;
                const res = recipes[keyFor(a,b)] || recipes[keyFor(b,a)];
                if (res) {
                    const x = (movedNode.offsetLeft + other.offsetLeft) / 2;
                    const y = (movedNode.offsetTop + other.offsetTop) / 2;
                    movedNode.remove();
                    other.remove();
                    const created = createNode(res, x, y);
                    if (!discovered.has(res)) {
                        discovered.add(res);
                        saveDiscovered();
                        renderInventory();
                        toast(`Discovered: ${res}`);
                    }
                    if (res.includes('FINAL CURE')) {
                        toast('You crafted the FINAL CURE! 🎉');
                    }
                    return created;
                }
            }
        }
        return null;
    }

    function persistWorkspace() {
        const nodes = Array.from(workspace.querySelectorAll('.node')).map(n => ({
            name: n.dataset.name,
            x: n.offsetLeft,
            y: n.offsetTop
        }));
        localStorage.setItem(STORAGE_WORKSPACE, JSON.stringify(nodes));
    }

    function restoreWorkspace() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_WORKSPACE) || '[]');
            workspace.innerHTML = '';
            if (saved.length === 0) {
                const hint = document.createElement('div');
                hint.className = 'hint';
                hint.textContent = 'Drag items from Inventory here. Overlap two to combine.';
                workspace.appendChild(hint);
            } else {
                saved.forEach(n => createNode(n.name, n.x, n.y));
            }
        } catch {
            workspace.innerHTML = '';
        }
    }

    // Drag from inventory to workspace
    inventoryList.addEventListener('dragstart', e => {
        const target = e.target.closest('.pill');
        if (!target || craftingLocked) return;
        e.dataTransfer.setData('text/plain', target.dataset.name);
    });
    workspace.addEventListener('dragover', e => e.preventDefault());
    workspace.addEventListener('drop', e => {
        if (craftingLocked) return;
        e.preventDefault();
        const name = e.dataTransfer.getData('text/plain');
        const rect = workspace.getBoundingClientRect();
        const x = e.clientX - rect.left - 55; // center-ish
        const y = e.clientY - rect.top - 18;
        createNode(name, Math.max(0,x), Math.max(0,y));
        persistWorkspace();
    });

    resetBtn.addEventListener('click', () => {
        if (!confirm('Reset discovered items and workspace?')) return;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_WORKSPACE);
        loadDiscovered();
        renderInventory();
        restoreWorkspace();
        toast('Progress reset.');
    });

    function updateInfectionUI() {
        const pct = Math.max(0, Math.min(100, infection));
        infectionText.textContent = `${Math.ceil(pct)}%`;
        infectionFill.style.width = pct + '%';
    }

    function lockCrafting() {
        craftingLocked = true;
        zombieOverlay.hidden = false;
    }

    function startInfectionTimer() {
        if (infectionTimer) clearInterval(infectionTimer);
        updateInfectionUI();
        infectionTimer = setInterval(() => {
            infection -= infectionDecay;
            updateInfectionUI();
            if (infection <= 0) {
                infection = 0;
                updateInfectionUI();
                clearInterval(infectionTimer);
                lockCrafting();
            }
        }, 1000);
    }

    // Team/Login Modal wiring
    const loginModal = document.getElementById('loginModal');
    const teamSelect = document.getElementById('teamSelect');
    const confirmTeamBtn = document.getElementById('confirmTeam');

    function populateTeams(teams) {
        teamSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a team…';
        placeholder.disabled = true;
        placeholder.selected = true;
        teamSelect.appendChild(placeholder);
        Object.keys(teams).sort().forEach(key => {
            const o = document.createElement('option');
            o.value = key;
            o.textContent = key.charAt(0).toUpperCase() + key.slice(1);
            teamSelect.appendChild(o);
        });
    }

    function applyTeamConfig(cfg, selectedTeam) {
        const teamCfg = (cfg.teams && cfg.teams[selectedTeam]) || {};
        infection = Number(teamCfg.zombieMeterStart ?? cfg.zombieMeterStart ?? 78);
        infectionDecay = Number(teamCfg.zombieMeterDecay ?? cfg.zombieMeterDecay ?? 2);
        startInfectionTimer();
    }

    function showLoginIfNeeded(cfg) {
        const savedTeam = localStorage.getItem(STORAGE_TEAM);
        populateTeams(cfg.teams || {});
        if (savedTeam && (!cfg.teams || cfg.teams[savedTeam])) {
            loginModal.hidden = true;
            applyTeamConfig(cfg, savedTeam);
            return;
        }
        loginModal.hidden = false;
        confirmTeamBtn.onclick = () => {
            const team = teamSelect.value;
            if (!team) return;
            localStorage.setItem(STORAGE_TEAM, team);
            loginModal.hidden = true;
            applyTeamConfig(cfg, team);
        };
    }

    // Bootstrap
    loadDiscovered();
    renderInventory();
    restoreWorkspace();

    fetch('/recipes').then(r => r.json()).then(data => { recipes = data; });
    fetch('/config').then(r => r.json()).then(cfg => {
        showLoginIfNeeded(cfg);
    }).catch(() => {
        // Fallback if config fetch fails
        infection = 78; infectionDecay = 2; startInfectionTimer();
    });
})();
