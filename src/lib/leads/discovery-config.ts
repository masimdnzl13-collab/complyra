/**
 * Fixed candidate lists for the auto-discovery cron's city/sector
 * diversification — a round-robin over export-heavy Turkish cities and
 * sectors, not a random or unbounded choice.
 */
export const DISCOVERY_CITIES = ["Kayseri", "Gaziantep", "Bursa", "Denizli", "İzmir", "Konya"];

export const DISCOVERY_SECTORS = ["tekstil", "mobilya", "gıda", "otomotiv yan sanayi", "kimya"];

/** Max new candidates written per cron run — controlled growth, not a burst. */
export const MAX_CANDIDATES_PER_RUN = 15;
