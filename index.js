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

// Store references to clock hand elements
const clockHandsMap = new Map();

let userISTDate = null;

const istTimeInput = document.getElementById("istTimeInput");
const resetTimeBtn = document.getElementById("resetTimeBtn");
const clocksRow = document.getElementById("clocksRow");
const pageFooter = document.getElementById("pageFooter");
const backToTopBtn = document.getElementById("backToTopBtn");

/**
 * Get time parts (hour, minute, second) for a given timezone and date
 */
function getTimeParts(timeZone, referenceDate) {
  const options = { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true, timeZone };
  return new Intl.DateTimeFormat('en-US', options)
            .formatToParts(referenceDate)
            .reduce((acc, part) => {
              if (part.type !== 'literal') acc[part.type] = Number(part.value);
              return acc;
            }, {});
}

/**
 * Get Date object set to specific IST time today
 */
function getISTReferenceTime(hours, minutes) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  return new Date(new Date(dateStr + '+05:30').toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Add tick marks to clock face
 */
function addTickMarks(face, radius = 80) {
  for (let i = 0; i < 12; i++) {
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.style.transform = `rotate(${i * 30}deg) translate(${radius}px, -50%)`;
    face.appendChild(tick);
  }
}

/**
 * Create clock hands and add to face
 */
function createClockHands(face) {
  const hourHand = document.createElement('div');
  hourHand.className = 'hand hour-hand';
  const minHand = document.createElement('div');
  minHand.className = 'hand min-hand';
  const secHand = document.createElement('div');
  secHand.className = 'hand second-hand';
  face.append(hourHand, minHand, secHand);

  const centerDot = document.createElement('div');
  centerDot.className = 'center-dot';
  face.appendChild(centerDot);

  return { hourHand, minHand, secHand };
}

// Angle calculations for hands
const getHourAngle = (hour, minute) => ((hour % 12) + minute / 60) * 30 - 90;
const getMinuteAngle = (minute, second) => minute * 6 + second * 0.1 - 90;
const getSecondAngle = second => second * 6 - 90;

/**
 * Update rotation of clock hands for a given clock id
 */
function updateClockHands(clockId, time) {
  const hands = clockHandsMap.get(clockId);
  if (!hands) return;
  hands.hourHand.style.transform = `rotate(${getHourAngle(time.hour, time.minute)}deg)`;
  hands.minHand.style.transform = `rotate(${getMinuteAngle(time.minute, time.second)}deg)`;
  hands.secHand.style.transform = `rotate(${getSecondAngle(time.second)}deg)`;
}

/**
 * Refresh all clocks with current or user-supplied time
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
 * Render all clocks into container
 */
function renderClocks() {
  clocksRow.innerHTML = '';
  CITY_OPTIONS.forEach((city, index) => {
    const container = document.createElement('div');
    container.className = 'clock-container';

    const clock = document.createElement('div');
    clock.className = 'clock';

    const face = document.createElement('div');
    face.className = 'clock-face';

    clock.appendChild(face);
    container.appendChild(clock);

    addTickMarks(face);
    const hands = createClockHands(face);
    clockHandsMap.set(`clock${index}`, hands);

    const label = document.createElement('div');
    label.className = 'clock-label';
    label.title = city.text;
    label.textContent = city.text;
    container.appendChild(label);

    clocksRow.appendChild(container);
  });
}


/**
 * Show/hide footer based on scroll at bottom
 */
function handleFooterVisibility() {
  const scrollY = window.scrollY || window.pageYOffset;
  const windowHeight = window.innerHeight;
  const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  if (scrollY + windowHeight >= documentHeight - 2) {
    pageFooter.classList.add('visible');
  } else {
    pageFooter.classList.remove('visible');
  }
}


/** INITIALIZATION **/

renderClocks();
refreshAllClocks();

setInterval(() => {
  if (!userISTDate) refreshAllClocks();
}, 1100);

// Event to enable/disable reset button based on IST time input
istTimeInput.addEventListener('input', function () {
  if (this.value) {
    resetTimeBtn.disabled = false;
    resetTimeBtn.classList.add('active');
  } else {
    resetTimeBtn.disabled = true;
    resetTimeBtn.classList.remove('active');
  }
});

// Update clocks on IST input change
istTimeInput.addEventListener('change', () => {
  if (!istTimeInput.value) {
    userISTDate = null;
    refreshAllClocks();
    return;
  }
  const [hours, minutes] = istTimeInput.value.split(':').map(Number);
  userISTDate = getISTReferenceTime(hours, minutes);
  refreshAllClocks(userISTDate, true);
});

// Reset to live time and disable button
resetTimeBtn.addEventListener('click', () => {
  istTimeInput.value = '';
  userISTDate = null;
  refreshAllClocks();
  resetTimeBtn.disabled = true;
  resetTimeBtn.classList.remove('active');
});

// Footer visibility listeners
window.addEventListener('scroll', handleFooterVisibility);
window.addEventListener('resize', handleFooterVisibility);
document.addEventListener('DOMContentLoaded', handleFooterVisibility);

// Back-to-top smooth scroll
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
