(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const preloader = $('#preloader');
  const preloaderFill = $('#preloaderFill');
  window.addEventListener('load', () => {
    requestAnimationFrame(() => { preloaderFill.style.width = '100%'; });
    setTimeout(() => {
      preloader.classList.add('done');
      document.body.style.overflow = '';
      initRevealObserver();
    }, 2400);
  });
  document.body.style.overflow = 'hidden';
  setTimeout(() => { document.body.style.overflow = ''; }, 3200);

  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');
  if (!('ontouchstart' in window)) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top = my + 'px';
      const spot = $('#mouseSpotlight');
      if (spot) {
        spot.style.setProperty('--mx', mx + 'px');
        spot.style.setProperty('--my', my + 'px');
      }
    });
    const animateRing = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(animateRing);
    };
    animateRing();
    $$('a, button, .project-card, input, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
    });
  }

  const scrollProgress = $('#scrollProgress');
  const siteNav = $('#siteNav');
  const backToTop = $('#backToTop');
  const backRing = $('#backToTopRing');
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (scrolled / max) * 100 : 0;
    scrollProgress.style.width = pct + '%';
    siteNav.classList.toggle('scrolled', scrolled > 40);
    backToTop.classList.toggle('show', scrolled > 500);
    if (backRing) backRing.style.strokeDashoffset = 100 - pct;
  };
  document.addEventListener('scroll', throttle(onScroll, 16), { passive: true });
  onScroll();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));

  function throttle(fn, wait) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn(...args); }
    };
  }

  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  navToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
  });
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    navToggle.classList.remove('open');
  }));

  const themeToggle = $('#themeToggle');
  const iconSun = $('#iconSun'), iconMoon = $('#iconMoon');
  const applyTheme = (light) => {
    document.documentElement.classList.toggle('light-theme', light);
    iconSun.style.display = light ? 'block' : 'none';
    iconMoon.style.display = light ? 'none' : 'block';
  };
  const savedTheme = localStorage.getItem('bsit1-theme');
  applyTheme(savedTheme === 'light');
  themeToggle.addEventListener('click', () => {
    const isLight = !document.documentElement.classList.contains('light-theme');
    applyTheme(isLight);
    localStorage.setItem('bsit1-theme', isLight ? 'light' : 'dark');
  });

  const canvas = $('#particleCanvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [], w, h;
    const mouse = { x: null, y: null };
    const palette = [
      [0, 212, 255], [123, 47, 190], [255, 0, 110], [59, 130, 246]
    ];
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }
    function initParticles() {
      const density = Math.floor((w * h) / 9000);
      const count = Math.min(220, density);
      const total = isMobile ? Math.round(count * 0.5) : count;
      particles = Array.from({ length: total }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 4 + 2,
        hue: Math.floor(Math.random() * palette.length),
        huePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.4 + Math.random() * 0.6,
      }));
    }
    let t = 0;
    function draw() {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      if (mouse.x !== null) {
        particles.forEach(p => {
          const dx = mouse.x - p.x, dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130 && dist > 0) {
            const force = (130 - dist) / 130;
            p.x -= (dx / dist) * force * 1.1;
            p.y -= (dy / dist) * force * 1.1;
          }
        });
      }
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const colorIdx = Math.floor((t * 6 + p.hue * 40) % (palette.length * 40) / 40);
        const [cr, cg, cb] = palette[colorIdx % palette.length];
        const pulse = 0.4 + Math.abs(Math.sin(t * p.pulseSpeed + p.huePhase)) * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${pulse})`;
        ctx.shadowColor = `rgba(${cr},${cg},${cb},0.8)`;
        ctx.shadowBlur = 6;
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      const linkDist = isMobile ? 90 : 150;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < linkDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,212,255,${0.14 * (1 - dist / linkDist)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    resize();
    initParticles();
    draw();
    window.addEventListener('resize', throttle(() => { resize(); initParticles(); }, 200));
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });
  }

  const glowOrbs = $('#glowOrbs');
  if (glowOrbs) {
    const orbColors = ['rgba(0,212,255,.55)', 'rgba(123,47,190,.5)', 'rgba(255,0,110,.45)'];
    const orbCount = window.matchMedia('(max-width: 768px)').matches ? 4 : 7;
    for (let i = 0; i < orbCount; i++) {
      const orb = document.createElement('div');
      orb.className = 'glow-orb';
      const size = 120 + Math.random() * 220;
      orb.style.width = orb.style.height = size + 'px';
      orb.style.left = Math.random() * 100 + '%';
      orb.style.top = Math.random() * 100 + '%';
      orb.style.background = orbColors[i % orbColors.length];
      if (!prefersReducedMotion) {
        orb.style.animation = `orbDrift ${14 + Math.random() * 10}s ease-in-out ${Math.random() * -10}s infinite alternate`;
      }
      glowOrbs.appendChild(orb);
    }
  }

  const floatingShapes = $('#floatingShapes');
  if (floatingShapes) {
    const shapeDefs = [
      '<polygon points="20,2 38,32 2,32" />',
      '<rect x="4" y="4" width="28" height="28" transform="rotate(45 18 18)" />',
      '<circle cx="18" cy="18" r="16" />',
      '<polygon points="18,2 34,10 34,26 18,34 2,26 2,10" />',
    ];
    const shapeCount = window.matchMedia('(max-width: 768px)').matches ? 4 : 8;
    for (let i = 0; i < shapeCount; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'float-shape';
      const size = 24 + Math.random() * 40;
      wrap.style.left = Math.random() * 100 + '%';
      wrap.style.top = Math.random() * 100 + '%';
      wrap.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" stroke="rgba(0,212,255,.5)" stroke-width="1.2">${shapeDefs[i % shapeDefs.length]}</svg>`;
      if (!prefersReducedMotion) {
        wrap.style.animation = `shapeFloat ${5 + Math.random() * 4}s ease-in-out ${Math.random() * -6}s infinite`;
        wrap.querySelector('svg').style.animation = `shapeSpin ${20 + Math.random() * 40}s linear infinite`;
      }
      floatingShapes.appendChild(wrap);
    }
  }

  const lightLeak = $('#lightLeak');
  if (lightLeak && !prefersReducedMotion) {
    function flareLoop() {
      lightLeak.classList.add('flare');
      setTimeout(() => lightLeak.classList.remove('flare'), 4000);
      setTimeout(flareLoop, 28000 + Math.random() * 6000);
    }
    setTimeout(flareLoop, 6000);
  }

  const typedEl = $('#typedText');
  const phrases = [
    'Building the Future, One Line of Code at a Time.',
    'First Year. Full Ambition.',
    'Where curiosity compiles into craft.',
  ];
  if (typedEl && !prefersReducedMotion) {
    let pIdx = 0, cIdx = 0, deleting = false;
    function type() {
      const phrase = phrases[pIdx];
      cIdx += deleting ? -1 : 1;
      typedEl.textContent = phrase.slice(0, cIdx);
      let delay = deleting ? 35 : 55;
      if (!deleting && cIdx === phrase.length) { delay = 1800; deleting = true; }
      else if (deleting && cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; delay = 400; }
      setTimeout(type, delay);
    }
    type();
  } else if (typedEl) {
    typedEl.textContent = phrases[0];
  }

  $('#scrollIndicator')?.addEventListener('click', () => {
    $('#about')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  $$('.ripple').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple-effect';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  function animateCounter(el) {
    const target = +el.dataset.target;
    const duration = 1500;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  let revealObserver;
  function initRevealObserver() {
    if (revealObserver) return;
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          if (entry.target.querySelector?.('.counter')) {
            $$('.counter', entry.target).forEach(animateCounter);
          }
          if (entry.target.classList.contains('counter')) animateCounter(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    $$('.reveal-up').forEach(el => revealObserver.observe(el));
  }
  initRevealObserver();

  function observeStagger(selector, activeClass = 'visible', staggerMs = 90) {
    const items = $$(selector);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add(activeClass), (i % 6) * staggerMs);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    items.forEach(el => io.observe(el));
  }

  function apply3DTilt(selector) {
    $$(selector).forEach(card => {
      card.addEventListener('mousemove', (e) => {
        if (prefersReducedMotion) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const rotY = ((x / rect.width) - 0.5) * 14;
        const rotX = ((y / rect.height) - 0.5) * -14;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  const img = (seed, w = 400, h = 500) => `img/${seed}.jpg`;

  const officers = [
    { name: 'Maydel Leyros Tadeo', role: 'Mayor', seed: 'off1' },
    { name: 'James Ddave', role: 'Vice Mayor', seed: 'off2' },
    { name: 'Nikka Bayron', role: 'Secretary', seed: 'off3' },
    { name: 'Jessa Joy C. Remolisan', role: 'Treasurer', seed: 'off4' },
    { name: 'Bea Lacson', role: 'Auditor', seed: 'off5' },
    { name: 'Noah Castillo', role: 'PIO', seed: 'off6' },
    { name: 'Mika Salonga', role: 'Tech Lead', seed: 'off7' },
  ];

  const galleryItems = [
    { seed: '1', caption: 'Orientation Day welcome program' },
    { seed: '2', caption: 'First programming laboratory session' },
    { seed: '3', caption: 'Class bonding at the quad' },
    { seed: '4', caption: 'Hackathon finalists on stage' },
    { seed: '5', caption: 'Intramurals opening parade' },
    { seed: '6', caption: 'Group project defense day' },
    { seed: '7', caption: 'Weekend study jam at the library' },
    { seed: '8', caption: "Dean's list recognition" },
    { seed: '9', caption: 'Tech talk with alumni speaker' },
    { seed: '10', caption: 'Section outing by the bay' },
  ];

  const achievements = [
    { label: 'Hackathon Finalists', value: 88, note: 'Regional student hackathon, 2026' },
    { label: "Dean's Listers", value: 64, note: 'Nine students, first semester' },
    { label: 'Projects Shipped', value: 100, note: 'All six team projects delivered' },
    { label: 'Attendance Rate', value: 92, note: 'Across all class activities' },
  ];

  const skillsData = [
    { name: 'HTML / CSS', level: 5, cat: 'Frontend' },
    { name: 'JavaScript', level: 5, cat: 'Frontend' },
    { name: 'Python', level: 5, cat: 'Core' },
    { name: 'Java', level: 5, cat: 'Core' },
    { name: 'SQL', level: 5, cat: 'Data' },
    { name: 'Git & GitHub', level: 5, cat: 'Tooling' },
    { name: 'Figma', level: 5, cat: 'Design' },
    { name: 'Networking Basics', level: 5, cat: 'Systems' },
  ];

  const projects = [
    { title: 'CampusLink', desc: 'A lightweight portal mockup connecting students to announcements and org events.', tags: ['HTML', 'CSS', 'JS'], seed: 'pr1', stars: 24 },
    { title: 'BudgetBuddy', desc: 'A simple expense tracker built to practice logic and local storage patterns.', tags: ['JavaScript', 'LocalStorage'], seed: 'pr2', stars: 31 },
    { title: 'PixelQuest', desc: 'A 2D browser platformer prototype made for the game jam elective.', tags: ['Canvas', 'Game Dev'], seed: 'pr3', stars: 18 },
    { title: 'DataPeek', desc: 'A CSV visualizer that turns raw spreadsheets into readable charts.', tags: ['Python', 'Data Viz'], seed: 'pr4', stars: 27 },
    { title: 'SecureNote', desc: 'An encrypted note-taking exercise exploring basic cryptography concepts.', tags: ['Security', 'Python'], seed: 'pr5', stars: 15 },
    { title: 'StudyRoom UI', desc: 'A calming study-session interface concept with a built-in focus timer.', tags: ['Figma', 'UI/UX'], seed: 'pr6', stars: 22 },
  ];

  const scheduleData = [
    { day: 'Monday', time: '7:15 AM – 8:30 AM', subject: 'UNDERSTANDING THE SELF GEC1', room: 'NEE 204', instructor: 'Sir Ang' },
    { day: 'Tuesday', time: '10:00 AM – 1:00 PM', subject: 'IT 103', room: 'ComLab4', instructor: 'Maam Tabada' },
    { day: 'Tuesday', time: '1:00 PM – 3:00 PM', subject: 'IT 102', room: 'ONLINE', instructor: 'Maam Ky' },
    { day: 'Wednesday', time: '7:00 AM – 8:30 AM', subject: 'UNDERSTANDING THE SELF GEC1', room: 'NEE 204', instructor: 'Sir Ang' },
    { day: 'Wednesday', time: '1:00 PM – 4:00 PM', subject: 'MATH 2', room: 'ONLINE', instructor: 'Prof. L. Fernandez' },
    { day: 'Thursday', time: '1:00 PM – 4:00 PM', subject: 'IT 102', room: 'ONLINE', instructor: 'Maam Ky' },
    { day: 'Thursday', time: '6:00 PM – 8:00 PM', subject: 'PATHFIT 1', room: 'N/A', instructor: 'Coach J. Mendez' },
    { day: 'Friday', time: '10:00 AM – :00 PM', subject: 'MATH 1', room: 'ONLINE', instructor: 'Prof. A. Santos' },
    { day: 'Friday', time: '1:00 PM– 3:00 PM', subject: 'IT 101', room: 'ONLINE', instructor: 'Sir Jade' },
    { day: 'Friday', time: '3:00 PM PM – 5:00 PM', subject: 'IT 103', room: 'ONLINE', instructor: 'Maam Tabada' },
    { day: 'Saturday', time: '7:00 AM – 10:00 AM', subject: 'IT 101', room: 'TBA', instructor: 'Sir Jade' },
    { day: 'Saturday', time: '10:30 AM – 1:30 PM', subject: 'ROTC/CWTS', room: 'FIELD', instructor: 'Sir Duds' },
  ];

  const faqData = [
    { q: 'How is BSIT 1E different from other first-year sections?', a: 'Same curriculum, different culture — this batch has built its own class government, running projects, and now this website, earlier than most.', cat: 'academics' },
    { q: 'What subjects does BSIT 1E take this year?', a: 'Introductory programming, discrete mathematics, computer fundamentals, networking basics, and general education units alongside the IT core.', cat: 'academics' },
    { q: 'How can I join a class committee?', a: 'Message any officer through the Discord server listed in the Connect section — committees are open to anyone with time to give.', cat: 'life' },
    { q: 'Are there study groups outside of class?', a: 'Yes — informal study jams happen most weekends, usually announced in the class group chat a few days ahead.', cat: 'life' },
    { q: 'What career paths do BSIT students usually pursue?', a: 'Software development, data analysis, cybersecurity, UI/UX design, and systems administration are the most common tracks students explore.', cat: 'career' },
    { q: 'Does BSIT 1E do internships this early?', a: 'Not yet — internships typically begin in the third or fourth year, but some students already do freelance or volunteer tech work.', cat: 'career' },
    { q: 'What tools should a first-year IT student install?', a: 'A code editor like VS Code, Git, a terminal you\'re comfortable with, and whichever language runtime your current subject requires.', cat: 'tech' },
    { q: 'Where can I see the class\'s projects?', a: 'The Innovation Hub section on this page lists featured projects, each with a short description and its tech stack.', cat: 'tech' },
  ];

  const officerViewport = $('#officerViewport');
  const officerTrackEl = $('#officerTrack');
  const officerPrevBtn = $('#officerPrev');
  const officerNextBtn = $('#officerNext');

  function officerCardHTML(o) {
    return `
      <div class="officer-card">
        <span class="officer-badge">${o.role}</span>
        <img src="${img(o.seed, 200, 200)}" alt="Portrait of ${o.name}" loading="lazy" draggable="false">
        <h4>${o.name}</h4>
        <p class="role">BSIT 1E Officer</p>
      </div>`;
  }

  if (officerTrackEl) {
    const setHTML = officers.map(officerCardHTML).join('');
    officerTrackEl.innerHTML = setHTML + setHTML;

    let cardStep = 0;
    let singleSetWidth = 0;
    let offset = 0;
    let autoplay = true;
    const SPEED = 0.5;

    function measureOfficers() {
      const firstCard = officerTrackEl.querySelector('.officer-card');
      if (!firstCard) return;
      const styles = getComputedStyle(officerTrackEl);
      const gap = parseFloat(styles.gap) || 24;
      cardStep = firstCard.getBoundingClientRect().width + gap;
      singleSetWidth = cardStep * officers.length;
    }
    measureOfficers();
    window.addEventListener('resize', throttle(measureOfficers, 200));

    function applyOfficerTransform() {
      officerTrackEl.style.transform = `translateX(${offset}px)`;
    }

    function officerRaf() {
      if (autoplay && !prefersReducedMotion && singleSetWidth) {
        offset -= SPEED;
        if (offset <= -singleSetWidth) offset += singleSetWidth;
        applyOfficerTransform();
      }
      requestAnimationFrame(officerRaf);
    }
    requestAnimationFrame(officerRaf);

    function tweenOfficerOffset(target) {
      const start = offset;
      const startTime = performance.now();
      const duration = 380;
      function frame(now) {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        offset = start + (target - start) * eased;
        if (singleSetWidth) {
          if (offset <= -singleSetWidth) offset += singleSetWidth;
          if (offset > 0) offset -= singleSetWidth;
        }
        applyOfficerTransform();
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function officerStep(dir) {
      autoplay = false;
      clearTimeout(officerResumeTimer);
      officerResumeTimer = setTimeout(() => { autoplay = true; }, 3000);
      if (!cardStep) measureOfficers();
      tweenOfficerOffset(offset - dir * cardStep);
    }
    let officerResumeTimer = null;

    officerNextBtn?.addEventListener('click', () => officerStep(1));
    officerPrevBtn?.addEventListener('click', () => officerStep(-1));
    officerViewport?.addEventListener('mouseenter', () => { autoplay = false; });
    officerViewport?.addEventListener('mouseleave', () => { autoplay = true; });

    let dragging = false, dragStartX = 0, dragStartOffset = 0;
    function onOfficerPointerDown(e) {
      dragging = true;
      autoplay = false;
      clearTimeout(officerResumeTimer);
      officerViewport.classList.add('dragging');
      dragStartX = (e.touches ? e.touches[0].clientX : e.clientX);
      dragStartOffset = offset;
    }
    function onOfficerPointerMove(e) {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      offset = dragStartOffset + (x - dragStartX);
      if (singleSetWidth) {
        while (offset <= -singleSetWidth) offset += singleSetWidth;
        while (offset > 0) offset -= singleSetWidth;
      }
      applyOfficerTransform();
    }
    function onOfficerPointerUp() {
      if (!dragging) return;
      dragging = false;
      officerViewport.classList.remove('dragging');
      officerResumeTimer = setTimeout(() => { autoplay = true; }, 2000);
    }
    officerViewport?.addEventListener('mousedown', onOfficerPointerDown);
    officerViewport?.addEventListener('touchstart', onOfficerPointerDown, { passive: true });
    window.addEventListener('mousemove', onOfficerPointerMove);
    window.addEventListener('touchmove', onOfficerPointerMove, { passive: true });
    window.addEventListener('mouseup', onOfficerPointerUp);
    window.addEventListener('touchend', onOfficerPointerUp);
  }

  const galleryTrackEl = $('#galleryTrack');
  const galleryViewportEl = $('#galleryViewport');
  const galleryPrevBtn = $('#galleryPrev');
  const galleryNextBtn = $('#galleryNext');
  const galleryDotsEl = $('#galleryDots');
  let galleryNext = () => {};
  let galleryPrev = () => {};

  if (galleryTrackEl) {
    const total = galleryItems.length;
    let itemsPerView = 1;
    let realIndex = 0;
    let cloneCount = 1;

    function getItemsPerView() {
      const w = window.innerWidth;
      if (w >= 1280) return 3;
      if (w >= 768) return 2;
      return 1;
    }

    function slideHTML(g) {
      return `
        <div class="gallery-slide" style="flex-basis:${100 / itemsPerView}%">
          <div class="gallery-slide-inner">
            <img src="${img(g.seed, 640, 480)}" alt="${g.caption}" loading="lazy" draggable="false">
            <div class="gallery-slide-caption">${g.caption}</div>
          </div>
        </div>`;
    }

    function buildGalleryTrack() {
      itemsPerView = getItemsPerView();
      cloneCount = itemsPerView;
      const head = galleryItems.slice(-cloneCount);
      const tail = galleryItems.slice(0, cloneCount);
      const full = [...head, ...galleryItems, ...tail];
      galleryTrackEl.innerHTML = full.map(slideHTML).join('');
      goToGalleryIndex(realIndex, false);
      buildGalleryDots();
    }

    function buildGalleryDots() {
      galleryDotsEl.innerHTML = galleryItems.map((_, i) => `<button aria-label="Go to photo ${i + 1}" data-i="${i}"></button>`).join('');
      $$('button', galleryDotsEl).forEach(d => d.addEventListener('click', () => goToGalleryIndex(+d.dataset.i)));
      updateGalleryDots();
    }
    function updateGalleryDots() {
      $$('button', galleryDotsEl).forEach((d, i) => d.classList.toggle('active', i === realIndex));
    }

    function goToGalleryIndex(i, animate = true) {
      realIndex = (i + total) % total;
      const pos = cloneCount + realIndex;
      galleryTrackEl.style.transition = animate ? '' : 'none';
      galleryTrackEl.style.transform = `translateX(-${pos * (100 / itemsPerView)}%)`;
      if (!animate) {
        void galleryTrackEl.offsetHeight;
        requestAnimationFrame(() => { galleryTrackEl.style.transition = ''; });
      }
      updateGalleryDots();
    }

    galleryNext = () => goToGalleryIndex(realIndex + 1);
    galleryPrev = () => goToGalleryIndex(realIndex - 1);

    galleryNextBtn?.addEventListener('click', () => { galleryNext(); resetGalleryAuto(); });
    galleryPrevBtn?.addEventListener('click', () => { galleryPrev(); resetGalleryAuto(); });

    let galleryAutoTimer;
    function resetGalleryAuto() {
      clearInterval(galleryAutoTimer);
      if (!prefersReducedMotion) galleryAutoTimer = setInterval(galleryNext, 5000);
    }
    resetGalleryAuto();
    galleryViewportEl?.addEventListener('mouseenter', () => clearInterval(galleryAutoTimer));
    galleryViewportEl?.addEventListener('mouseleave', resetGalleryAuto);

    let touchStartX = 0, touchDragging = false, touchDeltaPct = 0;
    galleryViewportEl?.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchDragging = true;
      clearInterval(galleryAutoTimer);
    }, { passive: true });
    galleryViewportEl?.addEventListener('touchmove', e => {
      if (!touchDragging) return;
      touchDeltaPct = ((e.touches[0].clientX - touchStartX) / galleryViewportEl.offsetWidth) * 100 / itemsPerView;
    }, { passive: true });
    galleryViewportEl?.addEventListener('touchend', () => {
      if (!touchDragging) return;
      touchDragging = false;
      if (touchDeltaPct > 8) galleryPrev();
      else if (touchDeltaPct < -8) galleryNext();
      touchDeltaPct = 0;
      resetGalleryAuto();
    });

    window.addEventListener('resize', throttle(buildGalleryTrack, 250));
    buildGalleryTrack();
  }

  const achievementsGrid = $('#achievementsGrid');
  const CIRC = 251;
  achievementsGrid.innerHTML = `<svg width="0" height="0"><defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00D4FF"/><stop offset="50%" stop-color="#7B2FBE"/><stop offset="100%" stop-color="#FF006E"/>
    </linearGradient></defs></svg>` +
    achievements.map(a => {
      const offset = CIRC - (a.value / 100) * CIRC;
      return `
      <div class="achieve-card">
        <div class="ring-wrap">
          <svg viewBox="0 0 96 96">
            <circle class="ring-bg" cx="48" cy="48" r="40"/>
            <circle class="ring-fill" style="--offset:${offset}" cx="48" cy="48" r="40"/>
          </svg>
          <span class="ring-label">${a.value}%</span>
        </div>
        <h4>${a.label}</h4>
        <p>${a.note}</p>
      </div>`;
    }).join('');
  const ringObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('animate'); ringObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.4 });
  $$('.ring-fill').forEach(r => ringObserver.observe(r));

  const skillsGrid = $('#skillsGrid');
  skillsGrid.innerHTML = skillsData.map(s => `
    <div class="skill-card">
      <div class="skill-card-head"><span>${s.name}</span><small>${s.level}%</small></div>
      <div class="skill-bar"><div class="skill-bar-fill" data-level="${s.level}"></div></div>
      <p class="skill-cat">${s.cat}</p>
    </div>`).join('');
  const skillObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.style.width = entry.target.dataset.level + '%'; skillObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.4 });
  $$('.skill-bar-fill').forEach(b => skillObserver.observe(b));

  $('#projectsGrid').innerHTML = projects.map(p => `
    <div class="project-card">
      <div class="project-thumb"><img src="${img(p.seed, 600, 340)}" alt="${p.title} preview" loading="lazy"></div>
      <div class="project-body">
        <h4>${p.title}</h4>
        <p>${p.desc}</p>
        <div class="tag-row">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="project-links">
          <a href="#" onclick="return false;">&#9733; ${p.stars} stars</a>
          <a href="#" onclick="return false;">View repo &rarr;</a>
        </div>
      </div>
    </div>`).join('');
  apply3DTilt('.project-card');

  const scheduleTableBody = $('#scheduleTableBody');
  if (scheduleTableBody) {
    scheduleTableBody.innerHTML = scheduleData.map(s => `
      <tr>
        <td><span class="schedule-day-badge">${s.day}</span></td>
        <td>${s.time}</td>
        <td>${s.subject}</td>
        <td>${s.room}</td>
        <td>${s.instructor}</td>
      </tr>`).join('');
  }
  const scheduleCards = $('#scheduleCards');
  if (scheduleCards) {
    scheduleCards.innerHTML = scheduleData.map(s => `
      <div class="schedule-card">
        <div class="sc-top"><span class="sc-day">${s.day}</span><span class="sc-time">${s.time}</span></div>
        <h4>${s.subject}</h4>
        <p>${s.room} &middot; ${s.instructor}</p>
      </div>`).join('');
  }

  const faqList = $('#faqList');
  function renderFAQ(list) {
    faqList.innerHTML = list.map((f, i) => `
      <div class="faq-item" data-cat="${f.cat}" data-q="${f.q.toLowerCase()}">
        <button class="faq-q" aria-expanded="false" data-i="${i}">
          <span>${f.q}</span><span class="faq-plus">+</span>
        </button>
        <div class="faq-a"><p>${f.a}</p></div>
      </div>`).join('');
    $$('.faq-q', faqList).forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const answer = $('.faq-a', item);
        const isOpen = item.classList.contains('open');
        $$('.faq-item.open', faqList).forEach(o => { o.classList.remove('open'); $('.faq-a', o).style.maxHeight = null; $('.faq-q', o).setAttribute('aria-expanded', 'false'); });
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
  renderFAQ(faqData);

  $$('.filter-chip[data-ffilter]').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.filter-chip[data-ffilter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyFaqFilters();
    });
  });
  $('#faqSearch').addEventListener('input', throttle(applyFaqFilters, 120));
  function applyFaqFilters() {
    const activeCat = $('.filter-chip[data-ffilter].active')?.dataset.ffilter || 'all';
    const query = $('#faqSearch').value.trim().toLowerCase();
    $$('.faq-item', faqList).forEach(item => {
      const matchesCat = activeCat === 'all' || item.dataset.cat === activeCat;
      const matchesQuery = !query || item.dataset.q.includes(query);
      item.classList.toggle('hidden-item', !(matchesCat && matchesQuery));
    });
  }

  const contactForm = $('#contactForm');
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    const name = $('#cfName'), email = $('#cfEmail'), msg = $('#cfMsg');
    const errName = $('#errName'), errEmail = $('#errEmail'), errMsg = $('#errMsg');

    errName.textContent = ''; errEmail.textContent = ''; errMsg.textContent = '';
    name.closest('.form-row').classList.remove('error');
    email.closest('.form-row').classList.remove('error');
    msg.closest('.form-row').classList.remove('error');

    if (!name.value.trim()) { errName.textContent = 'Please enter your name.'; name.closest('.form-row').classList.add('error'); valid = false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email.value.trim())) { errEmail.textContent = 'Please enter a valid email address.'; email.closest('.form-row').classList.add('error'); valid = false; }
    if (msg.value.trim().length < 10) { errMsg.textContent = 'Message should be at least 10 characters.'; msg.closest('.form-row').classList.add('error'); valid = false; }

    if (!valid) return;
    $('#formSuccess').textContent = `Thanks, ${name.value.trim().split(' ')[0]} — your message is on its way.`;
    contactForm.reset();
    setTimeout(() => { $('#formSuccess').textContent = ''; }, 5000);
    burstConfetti();
  });

  $$('#contactForm input, #contactForm textarea').forEach(field => {
    field.addEventListener('input', () => { field.closest('.form-row').classList.remove('error'); });
  });

  $('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#newsletterSuccess').textContent = 'Subscribed! Welcome to the loop.';
    e.target.reset();
    setTimeout(() => { $('#newsletterSuccess').textContent = ''; }, 4000);
  });

  $('#copyYear').textContent = new Date().getFullYear();

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId.length > 1) {
        const target = $(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      }
    });
  });

  let toastStack = $('.toast-stack');
  if (!toastStack) {
    toastStack = document.createElement('div');
    toastStack.className = 'toast-stack';
    document.body.appendChild(toastStack);
  }
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast-msg';
    t.textContent = msg;
    toastStack.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 400);
    }, 3200);
  }

  const certificates = [
    { title: 'Intro to Web Development', org: 'Regional IT Youth Summit', note: 'Two-day hands-on workshop covering HTML, CSS, and JS basics.' },
    { title: 'Hackathon Finalist', org: 'Provincial Student Hackathon 2026', note: 'Top 10 team out of sixty entries, first-year division.' },
    { title: 'Git & GitHub Essentials', org: 'Campus Dev Club', note: 'Version control fundamentals for collaborative projects.' },
    { title: 'UI/UX Fundamentals', org: 'Design Thinking Seminar', note: 'Wireframing, prototyping, and usability testing basics.' },
    { title: 'Cybersecurity Awareness', org: 'National Cybersecurity Month Drive', note: 'Completed the full awareness track and quiz.' },
    { title: 'Public Speaking for Tech', org: 'Class Officer Training', note: 'Communication skills workshop for student leaders.' },
  ];
  const certificatesGrid = $('#certificatesGrid');
  if (certificatesGrid) {
    certificatesGrid.innerHTML = certificates.map(c => `
      <div class="cert-card" tabindex="0" role="button" aria-label="Flip certificate: ${c.title}">
        <div class="cert-card-inner">
          <div class="cert-face cert-face-front">
            <div class="cert-seal">&#127891;</div>
            <div>
              <h4>${c.title}</h4>
              <p>${c.org}</p>
            </div>
            <span class="cert-flip-hint">tap to flip</span>
          </div>
          <div class="cert-face cert-face-back">
            <div class="cert-seal">&#10003;</div>
            <div><p>${c.note}</p></div>
            <span class="cert-flip-hint">BSIT 1E</span>
          </div>
        </div>
      </div>`).join('');
    $$('.cert-card', certificatesGrid).forEach(card => {
      const flip = () => card.classList.toggle('flipped');
      card.addEventListener('click', flip);
      card.addEventListener('keypress', e => { if (e.key === 'Enter') flip(); });
    });
    observeStagger('.cert-card');
  }

  const sysClock = $('#sysClock');
  if (sysClock) {
    function tickClock() {
      const now = new Date();
      sysClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    tickClock();
    setInterval(tickClock, 15000);
  }

  const DATA_SAVER_KEY = 'bsit1-data-saver';
  const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  const autoSaveData = !!(conn && (conn.saveData || /2g/.test(conn.effectiveType || '')));
  const savedSaverPref = localStorage.getItem(DATA_SAVER_KEY);
  if (savedSaverPref === '1' || (savedSaverPref === null && autoSaveData)) {
    document.documentElement.classList.add('data-saver');
  }

  const cmdPalette = $('#cmdPalette');
  const cmdInput = $('#cmdInput');
  const cmdResults = $('#cmdResults');
  const cmdTrigger = $('#cmdTrigger');

  const cmdCommands = [
    { label: 'Go to Identity (About)', hint: '#about', action: () => scrollToId('about') },
    { label: 'Go to Leadership (Officers)', hint: '#officers', action: () => scrollToId('officers') },
    { label: 'Go to Class Gallery', hint: '#gallery', action: () => scrollToId('gallery') },
    { label: 'Go to Trophy Room (Achievements)', hint: '#achievements', action: () => scrollToId('achievements') },
    { label: 'Go to Certificates', hint: '#certificates', action: () => scrollToId('certificates') },
    { label: 'Go to Arsenal (Skills)', hint: '#skills', action: () => scrollToId('skills') },
    { label: 'Go to Innovation Hub (Projects)', hint: '#projects', action: () => scrollToId('projects') },
    { label: 'Go to Credits', hint: '#testimonials', action: () => scrollToId('testimonials') },
    { label: 'Go to Class Schedule', hint: '#schedule', action: () => scrollToId('schedule') },
    { label: 'Go to Knowledge Hub (FAQ)', hint: '#faq', action: () => scrollToId('faq') },
    { label: 'Go to Connect (Contact)', hint: '#contact', action: () => scrollToId('contact') },
    { label: 'Toggle theme', hint: 'light / dark', action: () => themeToggle.click() },
    { label: 'Toggle data saver mode', hint: 'disable heavy fx', action: () => {
      const on = document.documentElement.classList.toggle('data-saver');
      localStorage.setItem(DATA_SAVER_KEY, on ? '1' : '0');
      showToast(on ? 'Data saver on — heavy effects disabled.' : 'Data saver off — full experience restored.');
    } },
    { label: 'Show keyboard shortcuts', hint: '?', action: () => openShortcuts() },
    { label: 'Back to top', hint: 'home', action: () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }) },
  ];

  function scrollToId(id) {
    const target = $('#' + id);
    if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  let cmdActiveIndex = 0;
  let cmdFiltered = cmdCommands;

  function renderCmdResults() {
    if (!cmdFiltered.length) {
      cmdResults.innerHTML = '<div class="cmd-empty">No matching commands.</div>';
      return;
    }
    cmdResults.innerHTML = cmdFiltered.map((c, i) => `
      <div class="cmd-item${i === cmdActiveIndex ? ' active' : ''}" data-i="${i}">
        <span>${c.label}</span><small>${c.hint}</small>
      </div>`).join('');
    $$('.cmd-item', cmdResults).forEach(el => {
      el.addEventListener('mouseenter', () => { cmdActiveIndex = +el.dataset.i; renderCmdResults(); });
      el.addEventListener('click', () => runCmd(+el.dataset.i));
    });
  }

  function runCmd(i) {
    const cmd = cmdFiltered[i];
    if (!cmd) return;
    closeCmdPalette();
    cmd.action();
  }

  function filterCmd(query) {
    const q = query.trim().toLowerCase();
    cmdFiltered = !q ? cmdCommands : cmdCommands.filter(c => c.label.toLowerCase().includes(q));
    cmdActiveIndex = 0;
    renderCmdResults();
  }

  function openCmdPalette() {
    cmdPalette.classList.add('open');
    cmdInput.value = '';
    filterCmd('');
    setTimeout(() => cmdInput.focus(), 50);
  }
  function closeCmdPalette() {
    cmdPalette.classList.remove('open');
  }

  cmdTrigger?.addEventListener('click', openCmdPalette);
  cmdInput?.addEventListener('input', () => filterCmd(cmdInput.value));
  cmdPalette?.addEventListener('click', e => { if (e.target === cmdPalette) closeCmdPalette(); });
  cmdInput?.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdActiveIndex = Math.min(cmdActiveIndex + 1, cmdFiltered.length - 1); renderCmdResults(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cmdActiveIndex = Math.max(cmdActiveIndex - 1, 0); renderCmdResults(); }
    else if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdActiveIndex); }
    else if (e.key === 'Escape') { closeCmdPalette(); }
  });

  const shortcutsModal = $('#shortcutsModal');
  function openShortcuts() { shortcutsModal.classList.add('open'); }
  function closeShortcuts() { shortcutsModal.classList.remove('open'); }
  $('#shortcutsClose')?.addEventListener('click', closeShortcuts);
  shortcutsModal?.addEventListener('click', e => { if (e.target === shortcutsModal) closeShortcuts(); });

  document.addEventListener('keydown', e => {
    const typingInField = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      cmdPalette.classList.contains('open') ? closeCmdPalette() : openCmdPalette();
      return;
    }
    if (cmdPalette.classList.contains('open') || shortcutsModal.classList.contains('open')) {
      if (e.key === 'Escape') { closeCmdPalette(); closeShortcuts(); }
      return;
    }
    if (typingInField) return;

    if (e.key === '?') { openShortcuts(); }
    if (e.key.toLowerCase() === 't') { themeToggle.click(); }
    if (e.key === 'ArrowLeft') { galleryPrev(); }
    if (e.key === 'ArrowRight') { galleryNext(); }
  });

  const confettiCanvas = $('#confettiCanvas');
  function burstConfetti() {
    if (!confettiCanvas || prefersReducedMotion) return;
    const cctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const colors = ['#00D4FF', '#7B2FBE', '#FF006E', '#F1F5F9'];
    const pieces = Array.from({ length: 140 }, () => ({
      x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
      y: confettiCanvas.height / 3,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 12,
    }));
    let frame = 0;
    function step() {
      frame++;
      cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      pieces.forEach(p => {
        p.vy += 0.35;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        cctx.save();
        cctx.translate(p.x, p.y);
        cctx.rotate((p.rot * Math.PI) / 180);
        cctx.fillStyle = p.color;
        cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        cctx.restore();
      });
      if (frame < 130) requestAnimationFrame(step);
      else cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    step();
  }

  const konamiSeq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiPos = 0;
  document.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiPos = key === konamiSeq[konamiPos] ? konamiPos + 1 : (key === konamiSeq[0] ? 1 : 0);
    if (konamiPos === konamiSeq.length) {
      konamiPos = 0;
      burstConfetti();
      showToast('You found the batch\'s secret handshake. ✨');
    }
  });

  const skillsMarquee = $('#marqueeSkillsTrack');
  if (skillsMarquee) {
    const skillItems = [
      '⌁ HTML', '⌁ CSS', '⌁ JavaScript', '⌁ Python', '⌁ Java',
      '⌁ SQL', '⌁ Git', '⌁ Figma', '⌁ Networking', '⌁ Cybersecurity',
      '⌁ React', '⌁ Node.js', '⌁ MongoDB', '⌁ Docker', '⌁ Cloud'
    ];
    const chips = skillItems.map(s => `<span class="marquee-chip">${s}</span>`).join('');
    skillsMarquee.innerHTML = chips + chips;
  }

  const quotesMarquee = $('#marqueeQuotesTrack');
  if (quotesMarquee) {
    const quotes = [
      '"The best way to predict the future is to build it." — Alan Kay',
      '"First, solve the problem. Then, write the code." — John Johnson',
      '"Talk is cheap. Show me the code." — Linus Torvalds',
      '"It works on my machine." — Every developer ever',
    ];
    const quoteItems = quotes.map(q => `<span class="marquee-quote">${q}</span>`).join('');
    quotesMarquee.innerHTML = quoteItems + quoteItems;
  }

  const slimeBlobs = $('#slimeBlobs');
  if (slimeBlobs) {
    const colors = ['#00D4FF', '#7B2FBE', '#FF006E', '#3B82F6'];
    for (let i = 0; i < 6; i++) {
      const blob = document.createElement('div');
      blob.className = 'slime-blob';
      const size = 140 + Math.random() * 260;
      blob.style.width = size + 'px';
      blob.style.height = size + 'px';
      blob.style.left = (Math.random() * 80 + 5) + '%';
      blob.style.top = (Math.random() * 80 + 5) + '%';
      blob.style.background = colors[i % colors.length];
      blob.style.opacity = 0.2 + Math.random() * 0.25;
      blob.style.animationDelay = (Math.random() * -20) + 's';
      blob.style.animationDuration = (18 + Math.random() * 16) + 's';
      slimeBlobs.appendChild(blob);
    }
  }

  function initMagnetic() {
    const els = $$('.magnetic');
    els.forEach(el => {
      el.addEventListener('mousemove', function(e) {
        if (prefersReducedMotion) return;
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const max = 12;
        const tx = (x / (rect.width / 2)) * max;
        const ty = (y / (rect.height / 2)) * max;
        this.style.setProperty('--tx', tx + 'px');
        this.style.setProperty('--ty', ty + 'px');
      });
      el.addEventListener('mouseleave', function() {
        this.style.setProperty('--tx', '0px');
        this.style.setProperty('--ty', '0px');
      });
    });
  }
  initMagnetic();

  const sysConn = $('#sysConn');
  function updateConnStatus() {
    if (!sysConn) return;
    sysConn.textContent = navigator.onLine ? 'online' : 'offline';
  }
  updateConnStatus();
  window.addEventListener('online', updateConnStatus);
  window.addEventListener('offline', updateConnStatus);

})();