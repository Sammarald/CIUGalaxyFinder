"use strict";

let dataLoadComplete = false;

const CONFIG = {
    // Map coordinates
    MAP_MIN: 0,
    MAP_MAX: 999,

    // Camera
    INITIAL_ZOOM: 1.0,
    MIN_ZOOM: 1.0,
    MAX_ZOOM: 4096.0,
    FOCUS_ZOOM: 1024,
    ZOOM_FACTOR: 1.75, // how much to multiply/divide zoom

    // Stars
    MIN_STAR_SCREEN_RADIUS: 2,
    STAR_BASE_RADIUS: 0.2,
    BINARY_STAR_SEPARATION: 0.5,

    // Orbit variables
    MOON_ORBIT_SPACING: 0.35,
    PLANET_GAP: 0.15,
    DEFAULT_ORBIT_SPEED: 0.01,
    CONNECTION_WIDTH: 2,
    ORBIT_WIDTH: 0.7,

    // Detail levels
    SYSTEM_LABEL_ZOOM: 4.0,
    SYSTEM_DETAIL_ZOOM: 8.0,
    OBJECT_LABEL_ZOOM: 64.0,
    ORBIT_ZOOM: 16.0,

    // Displaying wormholes
    SHOW_WORMHOLES_BY_DEFAULT: false
};

const ENVIRONMENTS = [
    "Massive",
    "Hot",
    "Electric",
    "Frozen"
];

const pointerState = {
    active: new Map(),

    dragging: false,

    startX: 0,
    startY: 0,

    lastX: 0,
    lastY: 0,

    moved: false,

    pinchDistance: 0,
    pinchCenterX: 0,
    pinchCenterY: 0,
};

function getPointerDistance(a, b) {
    return Math.hypot(
        a.clientX - b.clientX,
        a.clientY - b.clientY
    );
}


function getPointerCenter(a, b) {
    const rect =
        canvas.getBoundingClientRect();

    return {
        x:
            (
                a.clientX +
                b.clientX
            ) / 2 -
            rect.left,

        y:
            (
                a.clientY +
                b.clientY
            ) / 2 -
            rect.top
    };
}

function setControlsEnabled(enabled) {
    dataLoadComplete = enabled;

    menuButton.disabled =
        !enabled;

    searchListButton.disabled =
        !enabled;

    sortSearchButton.disabled =
        !enabled;

    backButton.disabled =
        !enabled;

    planetSearchModeButton.disabled =
        !enabled;

    missionSearchModeButton.disabled =
        !enabled;

    focusedMissionButton.disabled =
        !enabled;

    document
        .querySelectorAll(
            ".environment-search-button, " +
            ".searchType, " +
            ".missionType, " +
            "#planet-search-input, " +
            "#mission-search-input, " +
            ".dual-range input"
        )
        .forEach(
            element => {
                element.disabled =
                    !enabled;
            }
        );

    document
        .querySelectorAll(
            "#zoomControls button"
        )
        .forEach(
            button => {
                button.disabled =
                    !enabled;
            }
        );
}

const canvas = 
    document.getElementById("mapCanvas");

const ctx = 
    canvas.getContext("2d");


const mapContainer = 
    document.getElementById("mapContainer");

const statusElement = 
    document.getElementById("status");

const coordinatesElement =
    document.getElementById("coordinates");

const infoPanel = 
    document.getElementById("infoPanel");

const infoTitle = 
    document.getElementById("infoTitle");

const infoContent = 
    document.getElementById("infoContent");

const showWormholesCheckbox =
    document.getElementById("showWormholes");

const showLabelsCheckbox =
    document.getElementById("showLabels");

const showConnectionsCheckbox =
    document.getElementById("showConnections");

const showOrbitsCheckbox =
    document.getElementById("showOrbits");

const animateOrbitsCheckbox =
    document.getElementById("animateOrbits");

const menuButton =
    document.getElementById("menuButton");

const planetSearchInput =
    document.getElementById("planet-search-input");

const missionSearchInput =
    document.getElementById("mission-search-input");

const optionsPanel =
    document.getElementById("optionsPanel");

const backButton =
    document.getElementById("backButton");

const searchListButton =
    document.getElementById("searchListButton");

const sortSearchButton =
    document.getElementById("sortSearchButton");

const searchResultsPanel =
    document.getElementById("searchResultsPanel");

const searchResultsList =
    document.getElementById("searchResultsList");

const searchListControls =
    document.getElementById("searchListControls");

const zoomControls =
    document.getElementById("zoomControls");

const planetSearchModeButton =
    document.getElementById("planetSearchModeButton");

const missionSearchModeButton =
    document.getElementById("missionSearchModeButton");

const focusedMissionControls =
    document.getElementById("focusedMissionControls");

const focusedMissionButton =
    document.getElementById("focusedMissionButton");

const missionDurationGroup =
    document.getElementById("missionDurationGroup");

const missionDifficultyGroup =
    document.getElementById("missionDifficultyGroup");

const missionWavesMinSlider =
    document.getElementById("mission-waves-min-slider");

const missionWavesMaxSlider =
    document.getElementById("mission-waves-max-slider");

const missionWavesMinValue =
    document.getElementById("mission-waves-min-value");

const missionWavesMaxValue =
    document.getElementById("mission-waves-max-value");

const missionDiffLowMinSlider =
    document.getElementById("mission-diff-low-min-slider");

const missionDiffLowMaxSlider =
    document.getElementById("mission-diff-low-max-slider");

const missionDiffHighMinSlider =
    document.getElementById("mission-diff-high-min-slider");

const missionDiffHighMaxSlider =
    document.getElementById("mission-diff-high-max-slider");

const missionDiffLowMinValue =
    document.getElementById("mission-diff-low-min-value");

const missionDiffLowMaxValue =
    document.getElementById("mission-diff-low-max-value");

const missionDiffHighMinValue =
    document.getElementById("mission-diff-high-min-value");

const missionDiffHighMaxValue =
    document.getElementById("mission-diff-high-max-value");

const resetFiltersButton =
    document.getElementById("resetFiltersButton");

const searchResultsEmpty =
    document.getElementById("searchResultsEmpty");
    
setControlsEnabled(false);

    resetFiltersButton.addEventListener(
        "click",
        () => {
            resetFilters();
        }
    );

    menuButton.addEventListener(
        "click",
        () => {
            menuButton.classList.add("hidden");
        
            searchListControls.classList.remove("hidden");
        
            backButton.classList.remove("hidden");
            searchListButton.classList.remove("hidden");
            sortSearchButton.classList.add("hidden");
        
            optionsPanel.classList.remove("hidden");
            searchResultsPanel.classList.add("hidden");
        }
    );
    
    backButton.addEventListener(
        "click",
        () => {
            if (state.focusedMissionListMode) {
                exitFocusedMissionMode();
                return;
            }
            if (state.searchListMode) {
                state.searchListMode = false;
            
                searchResultsPanel.classList.add("hidden");
            
                sortSearchButton.classList.add("hidden");
                searchListButton.classList.remove("hidden");
            
                optionsPanel.classList.remove("hidden");
            
                updateSearchResultsList();
            
                return;
            }
    
            optionsPanel.classList.add("hidden");
            searchResultsPanel.classList.add("hidden");
    
            backButton.classList.add("hidden");
    
            menuButton.classList.remove("hidden");
            searchListButton.classList.add("hidden");
        }
    );

    searchListButton.addEventListener(
        "click",
        () => {
            state.searchListContent =
                state.searchListView;
    
            state.searchListMode = true;
    
            optionsPanel.classList.add("hidden");
            searchResultsPanel.classList.remove("hidden");
    
            searchListButton.classList.add("hidden");
            sortSearchButton.classList.remove("hidden");
    
            searchResultsList.scrollTop = 0;
    
            updateSearchResultsList();
        }
    );

    sortSearchButton.addEventListener(
        "click",
        () => {
            let modes;
    
            if (
                state.searchListContent === "missions"
            ) {
                modes =
                    state.focusedMissionListMode
                        ? [
                            "internal",
                            "name",
                            "type",
                            "duration",
                            "difficulty"
                        ]
                        : [
                            "internal",
                            "proximity",
                            "name",
                            "type",
                            "duration",
                            "difficulty",
                            "environment"
                        ];
            }
            else {
                modes = [
                    "internal",
                    "proximity",
                    "name",
                    "type",
                    "environment"
                ];
            }
    
            const index =
                modes.indexOf(
                    state.searchSortMode
                );
    
            state.searchSortMode =
                modes[
                    (index + 1) % modes.length
                ];
    
            sortSearchLabel.textContent =
                getSortLabel();
    
            updateSearchResultsList();
    
            searchResultsList.scrollTop = 0;
        }
    );

    planetSearchInput.addEventListener(
        "input",
        () => {
            state.searchQuery =
                planetSearchInput.value.trim();
    
            updateMissionSearchResults();
            updateSearchMatches();
            updateStatus();
            updateSearchResultsList();
    
            render();
        }
    );

    missionSearchInput.addEventListener(
        "input",
        () => {
            state.missionFilters.name =
                missionSearchInput.value;
    
            updateMissionSearchResults();
            updateSearchMatches();
            updateStatus();
            updateSearchResultsList();
    
            render();
        }
    );

    planetSearchModeButton.addEventListener(
        "click",
        () => {
            state.searchListView = "planets";
            state.searchListContent = "planets";
    
            planetSearchModeButton.classList.add("active");
            missionSearchModeButton.classList.remove("active");

            state.searchSortMode = "internal";
            sortSearchLabel.textContent = "Default";

            updateMissionSearchResults();
            updateSearchMatches();
            updateStatus();
            render();
    
            if (state.searchListMode) {
                searchResultsList.scrollTop = 0;
                updateSearchResultsList();
            }
        }
    );
    
    
    missionSearchModeButton.addEventListener(
        "click",
        () => {
            state.searchListView = "missions";
            state.searchListContent = "missions";
    
            missionSearchModeButton.classList.add("active");
            planetSearchModeButton.classList.remove("active");

            state.searchSortMode = "internal";
            sortSearchLabel.textContent = "Default";

            updateMissionSearchResults();
            updateSearchMatches();
            updateStatus();
            render();
    
            if (state.searchListMode) {
                searchResultsList.scrollTop = 0;
                updateSearchResultsList();
            }
        }
    );


missionWavesMinSlider.addEventListener(
    "input",
    updateMissionWaveFilters
);
    
missionWavesMaxSlider.addEventListener(
    "input",
    updateMissionWaveFilters
);

missionDiffLowMinSlider.addEventListener(
    "input",
    updateMissionDifficultyFilters
);
    
missionDiffLowMaxSlider.addEventListener(
    "input",
    updateMissionDifficultyFilters
);
    
missionDiffHighMinSlider.addEventListener(
    "input",
    updateMissionDifficultyFilters
);
    
missionDiffHighMaxSlider.addEventListener(
    "input",
    updateMissionDifficultyFilters
);


const state = {
    rows: [],
    missions: [],
    missionsByPlanet: new Map(),
    objectsByName: new Map(),

    systems: [],
    systemsByName: new Map(),

    constellations: [],
    constellationsByName: new Map(),

    connections: [],

    constellationData: {},

    selectedObject: null,

    searchTypes: new Set(),
    searchQuery: "",
    searchListMode: false,
    searchListView: "planets",
    searchListContent: "planets",
    searchSortMode: "internal",
    focusedMissionListMode: false,

    environmentFilters: {
        Massive: 0,
        Hot: 0,
        Electric: 0,
        Frozen: 0
    },

    missionFilters: {
        name: "",
        types: new Set(),
        minWaves: 3,
        maxWaves: 50,
        minDifficultyLow: 0,
        maxDifficultyLow: 100,
        minDifficultyHigh: 0,
        maxDifficultyHigh: 100
    },

    missionSearchResults: new Set(),
    missionSearchCount: 0,
    missionCountsByObject: new Map(),
    missionCountsBySystem: new Map(),
    missionCountsByConstellation: new Map(),

    camera: {
        zoom: CONFIG.INITIAL_ZOOM,
        offsetX: 0,
        offsetY: 0,
        focusedObject: null
    },

    canvasWidth: 1,
    canvasHeight: 1,

    dragging: false,
    dragStartX: 0,
    dragStartY: 0,

    lastFrameTime: performance.now(),
    orbitTime: 0
};

function resetFilters() {
    planetSearchInput.value = "";
    state.searchQuery = "";
    missionSearchInput.value = "";
    state.missionFilters.name = "";
    state.searchTypes.clear();

    document
        .querySelectorAll(".searchType")
        .forEach(
            checkbox => {
                checkbox.checked = false;
            }
        );

    state.missionFilters.types.clear();

    document
        .querySelectorAll(".missionType")
        .forEach(
            checkbox => {
                checkbox.checked = false;
            }
        );

    for (const environment of ENVIRONMENTS) {
        state.environmentFilters[environment] = 0;

        const button =
            document.querySelector(
                `.environment-search-button[data-environment="${environment}"]`
            );

        if (button) {
            button.dataset.state = "default";
            button.textContent = environment;
        }
    }

    missionWavesMinSlider.value = 3;
    missionWavesMaxSlider.value = 50;

    state.missionFilters.minWaves = 3;
    state.missionFilters.maxWaves = 50;

    missionWavesMinValue.textContent = "3";
    missionWavesMaxValue.textContent = "50";

    missionDiffLowMinSlider.value = 0;
    missionDiffLowMaxSlider.value = 100;

    state.missionFilters.minDifficultyLow = 0;
    state.missionFilters.maxDifficultyLow = 100;

    missionDiffLowMinValue.textContent = "0%";
    missionDiffLowMaxValue.textContent = "100%";

    missionDiffHighMinSlider.value = 0;
    missionDiffHighMaxSlider.value = 100;

    state.missionFilters.minDifficultyHigh = 0;
    state.missionFilters.maxDifficultyHigh = 100;

    missionDiffHighMinValue.textContent = "0%";
    missionDiffHighMaxValue.textContent = "100%";

    updateMissionSearchResults();
    updateSearchMatches();
    updateStatus();

    if (state.searchListMode) {
        searchResultsList.scrollTop = 0;
        updateSearchResultsList();
    }

    render();
}



// Utility functions

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function darkenColor(color, amount = 0) {
    const hex = color.replace("#", "");

    if (hex.length !== 6) {
        return "#555555";
    }

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const newR = Math.round(r * (1 - amount));
    const newG = Math.round(g * (1 - amount));
    const newB = Math.round(b * (1 - amount));

    return (
        "#" +
        newR.toString(16).padStart(2, "0") +
        newG.toString(16).padStart(2, "0") +
        newB.toString(16).padStart(2, "0")
    );
}


function parseTSV(text) {
    const lines = text
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/);

    if (lines.length === 0) {
        throw new Error("Empty TSV");
    }

    let headerIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (
            lines[i].trim().startsWith("#") &&
            lines[i].includes("\t")
        ) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        throw new Error(
            "Could not find header"
        );
    }

    const header = lines[headerIndex]
        .split("\t")
        .map((value, index) => {
            value = value.trim();

            if (index === 0) {
                return "Index";
            }

            return value;
        });

    const rows = [];

    for (
        let i = headerIndex + 1;
        i < lines.length;
        i++
    ) {
        const line = lines[i];

        if (!line.trim()) {
            continue;
        }

        const cells = line.split("\t");

        if (cells.length < 5) {
            console.warn(
                "Skipping malformed TSV row:",
                line
            );

            continue;
        }

        const row = {};

        for (let j = 0; j < header.length; j++) {
            row[header[j]] =
                (cells[j] ?? "").trim();
        }

        row.X = Number(row.X);
        row.Y = Number(row.Y);

        row.Massive =
            String(row.Massive)
                .toUpperCase() === "TRUE";

        row.Hot =
            String(row.Hot)
                .toUpperCase() === "TRUE";

        row.Electric =
            String(row.Electric)
                .toUpperCase() === "TRUE";

        row.Frozen =
            String(row.Frozen)
                .toUpperCase() === "TRUE";

        row.Singularity =
            String(row.Singularity)
                .toUpperCase() === "TRUE";

        if (
            !Number.isFinite(row.X) ||
            !Number.isFinite(row.Y) ||
            !row.Planet ||
            !row["Star System"]
        ) {
            console.warn(
                "Skipping invalid row:",
                row
            );

            continue;
        }

        rows.push(row);
    }

    return rows;
}


function parseMissionsTSV(text) {
    const lines =
        text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/);

    if (lines.length === 0) {
        throw new Error("Empty missions.tsv");
    }

    let headerIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (
            lines[i].trim().startsWith("N") &&
            lines[i].includes("\t")
        ) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        throw new Error(
            "Could not find missions.tsv header"
        );
    }

    const header =
        lines[headerIndex]
            .split("\t")
            .map(value => value.trim());

    const columnIndex = {
        Name: header.indexOf("Name"),
        Type: header.indexOf("Type"),
        Waves: header.indexOf("Waves"),
        diffLow: header.indexOf("Diff Low%"),
        diffHigh: header.indexOf("Diff High%"),
        Planet: header.indexOf("Planet"),
        Notes: header.indexOf("Notes")
    };

    const missions = [];

    for (
        let i = headerIndex + 1;
        i < lines.length;
        i++
    ) {
        const line = lines[i];

        if (!line.trim()) {
            continue;
        }

        const cells = line.split("\t");

        const get = index =>
            index >= 0
                ? (cells[index] ?? "").trim()
                : "";

        const mission = {
            Name: get(columnIndex.Name),
            Type: get(columnIndex.Type),
            Waves: Number(
                get(columnIndex.Waves)
            ),
            "Diff Low%": get(
                columnIndex.diffLow
            ),
            "Diff High%": get(
                columnIndex.diffHigh
            ),
            Planet: get(
                columnIndex.Planet
            ),
            Notes: get(
                columnIndex.Notes
            )
        };

        if (
            !mission.Name ||
            !mission.Type ||
            !mission.Planet
        ) {
            continue;
        }

        missions.push(mission);
    }

    return missions;
}


async function loadData() {
    try {
        
        canvas.style.touchAction = "none";

        statusElement.textContent =
            "Loading planets.tsv...";

        console.log(
            "Loading data/planets.tsv..."
        );

        const response =
            await fetch(
                "data/planets.tsv",
                {
                    cache: "no-cache"
                }
            );

        console.log(
            "TSV HTTP status:",
            response.status
        );

        if (!response.ok) {
            throw new Error(
                `Could not load planets.tsv: HTTP ${response.status}`
            );
        }

        const text =
            await response.text();

        console.log(
            `Downloaded ${text.length} characters.`
        );

        state.rows =
            parseTSV(text);

        if (state.rows.length === 0) {
            throw new Error(
                "TSV is empty?"
            );
        }

        console.log(
            "Loading constellations.json..."
        );

        const constellationResponse =
            await fetch(
                "data/constellations.json",
                {
                    cache: "no-cache"
                }
            );

        if (!constellationResponse.ok) {
            throw new Error(
                `Could not load constellations.json: HTTP ${constellationResponse.status}`
            );
        }

        state.constellationData =
            await constellationResponse.json();

        console.log(
            "Loading missions.tsv..."
        );
            
        const missionsResponse =
            await fetch(
                "data/missions.tsv",
                {
                    cache: "no-cache"
                }
            );
            
        if (!missionsResponse.ok) {
            throw new Error(
                `Could not load missions.tsv: HTTP ${missionsResponse.status}`
            );
        }
            
        const missionsText =
            await missionsResponse.text();
            
        console.log(
            `Downloaded ${missionsText.length} characters from missions.tsv.`
        );
            
        state.missions =
            parseMissionsTSV(
                missionsText
            );
            
        console.log(
            `Parsed ${state.missions.length.toLocaleString()} missions.`
        );
            
        state.systemsByName =
            buildSystems(state.rows);

		for (
			const constellation
			of state.constellations
		) {
			for (
				const system
				of constellation.systems
			) {
				state.systems.push(system);
			}
		}

		// Convert each system's rows into actual objects
		for (const system of state.systems) {
			buildSystemHierarchy(system);
		}

        populateDroids();
        associateMissions();
        updateMissionSearchResults();

		buildConnections();
		initializeOrbitAngles();

        for (const droid of state.droids) {
            const position =
                getStationaryDroidPosition(droid);

            droid.x = position.x;
            droid.y = position.y;

            droid.travelState = "burgerWait";
            droid.travelTimer = 0;
            droid.targetPlanet = null;
            droid.speed = 0;
        }

        updateStatus();

        resetView();

        updateWelcomePrompt();

        dataLoadComplete = true;

        setControlsEnabled(true);

        render();

    } catch (error) {
        console.error(
            "Map loading failed:",
            error
        );

        statusElement.textContent =
            "ERROR: " + error.message;

        ctx.save();

        ctx.fillStyle = "#00001f";
        ctx.fillRect(
            0,
            0,
            state.canvasWidth,
            state.canvasHeight
        );

        ctx.fillStyle = "#ff0000";
        ctx.font =
            "18px system-ui, sans-serif";

        ctx.fillText(
            "Failed to load data",
            30,
            45
        );

        ctx.fillStyle = "#ff0000";
        ctx.font =
            "14px system-ui, sans-serif";

        ctx.fillText(
            error.message,
            30,
            75
        );

        dataLoadComplete = false;


        welcomePrompt.textContent =
            "Failed to load data";

        statusElement.textContent =
            "ERROR: " + error.message;

        ctx.restore();
    }
}


//helpers for object types

function isWormhole(row) {
    return row.Type === "Wormhole";
}


function isMoon(row) {
    if (
        row.Notes &&
        row.Notes.trim().toLowerCase() === "moon"
    ) {
        return true;
    }

    const SHOPS = new Set([
        "Heroes Academy",
        "Heroware",
        "Aftermarket Station",
        "Fortune Teller",
        "Gus's Gas",
        "Space Burger"
    ]);

    return SHOPS.has(row.Type);
}


function isBinaryStar(row) {
    return (
        row.Type === "Sun" ||
        row.Type === "Binary Sun"
    );
}


// planet sizes

function getBaseObjectRadius(object) {
    const type = object.row.Type;

    switch (type) {
        case "Wormhole":
            return 0.25;

        case "Sun":
            return CONFIG.STAR_BASE_RADIUS;

        case "Binary Sun":
            return CONFIG.STAR_BASE_RADIUS;

        case "Gas giant":
            return 0.07;

        case "Inferno":
            return 0.068;

        case "Terran planet":
            return 0.063;

        case "Frozen wasteland":
            return 0.067;

        case "Alien world":
            return object.role === "moon"
                ? 0.045
                : 0.065;

        case "Barren rock":
            return 0.045;

        case "Artificial moon":
            return 0.045;

        case "Asteroid belt":
            return 0.09;

        default:
            return 0.04;
    }
}

function buildSystems(rows) {
    const systemsByName = new Map();

    for (const row of rows) {
        const constellationName =
            row.Constellation;

        const systemName =
            row["Star System"];

        let constellation =
            state.constellationsByName.get(
                constellationName
            );

        if (!constellation) {
            constellation = {
                name: constellationName,

                color:
                    state.constellationData[
                        constellationName
                    ]?.color ?? "#FFFFFF",
        
                systems: [],
                systemsByName: new Map()
            };

            state.constellationsByName.set(
                constellationName,
                constellation
            );

            state.constellations.push(
                constellation
            );
        }

        let system =
            constellation.systemsByName.get(
                systemName
            );

        if (!system) {
            system = {
                name: systemName,
                constellation: constellation,

                x: row.X,
                y: row.Y,

                rows: [],
                objects: [],

                centerObjects: [],
                planets: [],

                isWormhole: false,
                isBinary: false,

                connectionsNames: [],

                outerRadius: 0
            };

            constellation.systemsByName.set(
                systemName,
                system
            );

            constellation.systems.push(
                system
            );

            systemsByName.set(
                `${constellationName}\0${systemName}`,
                system
            );
        }

        system.rows.push(row);
    }

    return systemsByName;
}

function buildSystemHierarchy(system) {
    system.objects = [];
    system.centerObjects = [];
    system.planets = [];

    system.isWormhole = false;
    system.isBinary = false;

    let currentPlanet = null;

    const firstRow = system.rows[0]; // Always Sun or Wormhole

    if (isWormhole(firstRow)) {
        system.isWormhole = true;

        const wormhole = createObject(
            firstRow,
            system,
            null,
            "center"
        );

        system.centerObjects.push(wormhole);
        system.objects.push(wormhole);

        return;
    }

    let index = 0;

    while (
        index < system.rows.length &&
        isBinaryStar(system.rows[index])
    ) {
        const star = createObject(
            system.rows[index],
            system,
            null,
            "center"
        );

        system.centerObjects.push(star);
        system.objects.push(star);

        index++;
    }

    system.isBinary = // In case of binary systems
        system.centerObjects.length === 2;

    // Planets
    for (; index < system.rows.length; index++) {
        const row = system.rows[index];

        if (isMoon(row)) {
            const moon = createObject(
                row,
                system,
                currentPlanet,
                "moon"
            );

            if (currentPlanet) {
                currentPlanet.moons.push(moon);
            } else {
                // This shouldn't happen
                moon.parent = null;
                system.planets.push(moon);
            }

            system.objects.push(moon);
        } else {
            const planet = createObject(
                row,
                system,
                system,
                "planet"
            );

            system.planets.push(planet);
            system.objects.push(planet);

            currentPlanet = planet;
        }
    }

    system.connectionsNames =
        parseConnections(firstRow.Connections);

    calculateOrbitalLayout(system);
}


function associateMissions() {
    state.missionsByPlanet.clear();

    state.objectsByName.clear();

    const objectsByName =
        state.objectsByName;

    for (const system of state.systems) {
        for (const object of system.objects) {
            object.missions = [];

            objectsByName.set(
                object.name,
                object
            );
        }
    }

    for (const droid of state.droids) {
        droid.missions = [];

        objectsByName.set(
            droid.name,
            droid
        );
    }

    for (const mission of state.missions) {
        const object =
        state.objectsByName.get(
            mission.Planet
        );

        if (!object) {
            throw new Error(
                `Mission "${mission.Name}" references ` +
                `unknown object "${mission.Planet}"`
            );
        }
        
        mission.object =
            object;
    
        mission.environmentEmojis =
            getEnvironmentEmojis(object);

        object.missions.push(
            mission
        );

        let missions =
            state.missionsByPlanet.get(
                mission.Planet
            );

        if (!missions) {
            missions = [];

            state.missionsByPlanet.set(
                mission.Planet,
                missions
            );
        }

        missions.push(mission);
    }

    console.log(
        `Associated ` +
        `${state.missions.length.toLocaleString()} missions ` +
        `with ` +
        `${state.missionsByPlanet.size.toLocaleString()} objects.`
    );
}


function createObject(row, system, parent, role) {
    return {
        row,
        name: row.Planet,
        type: row.Type,

        system,
        parent,

        role,

        moons: [],
        missions: [],

        orbitRadius: 0,
        orbitAngle: 0,

        orbitSpeed: 0,

        searchMatch: false,

        baseRadius: 0
    };
}


function parseConnections(value) {
    if (!value || !value.trim()) {
        return [];
    }

    return value
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);
}


function calculateOrbitalLayout(system) {
    if (system.isWormhole) {
        system.outerRadius = getBaseObjectRadius(
            system.centerObjects[0]
        );

        return;
    }

    let centralRadius = 0;

    for (const star of system.centerObjects) {
        star.baseRadius =
            getBaseObjectRadius(star);
    
        centralRadius =
            Math.max(
                centralRadius,
                star.baseRadius
            );
    }

    if (system.isBinary) {
        centralRadius =
            CONFIG.BINARY_STAR_SEPARATION / 2 +
            CONFIG.STAR_BASE_RADIUS;
    }

    let currentRadius =
        centralRadius + CONFIG.PLANET_GAP;

    for (const planet of system.planets) {
        planet.baseRadius =
            getBaseObjectRadius(planet);

        const moonExtent =
            calculateMoonExtent(planet);

        const occupiedRadius =
            planet.baseRadius +
            moonExtent;

        currentRadius += occupiedRadius;

        planet.orbitRadius = currentRadius;

        currentRadius +=
            occupiedRadius +
            CONFIG.PLANET_GAP;

        calculateMoonLayout(planet);
    }

    system.outerRadius =
        Math.max(
            currentRadius,
            centralRadius
        );
}


function calculateMoonExtent(planet) {
    if (planet.moons.length === 0) {
        return 0;
    }

    let extent = 0;

    for (let i = 0; i < planet.moons.length; i++) {
        const moon = planet.moons[i];

        moon.baseRadius =
            getBaseObjectRadius(moon);

        const radius =
            CONFIG.MOON_ORBIT_SPACING *
            (i + 1);

        extent = Math.max(
            extent,
            radius + moon.baseRadius
        );
    }

    return extent;
}


function calculateMoonLayout(planet) {
    for (let i = 0; i < planet.moons.length; i++) {
        const moon = planet.moons[i];

        moon.orbitRadius =
            CONFIG.MOON_ORBIT_SPACING *
            (i + 1);

        moon.orbitAngle = 
            (i / Math.max(1, planet.moons.length)) *
            Math.PI * 2;

        moon.orbitSpeed =
            CONFIG.DEFAULT_ORBIT_SPEED *
            1.5 /
            (1 + i * 0.25);
    }
}


function buildConnections() {
    const edges = new Map();

    for (const constellation of state.constellations) {
        for (const system of constellation.systems) {
            for (const targetName of system.connectionsNames) {
                const target =
                    state.systems.find(
                        candidate =>
                            candidate.name === targetName
                    );

                if (!target) {
                    console.warn(
                        `Could not resolve connection ` +
                        `${system.name} -> ${targetName} ` +
                        `in ${constellation.name}`
                    );

                    continue;
                }

                const key =
                    `${system.name}\0${target.name}`;

                if (!edges.has(key)) {
                    edges.set(key, {
                        a: system,
                        b: target
                    });
                }
            }
        }
    }

    state.connections =
        Array.from(edges.values());
}

function getDeterministicOrbitAngle(x, y) {
    const value =
        Math.sin(
            x * 12.9898 +
            y * 78.233
        ) *
        43758.5453;

    const fraction =
        value -
        Math.floor(value);

    return fraction * Math.PI * 2;
}

function initializeOrbitAngles() {
    for (const system of state.systems) {
        const baseAngle =
            getDeterministicOrbitAngle(
                system.x,
                system.y
            );

        for (
            let i = 0;
            i < system.planets.length;
            i++
        ) {
            const planet =
                system.planets[i];

            planet.orbitAngle =
                baseAngle +
                (
                    i /
                    Math.max(
                        1,
                        system.planets.length
                    )
                ) *
                Math.PI *
                2;

            planet.orbitSpeed =
                CONFIG.DEFAULT_ORBIT_SPEED /
                (1 + i * 0.18);

            for (
                let j = 0;
                j < planet.moons.length;
                j++
            ) {
                const moon =
                    planet.moons[j];

                moon.orbitAngle =
                    (
                        j /
                        Math.max(
                            1,
                            planet.moons.length
                        )
                    ) *
                    Math.PI *
                    2;

                moon.orbitSpeed =
                    CONFIG.DEFAULT_ORBIT_SPEED *
                    1.4 /
                    (1 + j * 0.2);
            }
        }
    }
}


// camera

function worldToScreen(x, y) {
    return {
        x:
            x * state.camera.zoom +
            state.camera.offsetX,

        y:
            (CONFIG.MAP_MAX - y) *
                state.camera.zoom +
            state.camera.offsetY
    };
}


function screenToWorld(x, y) {
    return {
        x:
            (x - state.camera.offsetX) /
            state.camera.zoom,

        y:
            (y - state.camera.offsetY) /
            state.camera.zoom
    };
}


function resetView() {
    const width = state.canvasWidth;
    const height = state.canvasHeight;
        
    state.camera.zoom =
        getMinimumZoom();

    state.camera.offsetX =
        (width -
            CONFIG.MAP_MAX * state.camera.zoom) / 2;

    state.camera.offsetY =
        (height -
            CONFIG.MAP_MAX * state.camera.zoom) / 2;

    closeInfo();
}


function getMinimumZoom() {
    const mapSize = CONFIG.MAP_MAX;

    if (mapSize <= 0) {
        return 1;
    }

    return Math.min(
        state.canvasWidth / mapSize,
        state.canvasHeight / mapSize
    );
}


function clampZoom(zoom) {
    return Math.max(
        getMinimumZoom(),
        Math.min(
            CONFIG.MAX_ZOOM,
            zoom
        )
    );
}


function zoomAt(screenX, screenY, factor) {
    const oldZoom =
        state.camera.zoom;

    const newZoom =
        clampZoom(oldZoom * factor);

    if (newZoom === oldZoom) {
        return;
    }

    closeInfo();

    // World position stays for cursor
    const world =
        screenToWorld(
            screenX,
            screenY
        );

    state.camera.zoom = newZoom;
    
    const mapSize =
        CONFIG.MAP_MAX * state.camera.zoom;
        
    if (mapSize >= state.canvasWidth) {
        state.camera.offsetX = clamp(
            screenX -world.x * newZoom,
            state.canvasWidth - mapSize,
            0
        );
    } else {
        state.camera.offsetX =
            (state.canvasWidth - mapSize) / 2;
    }

    if (mapSize >= state.canvasHeight) {
        state.camera.offsetY = clamp(
            screenY -world.y * newZoom,
            state.canvasHeight - mapSize,
            0
        );
    } else {
        state.camera.offsetY =
            (state.canvasHeight - mapSize) / 2;
    }

    updateProximitySort();
}


function resizeCanvas() {
    const rect =
        mapContainer.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;

    state.canvasWidth = rect.width;
    state.canvasHeight = rect.height;

    canvas.width =
        Math.round(rect.width * dpr);

    canvas.height =
        Math.round(rect.height * dpr);

    canvas.style.width =
        `${rect.width}px`;

    canvas.style.height =
        `${rect.height}px`;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    const oldZoom =
        state.camera.zoom;

    const newZoom =
        clampZoom(oldZoom);

    if (newZoom !== oldZoom) {
        state.camera.zoom =
            newZoom;

        const mapSize =
            CONFIG.MAP_MAX *
            newZoom;

        state.camera.offsetX =
            (state.canvasWidth - mapSize) / 2;

        state.camera.offsetY =
            (state.canvasHeight - mapSize) / 2;
    }
}


function updateOrbitAnimation(deltaTime) {
    if (!animateOrbitsCheckbox.checked) {
        return;
    }

    state.orbitTime += deltaTime;

    for (const system of state.systems) {
        if (system.isWormhole) {
            continue;
        }

        for (const planet of system.planets) {
            planet.orbitAngle +=
                planet.orbitSpeed *
                deltaTime;
        
            for (const moon of planet.moons) {
                moon.orbitAngle +=
                    moon.orbitSpeed *
                    deltaTime;
        
                for (const droid of moon.droids) {
                    updateDroidAnimation(
                        droid,
                        deltaTime
                    );
                }
            }
        }
    }
}


function getSystemCenter(system) {
    return worldToScreen(
        system.x,
        system.y
    );
}


function getCentralStarScreenPosition(
    system,
    starIndex
) {
    const center =
        getSystemCenter(system);

    if (!system.isBinary) {
        return center;
    }

    const separation =
        CONFIG.BINARY_STAR_SEPARATION *
        state.camera.zoom;

    const direction =
        starIndex === 0 ? -1 : 1;

    return {
        x:
            center.x +
            direction * separation / 2,

        y: center.y
    };
}


function getCameraWorldPosition() {
    return {
        x:
            (
                state.canvasWidth / 2 -
                state.camera.offsetX
            ) /
            state.camera.zoom,

        y:
            CONFIG.MAP_MAX -
            (
                state.canvasHeight / 2 -
                state.camera.offsetY
            ) /
            state.camera.zoom
    };
}


function getObjectWorldPosition(object) {
    if (object.role === "droid") {
        return getDroidWorldPosition(object);
    }

    if (object.role === "moon") {
        return getMoonWorldPosition(object);
    }

    if (object.role === "planet") {
        return getPlanetWorldPosition(object);
    }

    return {
        x: object.row.X,
        y: object.row.Y
    };
}


function getPlanetWorldPosition(planet) {
    const system = planet.system;

    const angle = planet.orbitAngle;

    return {
        x:
            system.x +
            Math.cos(angle) *
            planet.orbitRadius,

        y:
            system.y +
            Math.sin(angle) *
            planet.orbitRadius
    };
}


function getMoonWorldPosition(moon) {
    const parent =
        moon.parent;

    const parentPosition =
        getPlanetWorldPosition(parent);

    return {
        x:
            parentPosition.x +
            Math.cos(moon.orbitAngle) *
            moon.orbitRadius,

        y:
            parentPosition.y +
            Math.sin(moon.orbitAngle) *
            moon.orbitRadius
    };
}


function getStationaryDroidPosition(droid) {
    const moon =
        droid.parent;

    const moonPosition =
        getMoonWorldPosition(
            moon
        );

    const count =
        droid.droidCount;

    const angle =
        (
            droid.droidIndex /
            count
        ) *
        Math.PI * 2 +
        moon.orbitAngle;

    const distance =
        moon.baseRadius * 2.5;

    return {
        x:
            moonPosition.x +
            Math.cos(angle) *
            distance,

        y:
            moonPosition.y +
            Math.sin(angle) *
            distance
    };
}


function getDroidBurgerPosition(droid) {
    return getStationaryDroidPosition(droid);
}


function getDroidPlanetPosition(droid) {
    const object =
        droid.targetPlanet;

    let objectPosition;
    let distance;

    if (object.role === "planet") {
        objectPosition =
            getPlanetWorldPosition(
                object
            );

        distance =
            object.baseRadius + 0.08;
    }
    else if (object.role === "moon") {
        objectPosition =
            getMoonWorldPosition(
                object
            );

        distance =
            object.baseRadius + 0.08;
    }
    else {
        objectPosition = {
            x: object.row.X,
            y: object.row.Y
        };

        distance =
            object.baseRadius + 0.08;
    }

    return {
        x:
            objectPosition.x +
            Math.cos(
                droid.targetAngle
            ) *
            distance,

        y:
            objectPosition.y +
            Math.sin(
                droid.targetAngle
            ) *
            distance
    };
}


function getTravelProgress(progress) {
    const ramp = 0.1;

    const speed =
        1 / (1 - ramp);

    if (progress < ramp) {
        const t =
            progress / ramp;

        return (
            0.5 *
            ramp *
            speed *
            t *
            t
        );
    }

    if (progress > 1 - ramp) {
        const t =
            (
                progress -
                (1 - ramp)
            ) / ramp;

        const middleDistance =
            ramp * 0.5 * speed +
            (1 - 2 * ramp) * speed;

        return (
            middleDistance +
            ramp *
            speed *
            (
                t -
                0.5 * t * t
            )
        );
    }

    return (
        ramp * 0.5 * speed +
        (
            progress -
            ramp
        ) *
        speed
    );
}


function getDroidWorldPosition(droid) {
    if (
        !animateOrbitsCheckbox.checked
    ) {
        return getStationaryDroidPosition(
            droid
        );
    }

    return {
        x: droid.x,
        y: droid.y
    };
}


function updateDroidAnimation(
    droid,
    deltaTime
) {
    if (
        droid.travelState ===
        "burgerWait"
    ) {
        droid.speed = 0;
        droid.travelTimer += deltaTime;
    
        const target =
            getDroidBurgerPosition(droid);
    
        const dx =
            target.x - droid.x;
    
        const dy =
            target.y - droid.y;
    
        const distance =
            Math.hypot(dx, dy);
    
        if (distance > 0) {
            const followSpeed = 0.12;
    
            const moveDistance =
                Math.min(
                    distance,
                    followSpeed * deltaTime
                );
    
            droid.x +=
                dx / distance *
                moveDistance;
    
            droid.y +=
                dy / distance *
                moveDistance;
        }
    
        if (
            droid.travelTimer >= 15
        ) {
            droid.travelTimer = 0;
    
            const targets = [
                ...droid.system.centerObjects,
                ...droid.system.planets
            ];
            
            for (
                const planet of droid.system.planets
            ) {
                for (const moon of planet.moons) {
                    if (moon !== droid.parent) {
                        targets.push(moon);
                    }
                }
            }
            
            if (targets.length === 0) {
                return;
            }
            
            droid.targetPlanet =
                targets[
                    Math.floor(
                        Math.random() *
                        targets.length
                    )
                ];
    
            droid.targetAngle =
                Math.random() *
                Math.PI * 2;
    
            droid.travelState =
                "toPlanet";
        }
    
        return;
    }

    
    if (
        droid.travelState ===
        "planetWait"
    ) {
        droid.speed = 0;
        droid.travelTimer += deltaTime;
    
        const target =
            getDroidPlanetPosition(droid);
    
        const dx =
            target.x - droid.x;
    
        const dy =
            target.y - droid.y;
    
        const distance =
            Math.hypot(dx, dy);
    
        if (distance > 0) {
            const followSpeed = 0.12;
    
            const moveDistance =
                Math.min(
                    distance,
                    followSpeed * deltaTime
                );
    
            droid.x +=
                dx / distance *
                moveDistance;
    
            droid.y +=
                dy / distance *
                moveDistance;
        }
    
        if (
            droid.travelTimer >= 15
        ) {
            droid.travelTimer = 0;
            droid.travelState =
                "toBurger";
        }
    
        return;
    }

    let target;

    if (
        droid.travelState ===
        "toPlanet"
    ) {
        target =
            getDroidPlanetPosition(
                droid
            );
    }
    else {
        target =
            getDroidBurgerPosition(
                droid
            );
    }

    const dx =
        target.x - droid.x;

    const dy =
        target.y - droid.y;

    const distance =
        Math.hypot(
            dx,
            dy
        );

    if (distance < 0.002) {
        droid.x = target.x;
        droid.y = target.y;
        droid.speed = 0;
        droid.travelTimer = 0;

        if (
            droid.travelState ===
            "toPlanet"
        ) {
            droid.travelState =
                "planetWait";
        }
        else {
            droid.travelState =
                "burgerWait";
            droid.targetPlanet = null;
        }

        return;
    }

    const acceleration = 0.02;

    droid.speed =
        Math.min(
            droid.maxSpeed,
            droid.speed +
                acceleration *
                deltaTime
        );

    const braking = 0.06;

    const stoppingDistance =
        (
            droid.speed *
            droid.speed
        ) /
        (
            2 * braking
        );

    if (
        distance <
        stoppingDistance + 0.04
    ) {
        droid.speed =
            Math.max(
                0,
                droid.speed -
                    braking *
                    deltaTime
            );
    }

    const moveDistance =
        Math.min(
            distance,
            droid.speed *
                deltaTime
        );

    droid.x +=
        dx / distance *
        moveDistance;

    droid.y +=
        dy / distance *
        moveDistance;
}


function populateDroids() {
    state.droids = [];

    for (const system of state.systems) {
        for (const planet of system.planets) {
            for (const moon of planet.moons) {

                if (
                    moon.row.Type !== "Space Burger" ||
                    !moon.row.Notes
                ) {
                    moon.droids = [];
                    continue;
                }

                const matches =
                    moon.row.Notes.match(
                        /Droid\s+#([A-Za-z0-9]+)/gi
                    );

                moon.droids = [];

                if (!matches) {
                    continue;
                }

                for (
                    let i = 0;
                    i < matches.length;
                    i++
                ) {
                    const name =
                        matches[i].trim();

                    const droid = {
                        role: "droid",

                        name: name,

                        row: {
                            Name: name,
                            Type: "Droid",

                            X: moon.row.X,
                            Y: moon.row.Y,

                            Notes: "",
                            Massive: false,
                            Hot: false,
                            Electric: false,
                            Frozen: false
                        },

                        parent: moon,
                        system: system,

                        searchMatch: false,

                        droidIndex: i,
                        droidCount: matches.length,

                        travelState: "burgerWait",
                        travelTimer: 0,

                        targetPlanet: null,
                        targetAngle: 0,

                        x: 0,
                        y: 0,

                        speed: 0,
                        maxSpeed: 0.08
                    };

                    const position =
                    getStationaryDroidPosition(
                        droid
                    );
                
                    droid.x = position.x;
                    droid.y = position.y;

                    moon.droids.push(droid);
                    state.droids.push(droid);
                }
            }
        }
    }
}

function updateStatus() {
    const qualifyingMissionCount =
        state.missionSearchCount;

    if (
        state.searchListView ===
        "missions"
    ) {
        const matchingObjectCount =
            state.missionCountsByObject.size;

        const systemCount =
            state.missionCountsBySystem.size;

        const constellationCount =
            state.missionCountsByConstellation.size;

        statusElement.textContent =
            `${qualifyingMissionCount.toLocaleString()} missions · ` +
            `${matchingObjectCount.toLocaleString()} objects · ` +
            `${systemCount.toLocaleString()} systems · ` +
            `${constellationCount.toLocaleString()} constellations`;

        return;
    }

    if (!isSearchActive()) { // default shows all
        const objectCount =
            state.rows.length +
            state.droids.length;

        statusElement.textContent =
            `${qualifyingMissionCount.toLocaleString()} missions · ` +
            `${objectCount.toLocaleString()} objects · ` +
            `${state.systems.length.toLocaleString()} systems · ` +
            `${state.constellations.length.toLocaleString()} constellations`;

        return;
    }

    let objectCount = 0;
    let systemCount = 0;
    let constellationCount = 0;

    for (
        const constellation
        of state.constellations
    ) {
        let constellationHasMatch =
            false;

        for (
            const system
            of constellation.systems
        ) {
            let systemHasMatch =
                false;

            for (
                const object
                of system.centerObjects
            ) {
                if (
                    objectMatchesSearch(
                        object
                    )
                ) {
                    objectCount++;
                    systemHasMatch = true;
                    constellationHasMatch = true;
                }
            }

            for (
                const planet
                of system.planets
            ) {
                if (
                    objectMatchesSearch(
                        planet
                    )
                ) {
                    objectCount++;
                    systemHasMatch = true;
                    constellationHasMatch = true;
                }

                for (
                    const moon
                    of planet.moons
                ) {
                    if (
                        objectMatchesSearch(
                            moon
                        )
                    ) {
                        objectCount++;
                        systemHasMatch = true;
                        constellationHasMatch = true;
                    }

                    for (
                        const droid
                        of moon.droids
                    ) {
                        if (
                            objectMatchesSearch(
                                droid
                            )
                        ) {
                            objectCount++;
                            systemHasMatch = true;
                            constellationHasMatch = true;
                        }
                    }
                }
            }

            if (systemHasMatch) {
                systemCount++;
            }
        }

        if (constellationHasMatch) {
            constellationCount++;
        }
    }

    statusElement.textContent =
        `${qualifyingMissionCount.toLocaleString()} missions · ` +
        `${objectCount.toLocaleString()} objects · ` +
        `${systemCount.toLocaleString()} systems · ` +
        `${constellationCount.toLocaleString()} constellations`;
}


function isSearchActive() {
    if (
        state.searchListView ===
        "missions"
    ) {
        return true;
    }

    return (
        state.searchTypes.size > 0 ||

        ENVIRONMENTS.some(
            environment =>
                state.environmentFilters[
                    environment
                ] !== 0
        ) ||

        state.searchQuery.trim() !== "" ||

        areMissionFiltersActive()
    );
}


function objectMatchesEnvironmentSearch(object) {
    for (const environment of ENVIRONMENTS) {
        const mode =
            state.environmentFilters[environment];

        if (mode === 0) {
            continue;
        }

        const hasEnvironment =
            object.row[environment] === true;

        if (mode === 1 && !hasEnvironment) {
            return false;
        }

        if (mode === -1 && hasEnvironment) {
            return false;
        }
    }

    return true;
}


function cycleEnvironmentSearch(environment) {
    const next =
        ((state.environmentFilters[environment] + 2) % 3) - 1;

    state.environmentFilters[environment] =
        next;

    const button =
        document.querySelector(
            `.environment-search-button[data-environment="${environment}"]`
        );

        if (button) {
            button.dataset.state =
                next === 1
                    ? "additive"
                    : next === -1
                        ? "subtractive"
                        : "default";
        
            button.textContent =
                next === 1
                    ? `${environment} +`
                    : next === -1
                        ? `${environment} −`
                        : environment;
        }
}


function objectMatchesSearch(object) {
    return object.searchMatch === true;
}


function updateSearchMatches() {
    const active =
        isSearchActive();

    if (!active) {
        for (const system of state.systems) {
            for (const object of system.objects) {
                object.searchMatch = false;

                if (object.role === "moon") {
                    for (const droid of object.droids) {
                        droid.searchMatch = false;
                    }
                }
            }
        }

        return;
    }

    const query =
        state.searchQuery.trim().toLowerCase();

    const hasTextSearch =
        query !== "";

    const hasTypeSearch =
        state.searchTypes.size > 0;

    const hasEnvironmentSearch =
        ENVIRONMENTS.some(
            environment =>
                state.environmentFilters[environment] !== 0
        );

    let pattern = null;

    if (hasTextSearch) {
        pattern =
            query
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                .replace(/\\\*/g, ".*");

        pattern =
            new RegExp(
                `^${pattern}$`,
                "i"
            );
    }

    function matches(object) {
        // Type
        if (hasTypeSearch) {
            const matchesType =
                object.role === "droid"
                    ? state.searchTypes.has("Droid")
                    : state.searchTypes.has(
                        object.row.Type
                    );

            if (!matchesType) {
                return false;
            }
        }

        if (hasEnvironmentSearch) {
            if (
                !objectMatchesEnvironmentSearch(
                    object
                )
            ) {
                return false;
            }
        }

        if (pattern) {
            const name =
                String(object.name || "");
        
            if (!pattern.test(name)) {
                return false;
            }
        }

        if (
            state.searchListView === "planets" &&
            !objectHasMatchingMission(object)
        ) {
            return false;
        }

        return true;
    }

    for (const system of state.systems) {
        for (const object of system.objects) {
            object.searchMatch =
                matches(object);

            if (object.role === "moon") {
                for (const droid of object.droids) {
                    droid.searchMatch =
                        matches(droid);
                }
            }
        }
    }
}


function missionMatchesMissionFilters(mission) {
    const filters =
        state.missionFilters;

    const query =
        filters.name
            .trim()
            .toLowerCase();

    if (query !== "") {
        const pattern =
            query
                .replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )
                .replace(
                    /\\\*/g,
                    ".*"
                );

        const regex =
            new RegExp(
                `^${pattern}$`,
                "i"
            );

        if (!regex.test(mission.Name)) {
            return false;
        }
    }

    if (
        filters.types.size > 0 &&
        !filters.types.has(
            mission.Type
        )
    ) {
        return false;
    }

    const waves =
        Number(mission.Waves);

    if (
        waves < filters.minWaves ||
        waves > filters.maxWaves
    ) {
        return false;
    }

    const diffLow =
        parseFloat(
            mission["Diff Low%"]
        );

    if (
        diffLow <
            filters.minDifficultyLow ||
        diffLow >
            filters.maxDifficultyLow
    ) {
        return false;
    }

    const diffHigh =
        parseFloat(
            mission["Diff High%"]
        );

    if (
        diffHigh <
            filters.minDifficultyHigh ||
        diffHigh >
            filters.maxDifficultyHigh
    ) {
        return false;
    }

    return true;
}


function getMissionSearchCount(object) {
    return (
        state.missionCountsByObject.get(
            object
        ) || 0
    );
}

function getSystemMissionSearchCount(system) {
    return (
        state.missionCountsBySystem.get(
            system
        ) || 0
    );
}

function getConstellationMissionSearchCount(
    constellation
) {
    return (
        state.missionCountsByConstellation.get(
            constellation
        ) || 0
    );
}


function getSystemSearchCount(system) {
    if (
        state.searchListView ===
        "missions"
    ) {
        return getSystemMissionSearchCount(
            system
        );
    }

    if (!isSearchActive()) {
        return 0;
    }

    let count = 0;

    for (const object of system.objects) {
        if (objectMatchesSearch(object)) {
            count++;
        }

        if (object.role === "moon") {
            for (const droid of object.droids) {
                if (objectMatchesSearch(droid)) {
                    count++;
                }
            }
        }
    }

    return count;
}


function getPlanetSearchCount(planet) {
    if (
        state.searchListView ===
        "missions"
    ) {
        return getMissionSearchCount(
            planet
        );
    }

    if (!isSearchActive()) {
        return 0;
    }

    return objectMatchesSearch(planet)
        ? 1
        : 0;
}


function getMoonSearchCount(moon) {
    if (
        state.searchListView ===
        "missions"
    ) {
        return getMissionSearchCount(
            moon
        );
    }

    if (!isSearchActive()) {
        return 0;
    }

    return objectMatchesSearch(moon)
        ? 1
        : 0;
}


function getDroidSearchCount(droid) {
    if (
        state.searchListView ===
        "missions"
    ) {
        return getMissionSearchCount(
            droid
        );
    }

    if (!isSearchActive()) {
        return 0;
    }

    return objectMatchesSearch(droid)
        ? 1
        : 0;
}


function getConstellationSearchCount(constellation) {
    if (
        state.searchListView ===
        "missions"
    ) {
        return getConstellationMissionSearchCount(
            constellation
        );
    }

    if (!isSearchActive()) {
        return 0;
    }

    let count = 0;

    for (const system of constellation.systems) {
        count +=
            getSystemSearchCount(
                system
            );
    }

    return count;
}


function getConstellationSearchAlpha(constellation)
 {
    if (!isSearchActive()) {
        return 1;
    }

    const count =
        getConstellationSearchCount(
            constellation
        );

    return count === 0
        ? 0.18
        : 1;
}


function getScreenRadius(worldRadius) {
    return Math.max(
        worldRadius *
        state.camera.zoom,

        0.5
    );
}


function drawCircle(
    x,
    y,
    radius,
    fillStyle,
    strokeStyle = null,
    lineWidth = 1
) {
    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = fillStyle;
    ctx.fill();

    if (strokeStyle) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
}


function getScreenUIScale() {
    return Math.min(
        1,
        Math.max(
            0.5,
            state.canvasWidth / 720
        )
    );
}


function drawLabel(
    text,
    x,
    y,
    size = 12,
    alpha = 1,
    color = "#FFFFFF"
) {
    if (!showLabelsCheckbox.checked) {
        return;
    }

    const scale =
        getScreenUIScale();

    size *= scale;

    ctx.save();

    ctx.globalAlpha = alpha;

    ctx.font =
        `700 ${size}px system-ui, sans-serif`;

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    ctx.fillStyle =
        darkenColor(color, 0.8);

    ctx.strokeStyle = color;

    ctx.lineWidth = 3;

    ctx.lineJoin = "round";

    ctx.strokeText(
        text,
        x,
        y
    );

    ctx.fillText(
        text,
        x,
        y
    );

    ctx.restore();
}


function drawSearchIndicator(
    count,
    x,
    y,
    color
) {
    if (!isSearchActive()) {
        return;
    }

    const scale =
        getScreenUIScale();

    ctx.save();

    if (count < 2) {
        ctx.restore();
        return;
    }

    ctx.globalAlpha = 1;

    ctx.fillStyle = "#000000";
    ctx.strokeStyle = color;
    ctx.lineWidth =
        Math.max(
            1,
            2 * scale
        );

    ctx.beginPath();

    ctx.arc(
        x,
        y + 7 * scale,
        12 * scale,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font =
        `${12 * scale}px system-ui, sans-serif`;

    ctx.fillStyle = color;

    ctx.fillText(
        count.toLocaleString(),
        x,
        y + 7 * scale
    );

    ctx.restore();
}


function drawConnections() {
    if (!showConnectionsCheckbox.checked) {
        return;
    }

    for (const edge of state.connections) {
        const a = edge.a;
        const b = edge.b;

        const ax = a.x;
        const ay = a.y;

        const bx = b.x;
        const by = b.y;

        const dx = bx - ax;
        const dy = by - ay;

        const distance =
            Math.hypot(dx, dy);

        if (distance <= 0) {
            continue;
        }

        const nx = dx / distance;
        const ny = dy / distance;

        const startX =
            ax +
            nx * a.outerRadius;

        const startY =
            ay +
            ny * a.outerRadius;

        const endX =
            bx -
            nx * b.outerRadius;

        const endY =
            by -
            ny * b.outerRadius;

        const start =
            worldToScreen(
                startX,
                startY
            );

        const end =
            worldToScreen(
                endX,
                endY
            );

        // Fading connections if zoomed in closer
        const alphaBase =
            clamp(
                0.45 / Math.sqrt(
                    state.camera.zoom
                ),
                0.06,
                0.45
            );

        const searchAlpha =
            getConstellationSearchAlpha(
                a.constellation
            );

        const alpha =
            alphaBase * searchAlpha;

        ctx.save();

        ctx.globalAlpha = alpha;

        ctx.strokeStyle =
            a.constellation.color;

        ctx.lineWidth =
            Math.max(
                0.5,
                CONFIG.CONNECTION_WIDTH
            );

        ctx.beginPath();

        ctx.moveTo(
            start.x,
            start.y
        );

        ctx.lineTo(
            end.x,
            end.y
        );

        ctx.stroke();

        ctx.restore();
    }
}


function drawSystemMarker(system) {
    if (
        system.isWormhole &&
        !showWormholesCheckbox.checked &&
        state.camera.zoom < CONFIG.OBJECT_LABEL_ZOOM
    ) {
        return;
    }

    const center =
        getSystemCenter(system);

    const viewMargin =
        Math.max(
            100,
            getScreenRadius(
                system.isWormhole
                    ? system.outerRadius + 100
                    : system.outerRadius
            ) + 20
        );

    if (
        center.x < -viewMargin ||
        center.y < -viewMargin ||
        center.x > state.canvasWidth + viewMargin ||
        center.y > state.canvasHeight + viewMargin
    ) {
        return;
    }

    ctx.save();

    if (
        state.camera.zoom <
        CONFIG.SYSTEM_LABEL_ZOOM
    ) {
        ctx.globalAlpha =
            getConstellationSearchAlpha(
                system.constellation
            );

        drawCentralObject(system);

        ctx.restore();
        return;
    }

    const count =
        getSystemSearchCount(system);

    const searchAlpha =
        isSearchActive() && count === 0
            ? 0.18
            : 1;

    ctx.globalAlpha =
        searchAlpha;

    if (
        state.camera.zoom <
        CONFIG.SYSTEM_DETAIL_ZOOM
    ) {
        drawCentralObject(system);

        const labelY =
            center.y -
            getScreenRadius(
                CONFIG.STAR_BASE_RADIUS
            ) -
            5;

        drawLabel(
            system.name,
            center.x,
            labelY,
            16,
            ctx.globalAlpha,
            system.constellation.color
        );

        if (isSearchActive()) {
            drawSearchIndicator(
                count,
                center.x,
                labelY + 4,
                system.constellation.color
            );
        }

        ctx.restore();
        return;
    }
    drawDetailedSystem(system);

    ctx.restore();
}


function drawCentralObject(system) {
    if (system.isWormhole) {
        const center =
            getSystemCenter(system);

        const radius =
            Math.max(
                getScreenRadius(0.4),
                CONFIG.MIN_STAR_SCREEN_RADIUS
            );

        ctx.save();

        const wormhole =
            system.centerObjects[0];

        const searchAlpha =
            isSearchActive()
                ? (
                    state.searchListView === "missions"
                        ? (
                            getMissionSearchCount(
                                wormhole
                            ) === 0
                                ? 0.18
                                : 1
                        )
                        : (
                            !objectMatchesSearch(
                                wormhole
                            )
                                ? 0.18
                                : 1
                        )
                )
                : 1;

        ctx.globalAlpha =
            searchAlpha;

        ctx.translate(
            center.x,
            center.y
        );

        ctx.rotate(
            state.orbitTime *
            CONFIG.DEFAULT_ORBIT_SPEED *
            4
        );

        ctx.translate(
            -center.x,
            -center.y
        );

        ctx.fillStyle = "#000000";

        ctx.beginPath();

        ctx.arc(
            center.x,
            center.y,
            radius * 0.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.lineCap = "round";

        ctx.lineWidth =
            Math.max(
                1.5,
                radius * 0.12
            );

        const segments = 40;
        const turns = 1;

        for (let s = 0; s < 3; s++) {
            ctx.beginPath();

            const startAngle =
                s * (Math.PI * 2 / 3);

            for (let i = 0; i <= segments; i++) {
                const t =
                    i / segments;

                const angle =
                    startAngle +
                    t *
                    Math.PI *
                    2 *
                    turns;

                const swirlRadius =
                    radius *
                    (
                        0.45 +
                        t * 0.65
                    );

                const x =
                    center.x +
                    Math.cos(angle) *
                    swirlRadius;

                const y =
                    center.y +
                    Math.sin(angle) *
                    swirlRadius;

                if (i === 0) {
                    ctx.moveTo(x, y);
                }
                else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.strokeStyle =
                s === 0
                    ? "#bf00ff"
                    : s === 1
                        ? "#7f00ff"
                        : "#3f007f";

            ctx.globalAlpha =
                searchAlpha *
                (
                    s === 0
                        ? 0.9
                        : 0.6
                );

            ctx.stroke();
        }

        ctx.restore();

        const stableCenter = {
            x: Math.round(center.x),
            y: Math.round(center.y)
        };
        
        ctx.save();
        
        ctx.globalAlpha =
            searchAlpha;
        
        ctx.strokeStyle =
            "#bf00ff";
        
        ctx.lineWidth =
            Math.max(
                1,
                radius * 0.08
            );
        
        ctx.beginPath();
        
        ctx.arc(
            stableCenter.x,
            stableCenter.y,
            radius * 0.5,
            0,
            Math.PI * 2
        );
        
        ctx.stroke();
        
        ctx.fillStyle = "#000000";
        
        ctx.beginPath();
        
        ctx.arc(
            stableCenter.x,
            stableCenter.y,
            radius * 0.5,
            0,
            Math.PI * 2
        );
        
        ctx.fill();
        
        ctx.restore();

        return;
    }

    for (
        let i = 0;
        i < system.centerObjects.length;
        i++
    ) {
        const star =
            system.centerObjects[i];

        const position =
            getCentralStarScreenPosition(
                system,
                i
            );

        const radius =
            Math.max(
                getScreenRadius(
                    star.baseRadius
                ),
                CONFIG.MIN_STAR_SCREEN_RADIUS
            );

        const starColor =
            getStarColor(
                system,
                i
            );

        const alpha =
            state.camera.zoom <
            CONFIG.SYSTEM_LABEL_ZOOM
                ? getConstellationSearchAlpha(
                    system.constellation
                )
                : state.camera.zoom <
                  CONFIG.SYSTEM_DETAIL_ZOOM
                    ? (
                        isSearchActive() &&
                        getSystemSearchCount(
                            system
                        ) === 0
                            ? 0.18
                            : 1
                    )
                    : (
                        isSearchActive()
                            ? (
                                state.searchListView ===
                                "missions"
                                    ? (
                                        getMissionSearchCount(
                                            star
                                        ) === 0
                                            ? 0.18
                                            : 1
                                    )
                                    : (
                                        !objectMatchesSearch(
                                            star
                                        )
                                            ? 0.18
                                            : 1
                                    )
                            )
                            : 1
                    );

        ctx.save();

        ctx.globalAlpha = alpha;

        drawCircle(
            position.x,
            position.y,
            radius,
            starColor,
            starColor,
            1
        );

        ctx.restore();
    }
}


function drawDetailedSystem(system) {
    const count =
        getSystemSearchCount(system);

    const alpha =
        isSearchActive() && count === 0
            ? 0.18
            : 1;

    if (system.isWormhole) {
        drawCentralObject(system);

        const center =
            getSystemCenter(system);

        const labelY =
            center.y -
            getScreenRadius(
                CONFIG.STAR_BASE_RADIUS
            ) -
            8;

        drawLabel(
            system.name,
            center.x,
            labelY,
            16,
            alpha,
            system.constellation.color
        );

        if (isSearchActive()) {
            drawSearchIndicator(
                count,
                center.x,
                labelY + 4,
                system.constellation.color
            );
        }

        return;
    }

    const center =
        getSystemCenter(system);

    drawCentralObject(system);

    if (
        state.camera.zoom >=
        CONFIG.OBJECT_LABEL_ZOOM
    ) {
        for (
            let i = 0;
            i < system.centerObjects.length;
            i++
        ) {
            const star =
                system.centerObjects[i];

            const position =
                getCentralStarScreenPosition(
                    system,
                    i
                );

            const radius =
                Math.max(
                    getScreenRadius(
                        star.baseRadius
                    ),
                    CONFIG.MIN_STAR_SCREEN_RADIUS
                );

            const labelY =
                position.y -
                radius -
                3;

            const starAlpha =
                isSearchActive()
                    ? (
                        state.searchListView === "missions"
                            ? (
                                getMissionSearchCount(star) === 0
                                    ? 0.18
                                    : 1
                            )
                            : (
                                !objectMatchesSearch(star)
                                    ? 0.18
                                    : 1
                            )
                    )
                    : 1;

            if (isSearchActive()) {
                const count =
                    state.searchListView === "missions"
                        ? getMissionSearchCount(star)
                        : objectMatchesSearch(star)
                            ? 1
                            : 0;
                    
                drawSearchIndicator(
                    count,
                    position.x,
                    labelY + 4,
                    system.constellation.color
                );
            }

            drawLabel(
                star.name,
                position.x,
                labelY,
                12,
                starAlpha,
                system.constellation.color
            );
        }
    }

    if (
        showOrbitsCheckbox.checked &&
        state.camera.zoom >= CONFIG.ORBIT_ZOOM
    ) {
        drawOrbitRings(system);
    }

    for (const planet of system.planets) {
        drawPlanet(planet);
    }

    if (
        state.camera.zoom >=
        CONFIG.SYSTEM_LABEL_ZOOM &&
        state.camera.zoom < CONFIG.OBJECT_LABEL_ZOOM
    ) {
        const labelY =
            center.y -
            getScreenRadius(
                CONFIG.STAR_BASE_RADIUS
            ) -
            8;

        drawLabel(
            system.name,
            center.x,
            labelY,
            16,
            alpha,
            system.constellation.color
        );

        if (isSearchActive()) {
            drawSearchIndicator(
                count,
                center.x,
                labelY + 4,
                system.constellation.color
            );
        }
    }
}


function drawOrbitRings(system) {
    const center =
        getSystemCenter(system);

    ctx.save();

    const orbitWidth =
        Math.max(
            0.4,
            CONFIG.ORBIT_WIDTH
        );

    const trailWidth =
        Math.max(
            2,
            CONFIG.ORBIT_WIDTH * 3
        );

    const arcLength =
        Math.PI / 3;

    const trailSegments = 6;

    for (const planet of system.planets) {
        const planetSearchAlpha =
            isSearchActive() &&
            getPlanetSearchCount(planet) === 0
                ? 0.18
                : 1;

        const radius =
            getScreenRadius(
                planet.orbitRadius
            );

        ctx.strokeStyle = "#3f3f3f";
        ctx.lineWidth = orbitWidth;

        ctx.globalAlpha =
            0.45 * planetSearchAlpha;

        ctx.beginPath();

        ctx.arc(
            center.x,
            center.y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        const planetWorldPosition =
            getPlanetWorldPosition(
                planet
            );

        const planetScreenPosition =
            worldToScreen(
                planetWorldPosition.x,
                planetWorldPosition.y
            );

        const planetScreenAngle =
            Math.atan2(
                planetScreenPosition.y -
                    center.y,
                planetScreenPosition.x -
                    center.x
            );

        const planetColor =
            getObjectFill(planet);

        ctx.strokeStyle =
            planetColor;

        ctx.lineWidth =
            trailWidth;

        for (
            let i = 0;
            i < trailSegments;
            i++
        ) {
            const t1 =
                i / trailSegments;

            const t2 =
                (i + 1) / trailSegments;

            ctx.globalAlpha =
                0.9 *
                (1 - t1) *
                planetSearchAlpha;

            ctx.beginPath();

            ctx.arc(
                center.x,
                center.y,
                radius,
                planetScreenAngle +
                    t1 * arcLength,
                planetScreenAngle +
                    t2 * arcLength
            );

            ctx.stroke();
        }

        for (const moon of planet.moons) {
            const moonSearchAlpha =
                isSearchActive() &&
                getMoonSearchCount(moon) === 0
                    ? 0.18
                    : 1;

            const moonWorldPosition =
                getMoonWorldPosition(
                    moon
                );

            const moonScreenPosition =
                worldToScreen(
                    moonWorldPosition.x,
                    moonWorldPosition.y
                );

            const moonRadius =
                getScreenRadius(
                    moon.orbitRadius
                );

            const moonScreenAngle =
                Math.atan2(
                    moonScreenPosition.y -
                        planetScreenPosition.y,
                    moonScreenPosition.x -
                        planetScreenPosition.x
                );

            ctx.strokeStyle =
                "#3f3f3f";

            ctx.lineWidth =
                orbitWidth;

            ctx.globalAlpha =
                0.25 * moonSearchAlpha;

            ctx.beginPath();

            ctx.arc(
                planetScreenPosition.x,
                planetScreenPosition.y,
                moonRadius,
                0,
                Math.PI * 2
            );

            ctx.stroke();

            const moonColor =
                getObjectFill(moon);

            ctx.strokeStyle =
                moonColor;

            ctx.lineWidth =
                trailWidth;

            for (
                let i = 0;
                i < trailSegments;
                i++
            ) {
                const t1 =
                    i / trailSegments;

                const t2 =
                    (i + 1) / trailSegments;

                ctx.globalAlpha =
                    0.9 *
                    (1 - t1) *
                    moonSearchAlpha;

                ctx.beginPath();

                ctx.arc(
                    planetScreenPosition.x,
                    planetScreenPosition.y,
                    moonRadius,
                    moonScreenAngle +
                        t1 * arcLength,
                    moonScreenAngle +
                        t2 * arcLength
                );

                ctx.stroke();
            }
        }
    }

    ctx.restore();
}

function drawPlanet(planet) {
    const worldPosition =
        getPlanetWorldPosition(planet);

    const screenPosition =
        worldToScreen(
            worldPosition.x,
            worldPosition.y
        );

    const radius =
        getScreenRadius(
            planet.baseRadius
        );

    const count =
        getPlanetSearchCount(planet);

    const alpha =
        isSearchActive() && count === 0
            ? 0.18
            : 1;

    ctx.save();

    ctx.globalAlpha = alpha;

    drawObjectCircle(
        planet,
        screenPosition.x,
        screenPosition.y,
        radius
    );

    ctx.restore();

    for (const moon of planet.moons) {
        drawMoon(moon);
    }

    if (
        state.camera.zoom >=
        CONFIG.OBJECT_LABEL_ZOOM
    ) {
        const labelY =
            screenPosition.y -
            radius -
            3;

        ctx.save();

        ctx.globalAlpha = alpha;

        drawLabel(
            planet.name,
            screenPosition.x,
            labelY,
            12,
            alpha,
            planet.system.constellation.color
        );

        ctx.restore();

        if (isSearchActive()) {
            drawSearchIndicator(
                count,
                screenPosition.x,
                labelY + 3,
                planet.system.constellation.color
            );
        }
    }
}

function drawMoon(moon) {
    const worldPosition =
        getMoonWorldPosition(moon);

    const screenPosition =
        worldToScreen(
            worldPosition.x,
            worldPosition.y
        );

    const radius =
        getScreenRadius(
            moon.baseRadius
        );

    const count =
        getMoonSearchCount(moon);

    const alpha =
        isSearchActive() && count === 0
            ? 0.18
            : 1;

    ctx.save();

    ctx.globalAlpha = alpha;

    drawObjectCircle(
        moon,
        screenPosition.x,
        screenPosition.y,
        radius
    );

    ctx.restore();

    for (const droid of moon.droids) {
        drawDroid(droid);
    }

    if (
        state.camera.zoom >=
        CONFIG.OBJECT_LABEL_ZOOM
    ) {
        const labelY =
            screenPosition.y -
            radius -
            3;

        ctx.save();

        ctx.globalAlpha = alpha;

        drawLabel(
            moon.name,
            screenPosition.x,
            labelY,
            12,
            alpha,
            moon.system.constellation.color
        );

        ctx.restore();

        if (isSearchActive()) {
            drawSearchIndicator(
                count,
                screenPosition.x,
                labelY + 3,
                moon.system.constellation.color
            );
        }
    }
}

function drawDroid(droid) {
    const worldPosition =
        getDroidWorldPosition(droid);

    const screenPosition =
        worldToScreen(
            worldPosition.x,
            worldPosition.y
        );

    const radius =
        Math.max(
            getScreenRadius(
                droid.parent.baseRadius * 0.25
            ),
            1.5
        );

    const selected =
        state.selectedObject === droid;

    const fill = "#bf9fbf";

    const stroke =
        selected
            ? "#ffffff"
            : "#7f7f7f";

    const lineWidth =
        selected ? 2 : 0.5;

    const count =
        getDroidSearchCount(droid);

    const alpha =
        isSearchActive() && count === 0
            ? 0.18
            : 1;

    ctx.save();

    ctx.globalAlpha = alpha;

    drawCircle(
        screenPosition.x,
        screenPosition.y,
        radius,
        fill,
        stroke,
        lineWidth
    );

    const bodyWidth =
        radius * 1.2;

    const bodyHeight =
        radius * 0.6;

    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();

    ctx.rect(
        screenPosition.x -
            bodyWidth / 2,

        screenPosition.y +
            radius * 0.7,

        bodyWidth,
        bodyHeight
    );

    ctx.fill();
    ctx.stroke();

    ctx.restore();

    if (
        state.camera.zoom >=
        CONFIG.OBJECT_LABEL_ZOOM
    ) {
        const labelY =
            screenPosition.y -
            radius -
            3;

        ctx.save();

        ctx.globalAlpha = alpha;

        drawLabel(
            droid.name,
            screenPosition.x,
            labelY,
            12,
            alpha,
            droid.system.constellation.color
        );

        ctx.restore();

        if (isSearchActive()) {
            drawSearchIndicator(
                count,
                screenPosition.x,
                labelY + 3,
                droid.system.constellation.color
            );
        }
    }
}

function getConstellationCenter(constellation) {
    if (constellation.systems.length === 0) {
        return null;
    }

    let x = 0;
    let y = 0;

    for (const system of constellation.systems) {
        x += system.x;
        y += system.y;
    }

    return {
        x:
            x / constellation.systems.length,

        y:
            y / constellation.systems.length
    };
}

function constellationHasWormhole(constellation) {
    return constellation.systems.some(
        system => system.isWormhole
    );
}

function drawConstellationLabel(constellation) {
    if (
        state.camera.zoom >=
        CONFIG.SYSTEM_LABEL_ZOOM
    ) {
        return;
    }

    if (
        constellationHasWormhole(constellation) &&
        !showWormholesCheckbox.checked &&
        state.camera.zoom < CONFIG.OBJECT_LABEL_ZOOM
    ) {
        return;
    }

    const center =
        getConstellationCenter(
            constellation
        );

    if (!center) {
        return;
    }

    const screen =
        worldToScreen(
            center.x,
            center.y
        );

    const count =
        getConstellationSearchCount(
            constellation
        );

    const alpha =
        isSearchActive() && count === 0
            ? 0.18
            : 1;

    drawLabel(
        constellation.name,
        screen.x,
        screen.y,
        16,
        alpha,
        constellation.color
    );

    if (isSearchActive()) {
        drawSearchIndicator(
            count,
            screen.x,
            screen.y + 4,
            constellation.color
        );
    }
}


function sortSearchResults(results) {
    if (state.searchSortMode === "name") {
        return results.sort(
            (a, b) =>
                a.name.localeCompare(
                    b.name
                )
        );
    }

    if (state.searchSortMode === "proximity") {
        const camera =
            getCameraWorldPosition();

        return results.sort(
            (a, b) => {
                const ap =
                    getObjectWorldPosition(a);

                const bp =
                    getObjectWorldPosition(b);

                const da =
                    Math.hypot(
                        ap.x - camera.x,
                        ap.y - camera.y
                    );

                const db =
                    Math.hypot(
                        bp.x - camera.x,
                        bp.y - camera.y
                    );

                return da - db;
            }
        );
    }

    if (state.searchSortMode === "type") {
        return results.sort(
            (a, b) => {
                const typeA =
                    a.role === "droid"
                        ? "Droid"
                        : a.row.Type;
    
                const typeB =
                    b.role === "droid"
                        ? "Droid"
                        : b.row.Type;
    
                return (
                    typeA.localeCompare(typeB) ||
                    a.name.localeCompare(b.name)
                );
            }
        );
    }

    if (state.searchSortMode === "environment") {
        return results.sort(
            (a, b) =>
                getEnvironmentSortKey(b) -
                getEnvironmentSortKey(a) ||
                a.name.localeCompare(b.name)
        );
    }

    // Internal order.
    return results;
}


function getSearchResultColor(object) {
    if (object.role === "droid") {
        return "#bf9fbf";
    }

    if (
        object.type === "Sun" ||
        object.type === "Binary Sun"
    ) {
        const starIndex =
            object.system.centerObjects.indexOf(
                object
            );

        return getStarColor(
            object.system,
            starIndex
        );
    }

    if (object.type === "Wormhole") {
        return "#bf00ff";
    }

    return getObjectFill(object);
}


function getEnvironmentEmojis(object) {
    let emojis = "";

    if (object.row.Massive) {
        emojis += "☀️";
    }

    if (object.row.Hot) {
        emojis += "🔥";
    }

    if (object.row.Electric) {
        emojis += "⚡";
    }

    if (object.row.Frozen) {
        emojis += "❄️";
    }

    if (object.row.Singularity) {
        emojis += "⚫";
    }

    return emojis;
}


function updateMissionSearchResults() {
    state.missionSearchResults.clear();

    state.missionCountsByObject.clear();
    state.missionCountsBySystem.clear();
    state.missionCountsByConstellation.clear();

    let missionCount = 0;

    for (const mission of state.missions) {
        const object =
            mission.object;

        if (
            !objectPassesPlanetFilters(
                object
            )
        ) {
            continue;
        }

        if (
            !missionMatchesMissionFilters(
                mission
            )
        ) {
            continue;
        }

        state.missionSearchResults.add(
            mission
        );

        missionCount++;

        const system =
            object.system;

        const constellation =
            system.constellation;

        state.missionCountsByObject.set(
            object,
            (
                state.missionCountsByObject.get(
                    object
                ) || 0
            ) + 1
        );

        state.missionCountsBySystem.set(
            system,
            (
                state.missionCountsBySystem.get(
                    system
                ) || 0
            ) + 1
        );

        state.missionCountsByConstellation.set(
            constellation,
            (
                state.missionCountsByConstellation.get(
                    constellation
                ) || 0
            ) + 1
        );
    }

    state.missionSearchCount =
        missionCount;
}


function objectPassesPlanetFilters(object) {
    if (state.searchTypes.size > 0) {
        const matchesType =
            object.role === "droid"
                ? state.searchTypes.has("Droid")
                : state.searchTypes.has(
                    object.row.Type
                );

        if (!matchesType) {
            return false;
        }
    }

    if (
        !objectMatchesEnvironmentSearch(
            object
        )
    ) {
        return false;
    }

    const query =
        state.searchQuery
            .trim()
            .toLowerCase();

    if (query !== "") {
        const pattern =
            query
                .replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                )
                .replace(
                    /\\\*/g,
                    ".*"
                );

        const regex =
            new RegExp(
                `^${pattern}$`,
                "i"
            );

        if (
            !regex.test(
                object.name
            )
        ) {
            return false;
        }
    }

    return true;
}


function missionMatchesSearch(mission) {
    return state.missionSearchResults.has(
        mission
    );
}


function updateSearchResultsList() {
    if (!state.searchListMode) {
        return;
    }

    searchResultsEmpty.classList.add(
        "hidden"
    );

    if (
        state.searchListContent ===
        "missions"
    ) {
        updateMissionResultsList();

        if (
            searchResultsList.children.length === 0
        ) {
            searchResultsEmpty.classList.remove(
                "hidden"
            );
        }

        return;
    }

    const results =
        sortSearchResults(
            getSearchResultObjects()
        );

    searchResultsList.innerHTML = "";

    if (results.length === 0) {
        searchResultsEmpty.classList.remove(
            "hidden"
        );
        return;
    }

    for (const object of results) {
        const entry =
            document.createElement("button");

        entry.className =
            "search-result-entry";

        const constellationColor =
            object.system.constellation.color;

        const objectColor =
            getSearchResultColor(object);

        entry.style.background =
            darkenColor(
                constellationColor,
                0.8
            );

        entry.style.borderColor =
            constellationColor;

        entry.style.color =
            constellationColor;

        const icon =
            document.createElement("span");

        icon.className =
            "search-result-icon";

        icon.textContent =
            getSearchResultIcon(object);

        icon.style.color =
            objectColor;

        icon.style.borderColor =
            objectColor;

        const name =
            document.createElement("span");
        
        name.className =
            "search-result-name";
        
        name.textContent =
            object.name;
        
        const environment =
            document.createElement("span");
        
        environment.className =
            "search-result-environment";
        
        environment.textContent =
            getEnvironmentEmojis(object);

        const worldPosition =
            getObjectWorldPosition(object);

        const coordX =
            Math.round(
                clamp(
                    worldPosition.x,
                    0,
                    CONFIG.MAP_MAX
                )
            )
            .toString()
            .padStart(3, "0");

        const coordY =
            Math.round(
                clamp(
                    worldPosition.y,
                    0,
                    CONFIG.MAP_MAX
                )
            )
            .toString()
            .padStart(3, "0");

        const coordinates =
            document.createElement("span");

        coordinates.className =
            "search-result-coordinates";

        coordinates.textContent =
            `${coordX}+${coordY}`;

        entry.appendChild(icon);
        entry.appendChild(name);
        entry.appendChild(environment);
        entry.appendChild(coordinates);

        entry.addEventListener(
            "click",
            () => {
                if (!object) {
                    return;
                }
        
                focusObject(
                    object,
                    true
                );
            }
        );

        searchResultsList.appendChild(entry);
        
    }
}


function areMissionFiltersActive() {
    const filters =
        state.missionFilters;

    return (
        filters.name.trim() !== "" ||
        filters.types.size > 0 ||
        filters.minWaves !== 3 ||
        filters.maxWaves !== 50 ||
        filters.minDifficultyLow !== 0 ||
        filters.maxDifficultyLow !== 100 ||
        filters.minDifficultyHigh !== 0 ||
        filters.maxDifficultyHigh !== 100
    );
}


function objectHasMatchingMission(object) {
    if (!areMissionFiltersActive()) {
        return true;
    }

    return ((state.missionCountsByObject.get(object) || 0) > 0);
}


function getSortLabel() {
    switch (state.searchSortMode) {
        case "proximity":
            return "Proximity";

        case "name":
            return "Name";

        case "type":
            return "Type";

        case "duration":
            return "Duration";

        case "difficulty":
            return "Difficulty";

        case "environment":
            return "Environment";

        default:
            return "Default";
    }
}


function sortMissions(missions) {
    if (state.searchSortMode === "name") {
        return missions.sort(
            (a, b) =>
                a.Name.localeCompare(
                    b.Name
                )
        );
    }

    if (state.searchSortMode === "proximity") {
        const camera =
            getCameraWorldPosition();

        return missions.sort(
            (a, b) => {
                const positionA =
                    getObjectWorldPosition(
                        a.object
                    );

                const positionB =
                    getObjectWorldPosition(
                        b.object
                    );

                const distanceA =
                    Math.hypot(
                        positionA.x - camera.x,
                        positionA.y - camera.y
                    );

                const distanceB =
                    Math.hypot(
                        positionB.x - camera.x,
                        positionB.y - camera.y
                    );

                return distanceA - distanceB;
            }
        );
    }

    if (state.searchSortMode === "type") {
        return missions.sort(
            (a, b) =>
                a.Type.localeCompare(
                    b.Type
                ) ||
                a.Name.localeCompare(
                    b.Name
                )
        );
    }

    if (state.searchSortMode === "duration") {
        return missions.sort(
            (a, b) =>
                a.Waves - b.Waves ||
                a.Name.localeCompare(
                    b.Name
                )
        );
    }

    if (state.searchSortMode === "difficulty") {
        return missions.sort(
            (a, b) =>
                parseFloat(a["Diff Low%"]) -
                parseFloat(b["Diff Low%"]) ||
                a.Name.localeCompare(
                    b.Name
                )
        );
    }

    if (state.searchSortMode === "environment") {
        return missions.sort(
            (a, b) =>
                getEnvironmentSortKey(b.object) -
                getEnvironmentSortKey(a.object) ||
                a.Name.localeCompare(b.Name)
        );
    }

    return missions;
}


function getEnvironmentSortKey(object) { // matches order in-game roughly
    const electric =
        object.row.Electric === true;

    const hot =
        object.row.Hot === true;

    const massive =
        object.row.Massive === true;

    const frozen =
        object.row.Frozen === true;

    const singularity =
        object.row.Singularity === true;

    if (electric && hot) {
        return 7;
    }

    if (massive && hot) {
        return 6;
    }

    if (electric && frozen) {
        return 5;
    }

    if (electric) {
        return 4;
    }

    if (hot) {
        return 3;
    }

    if (frozen) {
        return 2;
    }

    if (singularity) {
        return 1;
    }

    return 0;
}


function updateMissionResultsList() {
    if (!state.searchListMode) {
        return;
    }

    const sourceMissions =
        state.focusedMissionListMode &&
        state.camera.focusObject
            ? state.camera.focusObject.missions
            : state.missions;

    const missions =
        sortMissions(
            sourceMissions
                .filter(
                    mission =>
                        state.missionSearchResults.has(
                            mission
                        )
                )
                .slice()
        );

    searchResultsList.innerHTML = "";

    for (const mission of missions) {
        const entry =
            document.createElement("button");

        entry.className =
            "search-result-entry";

        const missionColor =
            getMissionColor(mission);

        entry.style.background =
            darkenColor(
                missionColor,
                0.8
            );

        entry.style.borderColor =
            missionColor;

        entry.style.color =
            missionColor;

        const icon =
            document.createElement("span");

        icon.className =
            "search-result-icon mission-result-icon";

        icon.textContent =
            getSearchResultIcon({
                role: "mission",
                Type: mission.Type
            });

        icon.style.color =
            missionColor;

        icon.style.borderColor =
            missionColor;

        const name =
            document.createElement("span");

        name.className =
            "search-result-name mission-result-name";

        name.textContent =
            mission.Name;

        const object =
            mission.object;
        
        const environment =
            document.createElement("span");
        
        environment.className =
            "mission-result-environment";
        
        environment.textContent =
            mission.environmentEmojis;

        const missionStats =
            document.createElement("span");

        missionStats.className =
            "mission-result-stats";

        const waves =
            document.createElement("span");

        waves.className =
            "mission-result-waves";

        waves.textContent =
            mission.Waves;

        const difficulty =
            document.createElement("span");

        difficulty.className =
            "mission-result-difficulty";

        difficulty.textContent =
            mission["Diff Low%"];

        missionStats.appendChild(waves);
        missionStats.appendChild(difficulty);

        entry.appendChild(icon);
        entry.appendChild(name);
        entry.appendChild(environment);
        entry.appendChild(missionStats);

        entry.addEventListener(
            "click",
            () => {
                if (!object) {
                    return;
                }
        
                focusObject(
                    object,
                    false
                );
        
                showMissionInfo(
                    mission
                );
            }
        );

        searchResultsList.appendChild(
            entry
        );
    }
}


function getMissionColor(mission) {
    switch (mission.Type) {
        case "Chicken Invasion":
            return "#D8826C";

        case "Supernova":
            return "#D86CB8";

        case "Squawk Block":
            return "#B86CD8";

        case "Comet Chase":
            return "#D86C97";

        case "Boss Rush":
            return "#D86C77";

        case "Darkness":
            return "#776CD7";

        case "Feather Fields":
            return "#6CD8CD";

        case "Double Team":
            return "#6CD86C";

        case "Meteor Storm":
            return "#6C82D8";

        case "Retro":
            return "#976CD8";

        case "Key Rush":
            return "#E0AA38";

        default:
            return "#D86CD8";
    }
}


function exitFocusedMissionMode() {
    if (state.focusedMissionListMode == false) {
        return;
    }
        
    state.focusedMissionListMode = false;

    searchResultsPanel.classList.add(
        "hidden"
    );

    optionsPanel.classList.add(
        "hidden"
    );

    backButton.classList.add(
        "hidden"
    );

    sortSearchButton.classList.add(
        "hidden"
    );

    searchListButton.classList.add(
        "hidden"
    );

    focusedMissionControls.classList.add(
        "hidden"
    );

    zoomControls.classList.remove(
        "hidden"
    );

    menuButton.classList.remove(
        "hidden"
    );

    infoContent.innerHTML = "";
    infoTitle.textContent = "";
    infoPanel.classList.add("hidden");

    state.searchListMode = false;
}


function canShowFocusedMissions(object) {
    if (!object) {
        return false;
    }

    if (
        object.role === "moon" &&
        isSpecialMoonType(object)
    ) {
        return false;
    }

    return (
        Array.isArray(object.missions) &&
        object.missions.length > 0
    );
}


function focusObject(
    object,
    showInfo = true
) {
    const worldPosition =
        getObjectWorldPosition(object);

    state.camera.zoom =
        clampZoom(
            CONFIG.FOCUS_ZOOM
        );

    state.camera.offsetX =
        state.canvasWidth / 2 -
        worldPosition.x *
        state.camera.zoom;

    state.camera.offsetY =
        state.canvasHeight / 2 -
        (
            CONFIG.MAP_MAX -
            worldPosition.y
        ) *
        state.camera.zoom;

    state.camera.focusObject =
        object;

    zoomControls.classList.add(
        "hidden"
    );

    if (
        canShowFocusedMissions(object) &&
        !state.focusedMissionListMode
    ) {
        focusedMissionControls.classList.remove(
            "hidden"
        );
    
        zoomControls.classList.add(
            "hidden"
        );
    }
    else {
        focusedMissionControls.classList.add(
            "hidden"
        );
    
        if (!state.focusedMissionListMode) {
            zoomControls.classList.remove(
                "hidden"
            );
        }
    }

    if (showInfo) {
        showObjectInfo(object);
    }
    else {
        render();
    }
}


function updateProximitySort() {
    if (
        state.searchListMode &&
        state.searchSortMode === "proximity"
    ) {
        updateSearchResultsList();
    }
}


function getSearchResultIcon(object) {
    switch (object.role) {
        case "droid":
            return "DR";

        case "mission":
            switch (object.Type) {
                case "Chicken Invasion":
                    return "CI";
                    
                case "Boss Rush":
                    return "BR";

                case "Supernova":
                    return "SU";

                case "Squawk Block":
                    return "SB";

                case "Comet Chase":
                    return "CC";

                case "Darkness":
                    return "DA";

                case "Feather Fields":
                    return "FF";
                
                case "Meteor Storm":
                    return "MS";

                case "Key Rush":
                    return "KR";

                case "Double Team":
                    return "DT";
                
                case "Retro":
                    return "RE";

                default:
                    return "DR";
            }

        default:
            switch (object.type) {
                case "Sun":
                    return "SU";

                case "Binary Sun":
                    return "BS";

                case "Wormhole":
                    return "WH";

                case "Gas giant":
                    return "GG";

                case "Inferno":
                    return "IN";

                case "Terran planet":
                    return "TP";

                case "Frozen wasteland":
                    return "FW";

                case "Alien world":
                    return "AW";

                case "Barren rock":
                    return "BR";

                case "Artificial moon":
                    return "AM";

                case "Asteroid belt":
                    return "AB";

                case "Heroes Academy":
                    return "HA";

                case "Heroware":
                    return "HW";

                case "Aftermarket Station":
                    return "AS";

                case "Fortune Teller":
                    return "FT";

                case "Gus's Gas":
                    return "GU";

                case "Space Burger":
                    return "SB";

                default:
                    return "DR";
            }
    }
}


function getSearchResultObjects() {
    const results = [];

    for (const system of state.systems) {
        for (const object of system.centerObjects) {
            if (
                !isSearchActive() ||
                objectMatchesSearch(object)
            ) {
                results.push(object);
            }
        }

        for (const planet of system.planets) {
            if (
                !isSearchActive() ||
                objectMatchesSearch(planet)
            ) {
                results.push(planet);
            }

            for (const moon of planet.moons) {
                if (
                    !isSearchActive() ||
                    objectMatchesSearch(moon)
                ) {
                    results.push(moon);
                }

                for (const droid of moon.droids) {
                    if (
                        !isSearchActive() ||
                        objectMatchesSearch(droid)
                    ) {
                        results.push(droid);
                    }
                }
            }
        }
    }

    return results;
}

function getStarColor(system, starIndex = 0) {
    const planetCount =
        system.planets.length;

    const primaryColor =
        planetCount <= 1
            ? "#FF3F00"
            : planetCount === 2
                ? "#FF7F00"
                : planetCount === 3
                    ? "#FFFF00"
                    : planetCount === 4
                        ? "#FFFF7F"
                        : planetCount === 5
                        ? "#00FFFF" : "#7FFFFF"

    if (
        !system.isBinary ||
        starIndex === 0
    ) {
        return primaryColor;
    }

    const colors = [
        "#FF3F00",
        "#FF7F00",
        "#FFFF00",
        "#FFFF7F",
        "#00FFFF"
    ];

    const value =
        Math.sin(
            system.x * 12.9898 +
            system.y * 78.233 +
            45.164
        ) *
        43758.5453;

    const fraction =
        value -
        Math.floor(value);

    return colors[
        Math.floor(
            fraction * colors.length
        )
    ];
}


function getObjectFill(object) {
    const type = object.row.Type;

    switch (type) {
        case "Gas giant":
            return "#00ffaf";

        case "Inferno":
            return "#ff3f1f";

        case "Terran planet":
            return "#009fff";

        case "Barren rock":
            return "#3f3f3f";

        case "Frozen wasteland":
            return "#1f7f7f";

        case "Artificial moon":
            return "#dfdfdf";

        case "Asteroid belt":
            return "#7f7f7f";

        case "Heroes Academy":
            return "#ffff7f";

        case "Heroware":
            return "#7f1f1f";

        case "Aftermarket Station":
            return "#00ff00";

        case "Fortune Teller":
            return "#7f00ff";

        case "Gus's Gas":
            return "#0000ff";
            
        case "Space Burger":
            return "#ffbf7f";

        default:
            return "#ff00ff";
    }
}

function isSpecialMoonType(object) {
    return [
        "Heroware",
        "Heroes Academy",
        "Fortune Teller",
        "Gus's Gas",
        "Space Burger",
        "Aftermarket Station"
    ].includes(object.row.Type);
}


function drawObjectCircle(
    object,
    x,
    y,
    radius
) {
    const selected =
        state.selectedObject === object;

    const fill =
        getObjectFill(object);

    let stroke;

    if (object.row.Electric) {
        stroke = "#ffe600";
    }
    else if (object.row.Hot) {
        stroke = "#ff8c00";
    }
    else if (object.row.Frozen) {
        stroke = "#00e5ff";
    }
    else {
        stroke =
            selected
                ? "#ffffff"
                : "#7f7f7f";
    }

    const lineWidth =
        selected ? 2 : 0.7;

    // Very small objects remain visible at high zoom
    if (radius < 2) {
        drawCircle(
            x,
            y,
            2,
            fill
        );
        return;
    }

    // Asteroid belts are 8 circles
    if (object.type === "Asteroid belt") {
        ctx.save();

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;

        const asteroidRadius =
            radius * 0.18;

        const ringRadius =
            radius * 0.65;

        for (let i = 0; i < 8; i++) {
            const angle =
                (i / 8) * Math.PI * 2;

            const asteroidX =
                x +
                Math.cos(angle) *
                ringRadius;

            const asteroidY =
                y +
                Math.sin(angle) *
                ringRadius;

            ctx.beginPath();

            ctx.arc(
                asteroidX,
                asteroidY,
                asteroidRadius,
                0,
                Math.PI * 2
            );

            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();

        return;
    }

    // Aftermarkets are also special
    if (object.type === "Aftermarket Station") {
        ctx.save();
    
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
    
        ctx.beginPath();
    
        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );
    
        ctx.arc(
            x,
            y,
            radius * 0.5,
            0,
            Math.PI * 2,
            true
        );
    
        ctx.fill("evenodd");
        ctx.stroke();
    
        ctx.restore();
    
        return;
    }

    // Other buildings
    if (isSpecialMoonType(object)) {
        ctx.save();

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;

        const width =
            radius * 0.6;

        const height =
            radius * 0.8;

        ctx.beginPath();

        ctx.rect(
            x - width / 2,
            y - height,
            width,
            height
        );

        ctx.fill();
        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius / 2,
            0,
            Math.PI,
            false
        );

        ctx.fill();
        ctx.stroke();

        ctx.restore();

        return;
    }

    drawCircle(
        x,
        y,
        radius,
        fill,
        stroke,
        lineWidth
    );
}


function clearCanvas() {
    ctx.clearRect(
        0,
        0,
        state.canvasWidth,
        state.canvasHeight
    );
}


function drawBackground() {
    ctx.fillStyle = "#00000f";

    ctx.fillRect(
        0,
        0,
        state.canvasWidth,
        state.canvasHeight
    );
}


function drawGrid() {
    const step = 100;

    ctx.save();

    ctx.strokeStyle = "#1f1f2f";
    ctx.lineWidth = 1;

    for (
        let x = 0;
        x <= CONFIG.MAP_MAX+1;
        x += step
    ) {
        const start = worldToScreen(x, 0);
        const end = worldToScreen(x, CONFIG.MAP_MAX+1);
    
        ctx.beginPath();
    
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    
        ctx.stroke();
    }
    
    for (
        let y = 0;
        y <= CONFIG.MAP_MAX+1;
        y += step
    ) {
        const start = worldToScreen(0, y);
        const end = worldToScreen(CONFIG.MAP_MAX+1, y);
    
        ctx.beginPath();
    
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
    
        ctx.stroke();
    }

    ctx.restore();
}

function updateCameraFocus() {
    const object =
        state.camera.focusObject;

    if (!object) {
        return;
    }

    const worldPosition =
        object.role === "droid"
            ? getDroidWorldPosition(object)
            : object.role === "moon"
                ? getMoonWorldPosition(object)
                : object.role === "planet"
                    ? getPlanetWorldPosition(object)
                    : {
                        x: object.row.X,
                        y: object.row.Y
                    };

    state.camera.offsetX =
        state.canvasWidth / 2 -
        worldPosition.x *
        state.camera.zoom;

    state.camera.offsetY =
        state.canvasHeight / 2 -
        (999 - worldPosition.y) *
        state.camera.zoom;
}


function render() {
    updateCameraFocus();

    clearCanvas();
    drawBackground();
    drawGrid();

    const worldle =
        screenToWorld(
            state.canvasWidth / 2,
            state.canvasHeight / 2
        );

    const coordX =
        Math.round(clamp(worldle.x, 0, 999))
            .toString()
            .padStart(3, "0");

    const coordY =
        Math.round(clamp(999-worldle.y, 0, 999))
            .toString()
            .padStart(3, "0");

    coordinatesElement.textContent =
        `${coordX}+${coordY}`;

    drawConnections();

    for (const system of state.systems) {
        drawSystemMarker(system);
    }

    for (const constellation of state.constellations) {
        drawConstellationLabel(constellation);
    }

    drawClark();
}


function getHitObjects() {
    const hits = [];

    for (
        let i = state.systems.length - 1;
        i >= 0;
        i--
    ) {
        const system = state.systems[i];

        if (
            system.isWormhole &&
            !showWormholesCheckbox.checked &&
            state.camera.zoom < CONFIG.OBJECT_LABEL_ZOOM
        ) {
            continue;
        }

        if (
            !system.isWormhole &&
            state.camera.zoom >=
            CONFIG.SYSTEM_DETAIL_ZOOM
        ) {
            for (
                let p = system.planets.length - 1;
                p >= 0;
                p--
            ) {
                const planet =
                    system.planets[p];

                const planetPosition =
                    worldToScreen(
                        ...Object.values(
                            getPlanetWorldPosition(
                                planet
                            )
                        )
                    );

                const planetRadius =
                    Math.max(
                        getScreenRadius(
                            planet.baseRadius
                        ),
                        5
                    );

                if (
                    Math.hypot(
                        currentMouse.x -
                            planetPosition.x,

                        currentMouse.y -
                            planetPosition.y
                    ) <= planetRadius
                ) {
                    hits.push(planet);
                    return hits;
                }

                for (
                    let m =
                        planet.moons.length - 1;
                    m >= 0;
                    m--
                ) {
                    const moon =
                        planet.moons[m];

                    const moonPosition =
                        worldToScreen(
                            ...Object.values(
                                getMoonWorldPosition(
                                    moon
                                )
                            )
                        );

                    
                    for (
                        let d = moon.droids.length - 1;
                        d >= 0;
                        d--
                    ) {
                        const droid =
                            moon.droids[d];
                    
                        const droidWorldPosition =
                            getDroidWorldPosition(
                                droid
                            );
                    
                        const droidPosition =
                            worldToScreen(
                                droidWorldPosition.x,
                                droidWorldPosition.y
                            );
                    
                        const droidRadius =
                            Math.max(
                                getScreenRadius(
                                    droid.parent.baseRadius * 0.25
                                ),
                                5
                            );
                    
                        if (
                            Math.hypot(
                                currentMouse.x -
                                    droidPosition.x,
                    
                                currentMouse.y -
                                    droidPosition.y
                            ) <= droidRadius
                        ) {
                            hits.push(droid);
                            return hits;
                        }
                    }

                    const moonRadius =
                        Math.max(
                            getScreenRadius(
                                moon.baseRadius
                            ),
                            5
                        );

                    if (
                        Math.hypot(
                            currentMouse.x -
                                moonPosition.x,

                            currentMouse.y -
                                moonPosition.y
                        ) <= moonRadius
                    ) {
                        hits.push(moon);
                        return hits;
                    }
                }
            }

            for (
                let s = 0;
                s < system.centerObjects.length;
                s++
            ) {
                const star =
                    system.centerObjects[s];

                const position =
                    getCentralStarScreenPosition(
                        system,
                        s
                    );

                const radius =
                    Math.max(
                        getScreenRadius(
                            star.baseRadius
                        ),
                        CONFIG.MIN_STAR_SCREEN_RADIUS
                    );

                if (
                    Math.hypot(
                        currentMouse.x -
                            position.x,

                        currentMouse.y -
                            position.y
                    ) <= radius
                ) {
                    hits.push(star);
                    return hits;
                }
            }
        }

        // Clicking anywhere near the system marker picks the sun
        const center =
            getSystemCenter(system);

        const radius =
            Math.max(
                getScreenRadius(
                    system.isWormhole
                        ? 1
                        : CONFIG.STAR_BASE_RADIUS
                ),
                CONFIG.MIN_STAR_SCREEN_RADIUS + 4
            );

        if (
            Math.hypot(
                currentMouse.x - center.x,
                currentMouse.y - center.y
            ) <= radius
        ) {
            hits.push(
                system.centerObjects[0]
            );

            return hits;
        }
    }

    return hits;
}


const currentMouse = {
    x: 0,
    y: 0
};


const doubleTapState = {
    lastTime: 0,
    lastX: 0,
    lastY: 0
};


const DOUBLE_TAP_DELAY = 300;
const DOUBLE_TAP_DISTANCE = 25;
let suppressNextClick = false;


function handleDoubleTap(event) {
    const now = performance.now();

    const rect =
        canvas.getBoundingClientRect();

    const x =
        event.clientX - rect.left;

    const y =
        event.clientY - rect.top;

    const timeDelta =
        now - doubleTapState.lastTime;

    const distance =
        Math.hypot(
            x - doubleTapState.lastX,
            y - doubleTapState.lastY
        );

    const isDoubleTap =
        timeDelta <= DOUBLE_TAP_DELAY &&
        distance <= DOUBLE_TAP_DISTANCE;

    doubleTapState.lastTime = now;
    doubleTapState.lastX = x;
    doubleTapState.lastY = y;

    if (!isDoubleTap) {
        return;
    }

    currentMouse.x = x;
    currentMouse.y = y;

    const hits =
        getHitObjects();

    if (hits.length === 0) {
        return;
    }

    const object =
        hits[0];

    if (
        state.camera.zoom <
        CONFIG.SYSTEM_DETAIL_ZOOM
    ) {
        return;
    }

    doubleTapState.lastTime = 0;

    suppressNextClick = true;

    focusObject(object);

    render();
}


function getMissionMaxWaves(type) {
    switch (type) {
        case "Key Rush":
            return 50;

        case "Chicken Invasion":
            return 40;

        case "Darkness":
            return 30;

        case "Squawk Block":
            return 20;

        case "Retro":
            return 17;

        case "Boss Rush":
        case "Double Team":
            return 10;

        default:
            return 15;
    }
}


function showMissionInfo(mission) {
    const object =
        mission.object;

    state.selectedObject =
        object;

    const environment =
        getEnvironmentEmojis(object);

    const waves =
        Number(mission.Waves) || 0;

    const diffLow =
        parseFloat(
            mission["Diff Low%"]
        ) || 0;

    const diffHigh =
        parseFloat(
            mission["Diff High%"]
        ) || 0;

    const maxWaves =
        getMissionMaxWaves(
            mission.Type
        );

    const durationWidth =
        clamp(
            waves / maxWaves * 100,
            0,
            100
        );

    const difficultyHighWidth =
        clamp(
            diffHigh,
            0,
            100
        );

    const difficultyLowWidth =
        clamp(
            diffLow,
            0,
            100
        );

    infoTitle.textContent =
        mission.Name;

    let html = `
        <div class="mission-info-type">
            ${escapeHtml(mission.Type)}
        </div>

        <div class="mission-info-property mission-info-row">
            <span class="property-name">Duration</span>
            <span>${waves}</span>
        </div>

        <div class="mission-info-bar mission-duration-bar">
            <div
                class="mission-info-bar-fill"
                style="width: ${durationWidth}%"
            ></div>
        </div>

        <div class="mission-info-property mission-info-row">
            <span class="property-name">Difficulty</span>
            <span>
                ${escapeHtml(mission["Diff Low%"])}
                -
                ${escapeHtml(mission["Diff High%"])}
            </span>
        </div>

        <div class="mission-info-bar mission-difficulty-bar">
            <div
                class="mission-info-bar-high"
                style="width: ${difficultyHighWidth}%"
            ></div>

            <div
                class="mission-info-bar-low"
                style="width: ${difficultyLowWidth}%"
            ></div>
        </div>

        <div class="mission-info-property">
            <span class="property-name">Environment</span>
            <span>${environment || "—"}</span>
        </div>
    `;

    const worldPosition =
        getObjectWorldPosition(object);

    const coordX =
        Math.round(
            clamp(
                worldPosition.x,
                0,
                CONFIG.MAP_MAX
            )
        )
        .toString()
        .padStart(3, "0");

    const coordY =
        Math.round(
            clamp(
                worldPosition.y,
                0,
                CONFIG.MAP_MAX
            )
        )
        .toString()
        .padStart(3, "0");

    html += `
        <div class="mission-info-property mission-info-row">
            <span class="property-name">Coordinates</span>
            <span>${coordX}+${coordY}</span>
        </div>
    `;

    if (mission.Notes) {
        html += `
            <div class="mission-info-property">
                <span class="property-name">Notes</span>
                <span>${escapeHtml(mission.Notes)}</span>
            </div>
        `;
    }

    infoContent.innerHTML =
        html;

    infoPanel.classList.remove(
        "hidden"
    );

    render();
}


function showObjectInfo(object) {
    state.selectedObject = object;

    infoTitle.textContent =
        object.name;

    const row = object.row;

    let html = "";const properties = [];

    html += `
        <div class="property">
            <span class="property-name"></span>
            ${escapeHtml(row.Type)}
        </div>
    `;

    if (row.Massive) {
        properties.push("☀️ Massive");
    }
    
    if (row.Hot) {
        properties.push("🔥 Hot");
    }
    
    if (row.Frozen) {
        properties.push("❄️ Frozen");
    }
    
    if (row.Electric) {
        properties.push("⚡ Electric");
    }
    
    if (row.Singularity) {
        properties.push("⚫ Singularity");
    }
    
    if (properties.length > 0) {
        html += `
            <div class="environmental-properties">
                ${properties.join(" ")}
            </div>
        `;
    }
    else {
        html += `
            <div class="environmental-properties">&nbsp;
            </div>
        `;
    }

    let worldPosition;

    if (object.role === "droid") {
        worldPosition =
            getDroidWorldPosition(object);
    }
    else if (object.role === "moon") {
        worldPosition =
            getMoonWorldPosition(object);
    }
    else if (object.role === "planet") {
        worldPosition =
            getPlanetWorldPosition(object);
    }
    else {
        worldPosition = {
            x: row.X,
            y: row.Y
        };
    }

    const coordX =
        Math.round(
            clamp(
                worldPosition.x,
                0,
                CONFIG.MAP_MAX
            )
        )
        .toString()
        .padStart(3, "0");

    const coordY =
        Math.round(
            clamp(
                worldPosition.y,
                0,
                CONFIG.MAP_MAX
            )
        )
        .toString()
        .padStart(3, "0");

    html += `
        <div class="property coordinates">
            <span class="property-name">Coordinates</span>
            <span>${coordX}+${coordY}</span>
        </div>
    `;

    if (
        row.Notes &&
        row.Notes.trim().toLowerCase() !== "moon" &&
        !row.Notes.trim().toLowerCase().startsWith("droid")
    ) {
        html += `
            <div class="property">
                <span class="property-name">Notes:</span>
                ${escapeHtml(row.Notes)}
            </div>
        `;
    }

    infoContent.innerHTML = html;

    infoPanel.classList.remove("hidden");

    render();
}


function closeInfo() {
    state.selectedObject = null;

    infoPanel.classList.add("hidden");
}


function activateRangeHandle(
    slider
) {
    const parent =
        slider.closest(".dual-range");

    if (!parent) {
        return;
    }

    parent
        .querySelectorAll(
            'input[type="range"]'
        )
        .forEach(
            input => {
                input.classList.remove(
                    "active"
                );
            }
        );

    slider.classList.add("active");
}


document
    .querySelectorAll(
        ".dual-range input[type='range']"
    )
    .forEach(
        slider => {
            slider.addEventListener(
                "pointerdown",
                () => {
                    activateRangeHandle(
                        slider
                    );
                }
            );

            slider.addEventListener(
                "focus",
                () => {
                    activateRangeHandle(
                        slider
                    );
                }
            );
        }
    );


const VALID_MISSION_WAVES = [
    3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    24, 27, 28, 30, 32, 36, 40, 50
];
    
function snapMissionWaves(value) {
    return VALID_MISSION_WAVES.reduce(
        (closest, candidate) =>
            Math.abs(candidate - value) <
            Math.abs(closest - value) ? candidate : closest, VALID_MISSION_WAVES[0]
    );
}
    
function updateMissionWaveFilters() {
    let min =
        snapMissionWaves(
            Number(missionWavesMinSlider.value)
        );
    
    let max =
        snapMissionWaves(
            Number(missionWavesMaxSlider.value)
        );
    
    if (min > max) {
        if (
            document.activeElement ===
            missionWavesMinSlider
        ) {
            min = max;
        }
        else {
            max = min;
        }
    }
    
    missionWavesMinSlider.value = min;
    missionWavesMaxSlider.value = max;
    state.missionFilters.minWaves = min;
    state.missionFilters.maxWaves = max;
    missionWavesMinValue.textContent = min;
    missionWavesMaxValue.textContent = max;
    
    updateMissionSearchResults();
    updateSearchMatches();
    updateStatus();
    
    if (
        state.searchListMode &&
        state.searchListContent === "missions"
    ) {
        searchResultsList.scrollTop = 0;
        updateSearchResultsList();
    }
    
    render();
}


function updateMissionDifficultyFilters() {
    let lowMin =
        Number(missionDiffLowMinSlider.value);

    let lowMax =
        Number(missionDiffLowMaxSlider.value);

    let highMin =
        Number(missionDiffHighMinSlider.value);

    let highMax =
        Number(missionDiffHighMaxSlider.value);

    if (lowMin > lowMax) {
        if (
            document.activeElement ===
            missionDiffLowMinSlider
        ) {
            lowMin = lowMax;
            missionDiffLowMinSlider.value =
                lowMin;
        }
        else {
            lowMax = lowMin;
            missionDiffLowMaxSlider.value =
                lowMax;
        }
    }

    if (highMin > highMax) {
        if (
            document.activeElement ===
            missionDiffHighMinSlider
        ) {
            highMin = highMax;
            missionDiffHighMinSlider.value =
                highMin;
        }
        else {
            highMax = highMin;
            missionDiffHighMaxSlider.value =
                highMax;
        }
    }

    state.missionFilters.minDifficultyLow =
        lowMin;

    state.missionFilters.maxDifficultyLow =
        lowMax;

    state.missionFilters.minDifficultyHigh =
        highMin;

    state.missionFilters.maxDifficultyHigh =
        highMax;

    missionDiffLowMinValue.textContent =
        `${lowMin}%`;

    missionDiffLowMaxValue.textContent =
        `${lowMax}%`;

    missionDiffHighMinValue.textContent =
        `${highMin}%`;

    missionDiffHighMaxValue.textContent =
        `${highMax}%`;

    updateMissionSearchResults();
    updateSearchMatches();
    updateStatus();

    if (
        state.searchListMode &&
        state.searchListContent === "missions"
    ) {
        searchResultsList.scrollTop = 0;
        updateSearchResultsList();
    }

    render();
}


canvas.addEventListener(
    "pointerdown",
    event => {
        canvas.setPointerCapture(
            event.pointerId
        );

        pointerState.active.set(
            event.pointerId,
            {
                clientX: event.clientX,
                clientY: event.clientY
            }
        );

        pointerState.moved = false;

        if (
            pointerState.active.size === 1
        ) {
            pointerState.dragging = false;

            pointerState.startX =
                event.clientX;

            pointerState.startY =
                event.clientY;

            pointerState.lastX =
                event.clientX;

            pointerState.lastY =
                event.clientY;

            canvas.classList.remove(
                "dragging"
            );
        }

        else if (
            pointerState.active.size === 2
        ) {
            const points =
                [...pointerState.active.values()];

            pointerState.pinchDistance =
                getPointerDistance(
                    points[0],
                    points[1]
                );

            const center =
                getPointerCenter(
                    points[0],
                    points[1]
                );

            pointerState.pinchCenterX =
                center.x;

            pointerState.pinchCenterY =
                center.y;
        }
    }
);


canvas.addEventListener(
    "pointerup",
    event => {
        pointerState.active.delete(
            event.pointerId
        );

        if (pointerState.active.size === 0) {
            canvas.classList.remove("dragging");
        
            updateProximitySort();
        
            if (!pointerState.moved) {
                handleDoubleTap(event);
            }
        }

        else if (
            pointerState.active.size === 1
        ) {
            const remaining =
                [...pointerState.active.values()][0];

            pointerState.lastX =
                remaining.clientX;

            pointerState.lastY =
                remaining.clientY;

            pointerState.pinchDistance = 0;
        }
    }
);


canvas.addEventListener(
    "pointercancel",
    event => {
        pointerState.active.delete(
            event.pointerId
        );

        if (
            pointerState.active.size === 0
        ) {
            pointerState.dragging = false;

            canvas.classList.remove(
                "dragging"
            );
        }
    }
);


canvas.addEventListener(
    "pointerleave",
    () => {
        // Pointer capture keeps the gesture alive
    }
);


canvas.addEventListener(
    "pointermove",
    event => {
        const pointer =
            pointerState.active.get(
                event.pointerId
            );

        if (!pointer) {
            return;
        }

        pointer.clientX =
            event.clientX;

        pointer.clientY =
            event.clientY;

        if (
            pointerState.active.size === 1
        ) {
            const dx =
                event.clientX -
                pointerState.lastX;

            const dy =
                event.clientY -
                pointerState.lastY;

            if (
                Math.hypot(
                    event.clientX -
                        pointerState.startX,

                    event.clientY -
                        pointerState.startY
                ) > 6
            ) {
                pointerState.moved = true;
                pointerState.dragging = true;

                canvas.classList.add(
                    "dragging"
                );
            }

            if (pointerState.dragging) {
                state.camera.offsetX += dx;
                state.camera.offsetY += dy;
            
                const mapSize =
                    CONFIG.MAP_MAX *
                    state.camera.zoom;
            
                if (mapSize <= state.canvasWidth) {
                    state.camera.offsetX =
                        (state.canvasWidth - mapSize) / 2;
                }
                else {
                    state.camera.offsetX =
                        Math.min(
                            0,
                            Math.max(
                                state.canvasWidth - mapSize,
                                state.camera.offsetX
                            )
                        );
                }
            
                if (mapSize <= state.canvasHeight) {
                    state.camera.offsetY =
                        (state.canvasHeight - mapSize) / 2;
                }
                else {
                    state.camera.offsetY =
                        Math.min(
                            0,
                            Math.max(
                                state.canvasHeight - mapSize,
                                state.camera.offsetY
                            )
                        );
                }
            }

            pointerState.lastX =
                event.clientX;

            pointerState.lastY =
                event.clientY;

            return;
        }

        if (
            pointerState.active.size === 2
        ) {
            const points =
                [...pointerState.active.values()];

            const newDistance =
                getPointerDistance(
                    points[0],
                    points[1]
                );

            if (
                pointerState.pinchDistance <= 0
            ) {
                pointerState.pinchDistance =
                    newDistance;

                return;
            }

            const factor =
                newDistance /
                pointerState.pinchDistance;

            if (
                Math.abs(factor - 1) > 0.001
            ) {
                zoomAt(
                    pointerState.pinchCenterX,
                    pointerState.pinchCenterY,
                    factor
                );

                pointerState.pinchDistance =
                    newDistance;
            }

            const center =
                getPointerCenter(
                    points[0],
                    points[1]
                );

            const dx =
                center.x -
                pointerState.pinchCenterX;

            const dy =
                center.y -
                pointerState.pinchCenterY;

            state.camera.offsetX += dx;
            state.camera.offsetY += dy;

            const mapSize =
                CONFIG.MAP_MAX *
                state.camera.zoom;

            if (mapSize <= state.canvasWidth) {
                state.camera.offsetX =
                    (state.canvasWidth - mapSize) / 2;
            }
            else {
                state.camera.offsetX =
                    Math.min(
                        0,
                        Math.max(
                            state.canvasWidth - mapSize,
                            state.camera.offsetX
                        )
                    );
            }

            if (mapSize <= state.canvasHeight) {
                state.camera.offsetY =
                    (state.canvasHeight - mapSize) / 2;
            }
            else {
                state.camera.offsetY =
                    Math.min(
                        0,
                        Math.max(
                            state.canvasHeight - mapSize,
                            state.camera.offsetY
                        )
                    );
            }

            pointerState.pinchCenterX =
                center.x;

            pointerState.pinchCenterY =
                center.y;

            pointerState.moved = true;
        }
    }
);


canvas.addEventListener(
    "click",
    event => {
        if (suppressNextClick) {
            suppressNextClick = false;
            return;
        }

        if (pointerState.moved) {
            pointerState.moved = false;
            return;
        }

        const rect =
            canvas.getBoundingClientRect();

        currentMouse.x =
            event.clientX - rect.left;

        currentMouse.y =
            event.clientY - rect.top;

        const hits =
            getHitObjects();

        if (hits.length > 0) {
            showObjectInfo(hits[0]);
        }
        else {
            closeInfo();
        }

        state.camera.focusObject = null;
        
        exitFocusedMissionMode();
        focusedMissionControls.classList.add(
            "hidden"
        );
        
        zoomControls.classList.remove(
            "hidden"
        );
    }
);


canvas.addEventListener(
    "wheel",
    event => {
        event.preventDefault();

        const rect =
            canvas.getBoundingClientRect();

        const x =
            event.clientX - rect.left;

        const y =
            event.clientY - rect.top;

        const factor =
            event.deltaY < 0
                ? CONFIG.ZOOM_FACTOR
                : 1 / CONFIG.ZOOM_FACTOR;

        state.camera.focusObject = null;

        exitFocusedMissionMode();

        focusedMissionControls.classList.add(
            "hidden"
        );

        zoomControls.classList.remove(
            "hidden"
        );

        zoomAt(x, y, factor);
    },
    { passive: false }
);


const environmentSearchButtons =
    document.querySelectorAll(
        ".environment-search-button"
    );

for (const button of environmentSearchButtons) {
    button.addEventListener("click", () => {
        cycleEnvironmentSearch(
            button.dataset.environment
        );

        updateMissionSearchResults();
        updateSearchMatches();
        updateStatus();
        updateSearchResultsList();
        render();
    });
}


document
    .getElementById("zoomIn")
    .addEventListener(
        "click",
        () => {
            state.camera.focusObject = null;
            
            exitFocusedMissionMode();

            focusedMissionControls.classList.add(
                "hidden"
            );

            zoomAt(
                state.canvasWidth / 2,
                state.canvasHeight / 2,
                CONFIG.ZOOM_FACTOR
            );
        }
    );


document
    .getElementById("zoomOut")
    .addEventListener(
        "click",
        () => {
            state.camera.focusObject = null;
            
            exitFocusedMissionMode();

            focusedMissionControls.classList.add(
                "hidden"
            );
            
            zoomAt(
                state.canvasWidth / 2,
                state.canvasHeight / 2,
                1 / CONFIG.ZOOM_FACTOR
            );
        }
    );


document
    .querySelectorAll(".searchType")
    .forEach(
        checkbox => {
            checkbox.addEventListener(
                "change",
                () => {
                    state.searchTypes.clear();

                    document
                        .querySelectorAll(
                            ".searchType:checked"
                        )
                        .forEach(
                            selected => {
                                state.searchTypes.add(
                                    selected.value
                                );
                            }
                        );

                    updateMissionSearchResults();
                    updateSearchMatches();
                    updateStatus();
                    updateSearchResultsList();

                    render();
                }
            );
        }
    );
    
document
    .querySelectorAll(".missionType")
    .forEach(
        checkbox => {
            checkbox.addEventListener(
                "change",
                () => {
                    state.missionFilters.types.clear();

                    document
                        .querySelectorAll(
                            ".missionType:checked"
                        )
                        .forEach(
                            selected => {
                                state.missionFilters.types.add(
                                    selected.value
                                );
                            }
                        );

                    updateMissionSearchResults();
                    updateSearchMatches();
                    updateStatus();

                    if (
                        state.searchListMode &&
                        state.searchListContent ===
                            "missions"
                    ) {
                        searchResultsList.scrollTop = 0;
                        updateSearchResultsList();
                    }

                    render();
                }
            );
        }
    );

focusedMissionButton.addEventListener(
    "click",
    () => {
        const object =
            state.camera.focusObject;
    
        if (!canShowFocusedMissions(object)) {
            return;
        }
    
        state.focusedMissionListMode = true;
        state.searchListMode = true;
        state.searchListContent = "missions";
    
        state.searchSortMode = "internal";
    
        sortSearchLabel.textContent =
            "Default";
    
        focusedMissionControls.classList.add("hidden");
        zoomControls.classList.add("hidden");
        optionsPanel.classList.add("hidden");
        searchResultsPanel.classList.remove("hidden");
        backButton.classList.remove("hidden");
        searchListButton.classList.add("hidden");
        sortSearchButton.classList.remove("hidden");
        searchListControls.classList.remove("hidden");
        menuButton.classList.add("hidden");
    
        searchResultsList.scrollTop = 0;
    
        updateSearchResultsList();
    }
);

showWormholesCheckbox.addEventListener(
    "change",
    render
);


showConnectionsCheckbox.addEventListener(
    "change",
    render
);


showOrbitsCheckbox.addEventListener(
    "change",
    render
);


animateOrbitsCheckbox.addEventListener(
    "change",
    render
);


window.addEventListener(
    "keydown",
    event => {
        switch (event.key) {
            case "+":
            case "=":
                state.camera.focusObject = null;
                
                exitFocusedMissionMode();

                focusedMissionControls.classList.add(
                    "hidden"
                );
                
                zoomControls.classList.remove(
                    "hidden"
                );
                zoomAt(
                    state.canvasWidth / 2,
                    state.canvasHeight / 2,
                    CONFIG.ZOOM_FACTOR
                );
                break;

            case "-":
            case "_":
                state.camera.focusObject = null;
                
                exitFocusedMissionMode();

                focusedMissionControls.classList.add(
                    "hidden"
                );
                
                zoomControls.classList.remove(
                    "hidden"
                );
                zoomAt(
                    state.canvasWidth / 2,
                    state.canvasHeight / 2,
                    1 / CONFIG.ZOOM_FACTOR
                );
                break;

            case "Escape":
                exitFocusedMissionMode();
                closeInfo();
                break;
        }
    }
);


function animationFrame(timestamp) {
    const deltaTime =
        Math.min(
            (timestamp -
                state.lastFrameTime) /
                1000,
            0.1
        );

    state.lastFrameTime =
        timestamp;

    updateOrbitAnimation(
        deltaTime
    );

    updateClark(timestamp);

    render();

    requestAnimationFrame(
        animationFrame
    );
}


window.addEventListener(
    "resize",
    () => {
        resizeCanvas();
        render();
    }
);


const clarkState = {
    x: Math.random() * CONFIG.MAP_MAX * 67,
    y: Math.random() * CONFIG.MAP_MAX * 67,

    image: new Image(),
    audio: new Audio("data/clark.ogg")
};


clarkState.image.src =
    "data/clark.gif";


clarkState.audio.preload = "auto";


const updateClark = (() => {
    let nextTeleportTime = 0;

    return function(timestamp) {
        if (
            timestamp >=
            nextTeleportTime
        ) {
            clarkState.x =
                Math.random() *
                CONFIG.MAP_MAX *
                67;

            clarkState.y =
                Math.random() *
                CONFIG.MAP_MAX *
                67;

            nextTeleportTime =
                timestamp + 3000;

            if (
                state.camera.zoom >=
                CONFIG.OBJECT_LABEL_ZOOM
            ) {
                const screen =
                    worldToScreen(
                        clarkState.x / 67,
                        clarkState.y / 67
                    );

                const visible =
                    screen.x >= 0 &&
                    screen.x <=
                        state.canvasWidth &&
                    screen.y >= 0 &&
                    screen.y <=
                        state.canvasHeight;

                if (visible) {
                    try {
                        clarkState.audio.currentTime = 0;
                        clarkState.audio.play();
                    }
                    catch (error) {
                    }
                }
            }
        }
    };
})();


const clarkG =
    document.getElementById(
        "clarkG"
    );


function drawClark() {
    if (
        state.camera.zoom <
        CONFIG.OBJECT_LABEL_ZOOM
    ) {
        clarkG.style.display =
            "none";
    
        return;
    }
    
    if (
        !clarkG.naturalWidth ||
        !clarkG.naturalHeight
    ) {
        clarkG.style.display =
            "none";
    
        return;
    }
    
    const screen =
        worldToScreen(
            clarkState.x / 67,
            clarkState.y / 67
        );
    
    const height =
        clarkG.naturalHeight *
        state.camera.zoom /
        512;
    
    const width =
        clarkG.naturalWidth *
        state.camera.zoom /
        512;
    
    const visible =
        screen.x + width / 2 >= 0 &&
        screen.x - width / 2 <= state.canvasWidth &&
        screen.y + height / 2 >= 0 &&
        screen.y - height / 2 <= state.canvasHeight;
    
    if (!visible) {
        clarkG.style.display =
            "none";
    
        return;
    }
    
    clarkG.style.display =
        "block";
    
    clarkG.style.width =
        `${width}px`;
    
    clarkG.style.height =
        `${height}px`;
    
    clarkG.style.left =
        `${screen.x - width / 2}px`;
    
    clarkG.style.top =
        `${screen.y - height / 2}px`;
}


const welcomeScreen =
    document.getElementById(
        "welcomeScreen"
    );

const welcomePrompt =
    document.getElementById(
        "welcomePrompt"
    );

function closeWelcomeScreen() {
    if (
        !dataLoadComplete ||
        !welcomeScreen ||
        welcomeScreen.classList.contains(
            "hidden"
        )
    ) {
        return;
    }

    welcomeScreen.classList.add(
        "hidden"
    );
}

function updateWelcomePrompt() {
    const prompt =
        welcomeScreen.querySelector(
            ".welcome-prompt"
        );

    if (!prompt) {
        return;
    }

    prompt.textContent =
        dataLoadComplete
            ? "Loading data..."
            : "Click or tap anywhere to begin";
}

welcomeScreen.addEventListener(
    "pointerdown",
    closeWelcomeScreen
);

resizeCanvas();

showWormholesCheckbox.checked =
    CONFIG.SHOW_WORMHOLES_BY_DEFAULT;

loadData();

requestAnimationFrame(
    animationFrame
);