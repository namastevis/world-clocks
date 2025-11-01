// Time zone city options with labels
const CITY_OPTIONS = [
  { value: "Asia/Kolkata", text: "Kolkata (India), IST" },
  { value: "America/Los_Angeles", text: "Los Angeles (USA), PST" },
  { value: "America/New_York", text: "New York (USA), EST" },
  { value: "America/Chicago", text: "Chicago (USA), CST" },
  { value: "Europe/London", text: "London (UK), GMT" },
  { value: "Europe/Paris", text: "Paris (France), CET" },
  { value: "Europe/Berlin", text: "Berlin (Germany), CET" },
  { value: "Europe/Rome", text: "Rome (Italy), CET" },
  { value: "Europe/Madrid", text: "Madrid (Spain), CET" },
  { value: "Europe/Moscow", text: "Moscow (Russia), MSK" },
  { value: "Africa/Cairo", text: "Cairo (Egypt), EET" },
  { value: "Africa/Johannesburg", text: "Johannesburg (South Africa), SAST" },
  { value: "Africa/Lagos", text: "Lagos (Nigeria), WAT" },
  { value: "Asia/Dubai", text: "Dubai (UAE), GST" },
  { value: "Asia/Singapore", text: "Singapore, SGT" },
  { value: "Asia/Tokyo", text: "Tokyo (Japan), JST" },
  { value: "Asia/Seoul", text: "Seoul (South Korea), KST" },
  { value: "Australia/Sydney", text: "Sydney (Australia), AEST" },
  { value: "Pacific/Auckland", text: "Wellington (New Zealand), NZST" },
  { value: "America/Sao_Paulo", text: "São Paulo (Brazil), BRT" },
  { value: "America/Argentina/Buenos_Aires", text: "Buenos Aires (Argentina), ART" },
  { value: "America/Mexico_City", text: "Mexico City (Mexico), CST" },
  { value: "America/Toronto", text: "Toronto (Canada), EST" },
  { value: "America/Denver", text: "Denver (USA), MST" },
  { value: "Asia/Karachi", text: "Karachi (Pakistan), PKT" },
  { value: "Asia/Jakarta", text: "Jakarta (Indonesia), WIB" },
  { value: "Asia/Shanghai", text: "Shanghai (China), CST" },
  { value: "Asia/Bangkok", text: "Bangkok (Thailand), ICT" },
  { value: "Europe/Istanbul", text: "Istanbul (Turkey), TRT" },
  { value: "Asia/Riyadh", text: "Riyadh (Saudi Arabia), AST" },
  { value: "America/Santiago", text: "Santiago (Chile), CLT" },
  { value: "America/Bogota", text: "Bogota (Colombia), COT" },
  { value: "America/Jamaica", text: "Kingston (Jamaica), EST" },
  { value: "America/Caracas", text: "Caracas (Venezuela), VET" },
  { value: "Asia/Manila", text: "Manila (Philippines), PHT" }
];

// Stores the active clocks to update their hands efficiently
const clockHandsMap = new Map();

// IST reference date if user sets it manually, otherwise null
let userISTDate = null;

// Cached DOM elements
const istTimeInput = document.getElementById("istTimeInput");
const resetTimeBtn = document.getElementById("resetTimeBtn");
const clocksRow = document.getElementById("clocksRow");
const pageFooter = document.getElementById("pageFooter");
const backToTopBtn = document.getElementById("backToTopBtn");

/**
 * Extract numeric parts of time from a Date object formatted to given timeZone
 * @param {string} timeZone IANA time zone string
 * @param {Date} referenceDate Date to extract time from
 * @returns {{hour: number, minute: number, second: number}}
 */
function getTimeParts(timeZone, referenceDate) {
  const options = {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
    timeZone,
  };

  return new Intl.DateTimeFormat("en-US", options)
    .formatToParts(referenceDate)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = Number(part.value);
      }
      return acc;
    }, {});
}

/**
 * Creates a Date for IST using provided hours and minutes on today's date
 * @param {number} hours
 * @param {number} minutes
 * @returns {Date} IST Date object
 */
function getISTReferenceTime(hours, minutes) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

  // Create a date localized to IST timezone
  return new Date(
    new Date(dateStr + "+05:30").toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/**
 * Adds 12 tick marks around the clock face, spaced evenly
 * @param {HTMLElement} face Element representing clock face
 * @param {number} radius Distance of tick marks from center
 */
function addTickMarks(face, radius = 80) {
  for (let i = 0; i < 12; i++) {
    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.transform = `rotate(${i * 30}deg) translate(${radius}px, -50%)`;
    face.appendChild(tick);
  }
}

/**
 * Creates and appends clock hands: hour, minute, second, and the center dot
 * @param {HTMLElement} face Element to add hands to
 * @returns {{hourHand: HTMLElement, minHand: HTMLElement, secHand: HTMLElement}}
 */
function createClockHands(face) {
  const hourHand = document.createElement("div");
  hourHand.className = "hand hour-hand";
  const minHand = document.createElement("div");
  minHand.className = "hand min-hand";
  const secHand = document.createElement("div");
  secHand.className = "hand second-hand";

  face.append(hourHand, minHand, secHand);

  const centerDot = document.createElement("div");
  centerDot.className = "center-dot";
  face.appendChild(centerDot);

  return { hourHand, minHand, secHand };
}

/**
 * Calculates rotation angle for hour hand
 * @param {number} hour 12-hour format
 * @param {number} minute
 * @returns {number} degrees rotation
 */
function getHourAngle(hour, minute) {
  return ((hour % 12) + minute / 60) * 30 - 90;
}

/**
 * Calculates rotation angle for minute hand
 * @param {number} minute
 * @param {number} second
 * @returns {number} degrees rotation
 */
function getMinuteAngle(minute, second) {
  return minute * 6 + second * 0.1 - 90;
}

/**
 * Calculates rotation angle for second hand
 * @param {number} second
 * @returns {number} degrees rotation
 */
function getSecondAngle(second) {
  return second * 6 - 90;
}

/**
 * Updates the rotation of clock hands for a given clock id based on time parts
 * @param {string} clockId
 * @param {{hour: number, minute: number, second: number}} time
 */
function updateClockHands(clockId, time) {
  const hands = clockHandsMap.get(clockId);
  if (!hands) return;

  hands.hourHand.style.transform = `rotate(${getHourAngle(time.hour, time.minute)}deg)`;
  hands.minHand.style.transform = `rotate(${getMinuteAngle(time.minute, time.second)}deg)`;
  hands.secHand.style.transform = `rotate(${getSecondAngle(time.second)}deg)`;
}

/**
 * Refreshes all clocks on the page with current time or reference time for IST input
 * @param {Date|null} referenceDate
 * @param {boolean} isISTInput
 */
function refreshAllClocks(referenceDate = null, isISTInput = false) {
  CITY_OPTIONS.forEach((city, index) => {
    const clockId = `clock${index}`;
    let time;
    if (isISTInput && referenceDate) {
      time = getTimeParts(city.value, referenceDate);
    } else {
      time = getTimeParts(city.value, new Date());
    }
    updateClockHands(clockId, time);
  });
}

/**
 * Renders all the clocks on the page in the clocks container
 */
function renderClocks() {
  clocksRow.innerHTML = "";
  CITY_OPTIONS.forEach((city, index) => {
    const container = document.createElement("div");
    container.className = "clock-container";

    const clock = document.createElement("div");
    clock.className = "clock";

    const face = document.createElement("div");
    face.className = "clock-face";

    clock.appendChild(face);
    container.appendChild(clock);

    addTickMarks(face);
    const hands = createClockHands(face);
    clockHandsMap.set(`clock${index}`, hands);

    const label = document.createElement("div");
    label.className = "clock-label";
    label.title = city.text;
    label.textContent = city.text;
    container.appendChild(label);

    clocksRow.appendChild(container);
  });
}

/**
 * Controls footer visibility based on scroll position
 */
function handleFooterVisibility() {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowHeight = window.innerHeight;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );

  if (scrollY + windowHeight >= documentHeight - 2) {
    pageFooter.classList.add("visible");
  } else {
    pageFooter.classList.remove("visible");
  }
}

// Initialization and Event Listeners

renderClocks();
refreshAllClocks();

// Update clocks every 1.1 seconds with live time if user not input IST
setInterval(() => {
  if (!userISTDate) refreshAllClocks();
}, 1100);

// Enable reset button if IST time input has value
istTimeInput.addEventListener("input", function () {
  if (this.value) {
    resetTimeBtn.disabled = false;
    resetTimeBtn.classList.add("active");
  } else {
    resetTimeBtn.disabled = true;
    resetTimeBtn.classList.remove("active");
  }
});

// Update clocks when user changes IST time input
istTimeInput.addEventListener("change", () => {
  if (!istTimeInput.value) {
    userISTDate = null;
    refreshAllClocks();
    return;
  }
  const [hours, minutes] = istTimeInput.value.split(":").map(Number);
  userISTDate = getISTReferenceTime(hours, minutes);
  refreshAllClocks(userISTDate, true);
});

// Reset to current time and disable reset button
resetTimeBtn.addEventListener("click", () => {
  istTimeInput.value = "";
  userISTDate = null;
  refreshAllClocks();
  resetTimeBtn.disabled = true;
  resetTimeBtn.classList.remove("active");
});

// Footer visibility toggling on scroll and resize
window.addEventListener("scroll", handleFooterVisibility);
window.addEventListener("resize", handleFooterVisibility);
document.addEventListener("DOMContentLoaded", handleFooterVisibility);

// Back to top button smooth scroll
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
