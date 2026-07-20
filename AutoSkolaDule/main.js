/* =========================================================
   Auto škola Dule — main.js
   Sve je progresivno: bez JS-a sadržaj i dalje postoji.
   ========================================================= */
(function () {
  'use strict';

  var manjeAnimacije = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =======================================================
     1. ZVUK
     Prvo traži prave snimke u assets/audio/. Ako ih nema,
     sve sintetizuje preko Web Audio API-ja. Nikad autoplay —
     zvuk kreće tek pošto korisnik pritisne "Uključi zvuk".
     ======================================================= */
  var Zvuk = {
    ukljucen: false,
    ctx: null,
    /* Podrazumevano se sve sintetizuje i nijedan fajl se ne traži — bez 404 grešaka.
       Kad ubaciš snimke u assets/audio/, postavi koristiFajlove na true. */
    koristiFajlove: false,
    fajlovi: {
      otkljucaj: 'audio/unlock.mp3',
      paljenje:  'audio/engine-start.mp3',
      odlazak:   'audio/drive-away.mp3'
    },
    elementi: {},

    pripremi: function () {
      if (!this.koristiFajlove) return;
      var self = this;
      Object.keys(this.fajlovi).forEach(function (kljuc) {
        var a = new Audio();
        a.preload = 'auto';
        a.src = self.fajlovi[kljuc];
        a.addEventListener('canplaythrough', function () { a.dataset.spreman = '1'; });
        a.addEventListener('error', function () { a.dataset.spreman = '0'; });
        self.elementi[kljuc] = a;
      });
    },

    probudi: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    },

    pusti: function (kljuc) {
      if (!this.ukljucen) return;
      var a = this.elementi[kljuc];
      if (a && a.dataset.spreman === '1') {
        a.currentTime = 0;
        a.volume = .55;
        a.play().catch(function () {});
        return;
      }
      if (kljuc === 'otkljucaj') this._otkljucaj();
      if (kljuc === 'paljenje')  this._paljenje();
      if (kljuc === 'papucica')  this._klik();
      if (kljuc === 'gas')       this._gas();
    },

    /* mehanički klik papučice */
    _klik: function () {
      if (!this.probudi()) return;
      var ctx = this.ctx, t = ctx.currentTime;
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'triangle';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.08);
      f.type = 'lowpass'; f.frequency.setValueAtTime(1200, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      o.connect(f).connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + 0.15);
    },

    /* dodavanje gasa */
    _gas: function () {
      if (!this.probudi()) return;
      var ctx = this.ctx, t = ctx.currentTime;
      [
        { tip: 'sawtooth', osnov: 38, jacina: 0.11 },
        { tip: 'square',   osnov: 76, jacina: 0.035 }
      ].forEach(function (p) {
        var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = p.tip;
        f.type = 'lowpass';
        f.frequency.setValueAtTime(700, t);
        f.frequency.linearRampToValueAtTime(2600, t + 0.8);
        o.frequency.setValueAtTime(p.osnov, t);
        o.frequency.exponentialRampToValueAtTime(p.osnov * 3.4, t + 0.85);
        o.frequency.exponentialRampToValueAtTime(p.osnov * 2.2, t + 1.4);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(p.jacina, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        o.connect(f).connect(g).connect(ctx.destination);
        o.start(t); o.stop(t + 1.6);
      });
    },

    utisaj: function () {
      var self = this;
      Object.keys(this.elementi).forEach(function (k) {
        var a = self.elementi[k];
        if (a.paused) return;
        var korak = setInterval(function () {
          a.volume = Math.max(0, a.volume - .08);
          if (a.volume <= .01) { a.pause(); clearInterval(korak); }
        }, 60);
      });
      if (this.ctx && this.ctx.state === 'running') {
        var c = this.ctx;
        setTimeout(function () { c.close(); }, 1200);
        this.ctx = null;
      }
    },

    /* ---- sintetizovani fallback ---- */
    _otkljucaj: function () {
      if (!this.probudi()) return;
      var t = this.ctx.currentTime;
      for (var i = 0; i < 2; i++) this._bip(t + i * 0.16);
    },

    _bip: function (kada) {
      var osc = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1750, kada);
      g.gain.setValueAtTime(0.0001, kada);
      g.gain.exponentialRampToValueAtTime(0.05, kada + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, kada + 0.09);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(kada); osc.stop(kada + 0.12);
    },

    _paljenje: function () {
      if (!this.probudi()) return;
      var ctx = this.ctx, t = ctx.currentTime, duzina = 3.4;

      var bafer = ctx.createBuffer(1, ctx.sampleRate * duzina, ctx.sampleRate);
      var d = bafer.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      var sum = ctx.createBufferSource(); sum.buffer = bafer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.linearRampToValueAtTime(950, t + 1.2);
      filter.frequency.linearRampToValueAtTime(430, t + 3.0);

      var gS = ctx.createGain();
      gS.gain.setValueAtTime(0.0001, t);
      gS.gain.exponentialRampToValueAtTime(0.085, t + 0.12);
      gS.gain.setValueAtTime(0.085, t + 0.9);
      gS.gain.exponentialRampToValueAtTime(0.04, t + 1.4);
      gS.gain.exponentialRampToValueAtTime(0.0001, t + 3.3);
      sum.connect(filter).connect(gS).connect(ctx.destination);
      sum.start(t); sum.stop(t + duzina);

      [
        { tip: 'sawtooth', osnov: 33, jacina: 0.10 },
        { tip: 'triangle', osnov: 66, jacina: 0.05 }
      ].forEach(function (p) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = p.tip;
        o.frequency.setValueAtTime(p.osnov * 0.5, t + 0.1);
        o.frequency.linearRampToValueAtTime(p.osnov * 0.85, t + 1.0);
        o.frequency.linearRampToValueAtTime(p.osnov * 2.2, t + 1.5);
        o.frequency.linearRampToValueAtTime(p.osnov * 1.1, t + 2.4);
        o.frequency.linearRampToValueAtTime(p.osnov * 1.8, t + 3.1);
        g.gain.setValueAtTime(0.0001, t + 0.1);
        g.gain.exponentialRampToValueAtTime(p.jacina, t + 1.1);
        g.gain.exponentialRampToValueAtTime(p.jacina * 1.6, t + 1.55);
        g.gain.exponentialRampToValueAtTime(p.jacina * 0.9, t + 2.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
        o.connect(g).connect(ctx.destination);
        o.start(t + 0.1); o.stop(t + 3.5);
      });
    }
  };

  /* =======================================================
     2. PUT — perspektivna projekcija na canvasu
     Tačka nestajanja je na horizontu, pa se asfalt sužava,
     a isprekidana središnja linija juri ka gledaocu i sama
     se skraćuje sa daljinom. Nema klizanja levo-desno.
     ======================================================= */
  function Put(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pomeraj = 0;      /* pređeni put u metrima */
    this.brzina = 0;       /* trenutna brzina, m/s */
    this.ciljBrzina = 0;
    this.sjajKocnice = 0;  /* odsjaj stop svetala na asfaltu, 0–1 */
    this._naVelicinu = this.velicina.bind(this);
    window.addEventListener('resize', this._naVelicinu);
    this.velicina();
  }

  /* deterministički generator da grad izgleda isto pri svakom crtanju */
  Put.prototype._nasumicno = function () {
    this._seme = (this._seme * 1103515245 + 12345) & 0x7fffffff;
    return this._seme / 0x7fffffff;
  };

  Put.prototype.velicina = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = this.canvas.offsetWidth;
    this.H = this.canvas.offsetHeight;
    this.canvas.width  = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.cx = this.W / 2;
    this.horizont = this.H * 0.44;
    this.f = this.H * 0.66;          /* žižna daljina */
    this.visinaKamere = 2.35;        /* metara iznad asfalta */
    this._napraviGrad();
  };

  /* projekcija: x = bočni pomak u metrima, z = udaljenost u metrima */
  Put.prototype.proj = function (x, z) {
    var s = this.f / z;
    return { X: this.cx + x * s, Y: this.horizont + this.visinaKamere * s, s: s };
  };

  Put.prototype._napraviGrad = function () {
    this._seme = 20240607;
    this.grad = [];
    var x = -60;
    while (x < this.W + 60) {
      var sirina = 14 + this._nasumicno() * 46;
      var visina = 8 + Math.pow(this._nasumicno(), 1.7) * this.H * 0.085;
      /* bliže centru kadra zgrade su nešto niže — utisak dubine grada */
      var odCentra = Math.abs(x - this.cx) / this.W;
      visina *= .45 + odCentra * .9;
      var prozori = [];
      var brojProzora = Math.floor(visina / 9);
      for (var i = 0; i < brojProzora; i++) {
        if (this._nasumicno() > .58) {
          prozori.push({
            x: x + 3 + this._nasumicno() * (sirina - 6),
            y: visina - 4 - i * 9,
            t: this._nasumicno() > .8 ? 1 : 0
          });
        }
      }
      this.grad.push({ x: x, w: sirina, h: visina, prozori: prozori });
      x += sirina + 3 + this._nasumicno() * 16;
    }
  };

  Put.prototype._cetvorougao = function (a, b, c, d, boja) {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(a.X, a.Y); ctx.lineTo(b.X, b.Y);
    ctx.lineTo(c.X, c.Y); ctx.lineTo(d.X, d.Y);
    ctx.closePath();
    ctx.fillStyle = boja;
    ctx.fill();
  };

  Put.prototype.crtaj = function () {
    var ctx = this.ctx, H = this.H, W = this.W, hor = this.horizont;
    ctx.clearRect(0, 0, W, H);

    /* --- odsjaj grada iznad horizonta --- */
    var halo = ctx.createLinearGradient(0, hor - H * 0.2, 0, hor + 4);
    halo.addColorStop(0, 'rgba(84,104,140,0)');
    halo.addColorStop(.65, 'rgba(96,116,152,.14)');
    halo.addColorStop(1, 'rgba(196,168,132,.20)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, hor - H * 0.2, W, H * 0.2 + 4);

    /* --- siluete grada na horizontu --- */
    for (var i = 0; i < this.grad.length; i++) {
      var z = this.grad[i];
      ctx.fillStyle = '#080b10';
      ctx.fillRect(z.x, hor - z.h, z.w, z.h + 2);
      for (var p = 0; p < z.prozori.length; p++) {
        var pr = z.prozori[p];
        ctx.fillStyle = pr.t ? 'rgba(255,206,140,.75)' : 'rgba(176,204,236,.5)';
        ctx.fillRect(pr.x, hor - pr.y, 1.6, 2.4);
      }
    }

    /* --- asfalt --- */
    var zBlizu = 2.6, zDaleko = 320;
    var pojas = ctx.createLinearGradient(0, this.proj(0, zBlizu).Y, 0, hor);
    pojas.addColorStop(0, '#1c2127');
    pojas.addColorStop(.45, '#141920');
    pojas.addColorStop(1, '#0a0e13');
    this._cetvorougao(
      this.proj(-6.4, zBlizu), this.proj(6.4, zBlizu),
      this.proj(6.4, zDaleko), this.proj(-6.4, zDaleko), pojas);

    /* tragovi guma — dve tamnije trake */
    [-1.75, 1.75].forEach(function (x) {
      this._cetvorougao(
        this.proj(x - .55, zBlizu), this.proj(x + .55, zBlizu),
        this.proj(x + .55, zDaleko), this.proj(x - .55, zDaleko),
        'rgba(0,0,0,.22)');
    }, this);

    /* --- pune ivične linije --- */
    [-5.5, 5.5].forEach(function (x) {
      this._cetvorougao(
        this.proj(x - .09, zBlizu), this.proj(x + .09, zBlizu),
        this.proj(x + .09, 190), this.proj(x - .09, 190),
        'rgba(226,232,240,.42)');
    }, this);

    /* --- bela isprekidana središnja linija --- */
    var period = 9.6, crta = 3.6, poluSirina = .16;
    var pocetak = -(this.pomeraj % period);
    for (var z1 = pocetak; z1 < 190; z1 += period) {
      var z2 = z1 + crta;
      if (z2 <= zBlizu) continue;
      var a = Math.max(z1, zBlizu);
      var providnost = Math.max(0, Math.min(1, 1 - (a - zBlizu) / 150));
      this._cetvorougao(
        this.proj(-poluSirina, a),  this.proj(poluSirina, a),
        this.proj(poluSirina, z2),  this.proj(-poluSirina, z2),
        'rgba(242,246,250,' + (.92 * providnost).toFixed(3) + ')');
    }

    /* --- odsjaj stop svetala na asfaltu --- */
    if (this.sjajKocnice > 0.01) {
      var t = this.proj(0, this.zVozila || 10);
      var r = Math.max(40, t.s * 3.2);
      var sjaj = ctx.createRadialGradient(t.X, t.Y, 0, t.X, t.Y, r);
      sjaj.addColorStop(0, 'rgba(226,55,43,' + (.34 * this.sjajKocnice).toFixed(3) + ')');
      sjaj.addColorStop(1, 'rgba(226,55,43,0)');
      ctx.fillStyle = sjaj;
      ctx.fillRect(t.X - r, t.Y - r * .6, r * 2, r * 1.4);
    }

    /* --- noćna izmaglica koja guta daljinu --- */
    var magla = ctx.createLinearGradient(0, hor, 0, hor + H * 0.26);
    magla.addColorStop(0, 'rgba(9,12,17,.96)');
    magla.addColorStop(1, 'rgba(9,12,17,0)');
    ctx.fillStyle = magla;
    ctx.fillRect(0, hor, W, H * 0.26);
  };

  Put.prototype.korak = function (dt) {
    this.brzina += (this.ciljBrzina - this.brzina) * Math.min(1, dt * 0.55);
    this.pomeraj += this.brzina * dt;
    this.crtaj();
  };

  Put.prototype.stani = function () {
    window.removeEventListener('resize', this._naVelicinu);
  };

  /* =======================================================
     3. DIM — čestice na canvasu
     Emiter prati stvarnu poziciju auspuha, pa dim ostaje na
     mestu i kad se promeni veličina prozora. Isti kadar se
     crta i na sloju ispred teksta, da se slova formiraju
     unutar oblaka, a ne ispod njega.
     ======================================================= */
  function Dim(canvas, izvor, canvasIspred) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.predCanvas = canvasIspred || null;
    this.predCtx = this.predCanvas ? this.predCanvas.getContext('2d') : null;
    this.izvor = izvor;
    this.cestice = [];
    this.intenzitet = 0;
    this.sprite = this._napraviSprite();
    this._naVelicinu = this.velicina.bind(this);
    window.addEventListener('resize', this._naVelicinu);
    this.velicina();
  }

  Dim.prototype._napraviSprite = function () {
    var s = document.createElement('canvas');
    s.width = s.height = 128;
    var c = s.getContext('2d');
    var g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0,   'rgba(216,224,234,.58)');
    g.addColorStop(.35, 'rgba(192,202,216,.28)');
    g.addColorStop(1,   'rgba(182,194,210,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    return s;
  };

  Dim.prototype.velicina = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    [this.canvas, this.predCanvas].forEach(function (c) {
      if (!c) return;
      c.width  = c.offsetWidth  * dpr;
      c.height = c.offsetHeight * dpr;
    });
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.predCtx) this.predCtx.setTransform(1, 0, 0, 1, 0, 0);
  };

  Dim.prototype.tackaIzvora = function () {
    var a = this.izvor.getBoundingClientRect();
    var c = this.canvas.getBoundingClientRect();
    if (!a.width) return { x: c.width * .5, y: c.height * .72 };
    return { x: a.left + a.width * .5 - c.left, y: a.top + a.height * .6 - c.top };
  };

  Dim.prototype.dodaj = function (broj) {
    var t = this.tackaIzvora();
    for (var i = 0; i < broj; i++) {
      this.cestice.push({
        x: t.x + (Math.random() - .5) * 16,
        y: t.y + (Math.random() - .5) * 8,
        vx: (Math.random() - .35) * 1.5,
        vy: -(.45 + Math.random() * .95),
        r: 14 + Math.random() * 24,
        rast: .5 + Math.random() * .8,
        zivot: 0,
        vek: 210 + Math.random() * 190,
        seme: Math.random() * 100,
        jacina: .45 + Math.random() * .55
      });
    }
  };

  Dim.prototype.korak = function () {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.intenzitet > 0) this.dodaj(this.intenzitet);

    for (var i = this.cestice.length - 1; i >= 0; i--) {
      var p = this.cestice[i];
      p.zivot++;
      if (p.zivot > p.vek) { this.cestice.splice(i, 1); continue; }

      var f = p.zivot / p.vek;
      p.seme += .012;
      p.vx += Math.sin(p.seme) * .014;
      p.vy -= .006;                       /* dim se penje i širi ka sredini kadra */
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.rast;

      var alfa = Math.sin(f * Math.PI) * .48 * p.jacina;
      if (alfa <= 0) continue;
      ctx.globalAlpha = alfa;
      ctx.drawImage(this.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;

    /* isti oblak, prepisan preko teksta */
    if (this.predCtx) {
      this.predCtx.clearRect(0, 0, this.predCanvas.width, this.predCanvas.height);
      this.predCtx.drawImage(this.canvas, 0, 0);
    }
  };

  Dim.prototype.stani = function () {
    this.cestice.length = 0;
    this.intenzitet = 0;
    window.removeEventListener('resize', this._naVelicinu);
  };

  /* =======================================================
     4. INTRO SEKVENCA
     ======================================================= */
  var intro = document.getElementById('intro');
  var pedalaGas = document.getElementById('pedalaGas');
  var pedaleUput = document.getElementById('pedaleUput');
  var kutijaStart = document.getElementById('introStart');
  var dugmeZvuk = document.getElementById('dugmeZvuk');
  var tekstZvuk = document.getElementById('tekstZvuk');
  var dugmePreskoci = document.getElementById('dugmePreskoci');
  var zaglavlje = document.getElementById('zaglavlje');
  var video = document.getElementById('introVideo');
  var platnoPut = document.getElementById('putCanvas');
  var platnoDim = document.getElementById('dimCanvas');
  var platnoDimPred = document.getElementById('dimPredCanvas');
  var auspuh = document.getElementById('auspuhTacka');
  var vozilo = document.getElementById('vozilo');

  var tajmeri = [];
  var put = null, dim = null;
  var petlja = null, poslednjiKadar = 0;
  var zatvoren = false;

  /* udaljenost vozila od kamere, u metrima */
  var zVozila = 9.5;
  var tweenVozila = null;

  function pamti(kljuc, vrednost) {
    try { sessionStorage.setItem(kljuc, vrednost); } catch (e) {}
  }
  function zapamceno(kljuc) {
    try { return sessionStorage.getItem(kljuc); } catch (e) { return null; }
  }

  Zvuk.pripremi();

  if (zapamceno('dule-zvuk') === '1') {
    Zvuk.ukljucen = true;
    dugmeZvuk.setAttribute('aria-pressed', 'true');
    tekstZvuk.textContent = 'Zvuk uključen';
  }

  /* video je nadgradnja: bez upisanih putanja nema nijednog zahteva ka mreži */
  if (video && !(video.dataset.mp4 || video.dataset.webm)) {
    video.remove();
    video = null;
  }
  if (video) {
    if (video.dataset.poster) video.poster = video.dataset.poster;
    [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(function (par) {
      var put = video.dataset[par[0]];
      if (!put) return;
      var izvor = document.createElement('source');
      izvor.src = put; izvor.type = par[1];
      video.appendChild(izvor);
    });
    video.addEventListener('loadeddata', function () {
      intro.classList.add('ima-video');
      video.classList.add('je-spreman');
      if (!manjeAnimacije) video.play().catch(function () {});
    });
    video.addEventListener('error', function () {
      intro.classList.remove('ima-video');
      video.remove();
    }, true);
    var sporo = navigator.connection &&
      (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
    if (!sporo) video.load();
  }

  /* --- vozilo se postavlja tačno na asfalt, po projekciji --- */
  function postaviVozilo() {
    if (!put || !vozilo) return;
    var t = put.proj(0, zVozila);
    var sirinaKaroserije = 2.1 * t.s;           /* 2,1 m širine */
    var sirinaElementa = sirinaKaroserije / 0.675;  /* karoserija zauzima 67,5% viewBox-a */
    var visinaElementa = sirinaElementa * (400 / 640);
    vozilo.style.width = sirinaElementa + 'px';
    vozilo.style.left = t.X + 'px';
    vozilo.style.top = (t.Y - visinaElementa * 0.88) + 'px';   /* 0,88 = dodir guma sa asfaltom */
    put.zVozila = zVozila;
  }

  function pomeriVozilo(doZ, trajanje) {
    tweenVozila = { od: zVozila, do: doZ, pocetak: performance.now(), trajanje: trajanje };
  }

  /* --- jedna petlja za put, dim i poziciju vozila --- */
  function kadar(sada) {
    if (zatvoren) return;
    var dt = Math.min((sada - poslednjiKadar) / 1000, 0.05);
    poslednjiKadar = sada;

    if (tweenVozila) {
      var p = Math.min((sada - tweenVozila.pocetak) / tweenVozila.trajanje, 1);
      var e = 1 - Math.pow(1 - p, 3);
      zVozila = tweenVozila.od + (tweenVozila.do - tweenVozila.od) * e;
      if (p >= 1) tweenVozila = null;
    }

    if (put) { put.korak(dt); postaviVozilo(); }
    if (dim) dim.korak();
    petlja = requestAnimationFrame(kadar);
  }

  /* poslednja linija odbrane: sajt se vraća bez animacije, šta god da je otkazalo */
  function ugasiIntroOdmah() {
    zatvoren = true;
    tajmeri.forEach(clearTimeout);
    if (petlja) cancelAnimationFrame(petlja);
    document.body.classList.remove('intro-otvoren');
    if (intro) { intro.classList.remove('je-aktivan'); intro.hidden = true; }
    if (zaglavlje) zaglavlje.classList.add('je-vidljivo');
  }

  /* svaka neuhvaćena greška na stranici otključava sajt */
  window.addEventListener('error', function () {
    if (!zatvoren && intro && !intro.hidden) ugasiIntroOdmah();
  });

  function faza(ime, kasnjenje) {
    tajmeri.push(setTimeout(function () { intro.classList.add('faza-' + ime); }, kasnjenje));
  }
  function uTrenutku(kasnjenje, sta) {
    tajmeri.push(setTimeout(sta, kasnjenje));
  }

  function prikaziStart() {
    kutijaStart.classList.add('je-vidljiv');
    if (pedalaGas) pedalaGas.focus({ preventScroll: true });
  }

  function pokreniSekvencu() {
    /* bez ijednog od ovih elemenata intro nema smisla — sajt se prikazuje normalno */
    if (!intro || !kutijaStart || !pedalaGas || !vozilo) {
      ugasiIntroOdmah();
      return;
    }

    /* od ovog trenutka intro je vidljiv i skrol je zaključan */
    intro.hidden = false;
    intro.classList.add('je-aktivan');
    document.body.classList.add('intro-otvoren');

    /* ako se posle 12 s papučice još nisu pojavile, nešto je zapelo — prikaži ih */
    tajmeri.push(setTimeout(function () {
      if (!zatvoren && !kutijaStart.classList.contains('je-vidljiv')) prikaziStart();
    }, 12000));

    /* scena se crta i u skraćenom režimu — samo bez kretanja */
    if (platnoPut) {
      put = new Put(platnoPut);
      put.crtaj();
      postaviVozilo();
    }

    if (manjeAnimacije || zapamceno('dule-uvod') === 'vidjen') {
      intro.classList.add('faza-scena', 'faza-paljenje', 'faza-tekst', 'faza-pod');
      if (put) { put.sjajKocnice = 1; put.crtaj(); }
      prikaziStart();
      return;
    }

    intro.classList.add('je-pokrenut');
    pamti('dule-uvod', 'vidjen');

    if (platnoDim && auspuh) dim = new Dim(platnoDim, auspuh, platnoDimPred);
    poslednjiKadar = performance.now();
    petlja = requestAnimationFrame(kadar);

    faza('scena', 300);                       /* vozilo izranja iz mraka */

    uTrenutku(1300, function () {             /* otključavanje */
      intro.classList.add('faza-otkljucaj');
      Zvuk.pusti('otkljucaj');
    });

    uTrenutku(2600, function () {             /* paljenje motora */
      intro.classList.add('faza-paljenje');
      Zvuk.pusti('paljenje');
      if (put) put.sjajKocnice = 1;
      if (dim) dim.intenzitet = 6;            /* prvi oblak iz auspuha */
    });
    uTrenutku(3600, function () { if (dim) dim.intenzitet = 2; });

    uTrenutku(4200, function () {             /* kreće — asfalt počinje da juri */
      intro.classList.add('faza-vozi');
      Zvuk.pusti('odlazak');
      if (put) put.ciljBrzina = 23;           /* ~83 km/h */
      if (dim) dim.intenzitet = 5;
      pomeriVozilo(13.5, 2600);               /* vozilo odmiče, kamera ga prati */
    });

    uTrenutku(5200, function () { if (put) put.sjajKocnice = .25; });
    uTrenutku(5800, function () { if (dim) dim.intenzitet = 2; });
    uTrenutku(7200, function () { if (dim) dim.intenzitet = 1; });

    faza('tekst', 5200);                      /* tekst se formira u dimu */
    faza('pod', 7000);
    uTrenutku(8000, prikaziStart);
  }

  function zatvoriIntro() {
    if (zatvoren) return;
    zatvoren = true;
    tajmeri.forEach(clearTimeout);
    if (petlja) cancelAnimationFrame(petlja);
    Zvuk.utisaj();
    if (dim) dim.stani();
    if (put) put.stani();
    if (video && video.pause) video.pause();

    intro.classList.add('je-gotov');
    document.body.classList.remove('intro-otvoren');
    if (zaglavlje) zaglavlje.classList.add('je-vidljivo');

    setTimeout(function () {
      intro.hidden = true;
      var h1 = document.querySelector('.hero__naslov');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }, 1100);
  }

  if (dugmeZvuk) dugmeZvuk.addEventListener('click', function () {
    Zvuk.ukljucen = !Zvuk.ukljucen;
    dugmeZvuk.setAttribute('aria-pressed', String(Zvuk.ukljucen));
    tekstZvuk.textContent = Zvuk.ukljucen ? 'Zvuk uključen' : 'Uključi zvuk';
    pamti('dule-zvuk', Zvuk.ukljucen ? '1' : '0');
    if (Zvuk.ukljucen) { Zvuk.probudi(); Zvuk.pusti('otkljucaj'); }
    else Zvuk.utisaj();
  });

  /* --- gas: jedina interaktivna papučica ---
     Kvačilo i kočnica su vizuelni elementi. Reaguje na klik mišem,
     na dodir i na tastaturu, ali samo jednom. --- */
  var gasDat = false;

  function dodajGas() {
    if (gasDat || zatvoren) return;
    gasDat = true;

    pedalaGas.classList.add('je-pritisnuta');
    intro.classList.add('je-gas');
    Zvuk.pusti('gas');

    if (put) { put.ciljBrzina = 42; put.sjajKocnice = 0; }
    if (dim) dim.intenzitet = 7;
    pomeriVozilo(zVozila + 7, 900);          /* vozilo odskoči napred */
    pedaleUput.textContent = 'Krećemo';

    setTimeout(zatvoriIntro, 900);
  }

  if (pedalaGas) {
    /* pointerdown reaguje odmah na dodir, bez čekanja na klik */
    if (window.PointerEvent) {
      pedalaGas.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dodajGas();
      });
    }
    /* klik pokriva miš bez PointerEvent-a, Enter i razmaknicu */
    pedalaGas.addEventListener('click', dodajGas);
  }

  if (dugmePreskoci) dugmePreskoci.addEventListener('click', zatvoriIntro);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && intro && !intro.hidden) zatvoriIntro();
  });

  /* fokus ostaje unutar intro scene dok je otvorena */
  if (intro) intro.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || intro.hidden) return;
    var mogu = intro.querySelectorAll('button:not([disabled])');
    var vidljivi = Array.prototype.filter.call(mogu, function (b) { return b.offsetParent !== null; });
    if (!vidljivi.length) return;
    var prvi = vidljivi[0], zadnji = vidljivi[vidljivi.length - 1];
    if (e.shiftKey && document.activeElement === prvi) { e.preventDefault(); zadnji.focus(); }
    else if (!e.shiftKey && document.activeElement === zadnji) { e.preventDefault(); prvi.focus(); }
  });

  window.addEventListener('resize', function () {
    if (!zatvoren) postaviVozilo();
  });

  try {
    pokreniSekvencu();
  } catch (greska) {
    /* bilo šta da je puklo u sceni — sajt mora da se vidi */
    if (window.console && console.warn) console.warn('Intro scena nije pokrenuta:', greska);
    ugasiIntroOdmah();
  }

  /* =======================================================
     5. NAVIGACIJA
     ======================================================= */
  var meni = document.getElementById('meni');
  var meniTaster = document.getElementById('meniTaster');
  var meniTekst = document.getElementById('meniTekst');

  meniTaster.addEventListener('click', function () {
    var otvoren = meni.classList.toggle('je-otvoren');
    meniTaster.setAttribute('aria-expanded', String(otvoren));
    meniTekst.textContent = otvoren ? 'Zatvori' : 'Meni';
  });

  meni.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      meni.classList.remove('je-otvoren');
      meniTaster.setAttribute('aria-expanded', 'false');
      meniTekst.textContent = 'Meni';
    }
  });

  /* aktivna stavka menija */
  var sekcije = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var linkovi = {};
  Array.prototype.forEach.call(meni.querySelectorAll('a[href^="#"]'), function (a) {
    linkovi[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window) {
    var posmatracSekcija = new IntersectionObserver(function (unosi) {
      unosi.forEach(function (u) {
        var a = linkovi[u.target.id];
        if (!a) return;
        if (u.isIntersecting) {
          Object.keys(linkovi).forEach(function (k) { linkovi[k].removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sekcije.forEach(function (s) { posmatracSekcija.observe(s); });
  }

  /* =======================================================
     6. SKROL: traka napretka + otkrivanje sekcija
     ======================================================= */
  var napredak = document.getElementById('trakaNapredak');
  var tikuje = false;

  function naSkrol() {
    var visina = document.documentElement.scrollHeight - window.innerHeight;
    var udeo = visina > 0 ? (window.scrollY / visina) * 100 : 0;
    napredak.style.height = udeo + '%';
    tikuje = false;
  }
  window.addEventListener('scroll', function () {
    if (!tikuje) { tikuje = true; window.requestAnimationFrame(naSkrol); }
  }, { passive: true });
  naSkrol();

  var zaOtkrivanje = document.querySelectorAll('.otkrij');

  function prikaziSve() {
    Array.prototype.forEach.call(zaOtkrivanje, function (el) { el.classList.add('je-vidljiv'); });
    var t = document.getElementById('tabla');
    if (t) pokreniBrojace(t);
  }

  try {
  if ('IntersectionObserver' in window) {
    var posmatrac = new IntersectionObserver(function (unosi, self) {
      unosi.forEach(function (u) {
        if (!u.isIntersecting) return;
        u.target.classList.add('je-vidljiv');
        if (u.target.id === 'tabla') pokreniBrojace(u.target);
        self.unobserve(u.target);
      });
    }, { threshold: 0.18 });
    Array.prototype.forEach.call(zaOtkrivanje, function (el) { posmatrac.observe(el); });
  } else {
    prikaziSve();
  }
  } catch (greska) {
    /* bez posmatrača nema animacije, ali sadržaj mora da se vidi */
    prikaziSve();
  }

  /* brojači na instrument tabli */
  function pokreniBrojace(tabla) {
    Array.prototype.forEach.call(tabla.querySelectorAll('.merac__skala i'), function (i) {
      i.style.width = i.dataset.udeo + '%';
    });
    Array.prototype.forEach.call(tabla.querySelectorAll('.merac__broj'), function (el) {
      var cilj = parseInt(el.dataset.cilj, 10);
      if (isNaN(cilj)) return;              /* polje sa tekstom umesto broja */
      var sufiks = el.querySelector('small');
      if (manjeAnimacije) { el.firstChild.nodeValue = cilj; return; }
      var pocetak = null, trajanje = 1400;
      function korak(t) {
        if (!pocetak) pocetak = t;
        var p = Math.min((t - pocetak) / trajanje, 1);
        var vrednost = Math.round(cilj * (1 - Math.pow(1 - p, 3)));
        el.firstChild.nodeValue = vrednost;
        if (p < 1) requestAnimationFrame(korak);
      }
      el.textContent = '0';
      if (sufiks) el.appendChild(sufiks);
      requestAnimationFrame(korak);
    });
  }

  /* =======================================================
     7. KATEGORIJE
     Podaci A, B i C preuzeti su sa autoskoladule.rs.
     Ostale kategorije nose jasno označen placeholder.
     ======================================================= */
  var KATEGORIJE = {
    /* Opisi, uslovi i broj časova preuzeti sa autoskoladule.rs */
    AM: {
      naslov: 'AM kategorija',
      opis: 'Moped do 49 cm³. Obuka se vrši na skuteru iz voznog parka škole, marke YIYING BENZHOU 50 ccm. Škola obezbeđuje kacigu svih veličina i bluetooth vezu sa instruktorom.',
      uslovi: ['Upis sa 15 godina, praktični ispit sa navršenih 16',
               'Lična karta obavezna tokom cele obuke'],
      obuka: ['Bez vozačke dozvole — 40 časova teorije, test, 7 časova vožnje, ispit',
              'Sa B kategorijom — 7 časova teorije, test, 7 časova vožnje, ispit']
    },
    A1: {
      naslov: 'A1 kategorija',
      opis: 'Motocikli radne zapremine do 125 cm³ i snage do 11 kW. Po propisu se obuka vrši na motociklu od najmanje 120 cm³ i konstruktivne brzine 90 km/h. Vozilo škole je XINYUAN 125 ccm, uz kacigu, potkapu i bluetooth vezu.',
      uslovi: ['Upis sa 15 godina, praktični ispit sa navršenih 16',
               'Lična karta obavezna tokom cele obuke'],
      obuka: ['Bez vozačke dozvole — 40 časova teorije, test, 20 časova vožnje, ispit',
              'Sa B kategorijom — 7 časova teorije, test, 20 časova vožnje, ispit',
              'Sa AM kategorijom — test, 7 časova vožnje, ispit']
    },
    A2: {
      naslov: 'A2 kategorija',
      opis: 'Motocikli snage do 35 kW — uključujući i one preko 600 cm³, ako ne prelaze tu snagu. Obuka ide isključivo na motociklu auto škole, ne na sopstvenom. Vozilo je PIAGGIO BEVERLY 500 sa automatskim menjačem.',
      uslovi: ['Upis sa 17 godina, praktični ispit sa navršenih 18',
               'Vozilo za obuku mora imati najmanje 400 cm³ i 25 kW',
               'Lična karta obavezna tokom cele obuke'],
      obuka: ['Bez vozačke dozvole — 40 časova teorije, test, 30 časova vožnje, ispit',
              'Sa B kategorijom — 7 časova teorije, test, 30 časova vožnje, ispit',
              'Sa AM kategorijom — test, 14 časova vožnje, ispit',
              'Sa A1 kategorijom — test, 7 časova vožnje, ispit']
    },
    A: {
      naslov: 'A kategorija',
      opis: 'Motocikli i teški tricikli snage veće od 15 kW. Obuka se po novom pravilniku ne može obavljati na sopstvenom motoru — koristi se isključivo vozilo auto škole, sa motorom od najmanje 600 cm³ i 40 kW. Vozilo škole je SUZUKI BURGMAN 650.',
      uslovi: ['Upis sa 23 godine, praktični ispit sa navršene 24',
               'Ispit i pre 24. godine, ako kandidat ima A2 kategoriju najmanje 2 godine',
               'Lična karta obavezna tokom cele obuke'],
      obuka: ['Bez vozačke dozvole — 40 časova teorije, test, 40 časova vožnje, ispit',
              'Sa B kategorijom — 7 časova teorije, test, 40 časova vožnje, ispit',
              'Sa AM kategorijom — test, 20 časova vožnje, ispit',
              'Sa A1 kategorijom — test, 14 časova vožnje, ispit',
              'Sa A2 kategorijom — test, 7 časova vožnje, ispit']
    },
    B: {
      naslov: 'B kategorija',
      opis: 'Putnički automobil do 3.500 kg. Teorijska nastava se drži u učionicama opremljenim računarima, na kojima kandidati vežbaju ispitna pitanja. Nastava ide u dve grupe — prepodnevnoj i popodnevnoj.',
      uslovi: ['Lična karta obavezna tokom cele obuke',
               'Lekarsko uverenje pre početka praktične obuke',
               'Čas traje 45 minuta, najviše 3 časa teorije dnevno'],
      obuka: ['Bez prethodne kategorije — 40 časova teorije i 40 časova vožnje',
              'Sa već položenom kategorijom — 7 časova teorije',
              'Posle teorije se polaže test, pa praktični ispit']
    },
    BE: {
      naslov: 'BE kategorija',
      opis: 'Skup vozila čije vučno vozilo pripada kategoriji B, a priključno vozilo ima najveću dozvoljenu masu veću od 750 kg, a ne veću od 3.500 kg.',
      uslovi: ['Najmanje 21 godina',
               'Vozačka dozvola B kategorije',
               'Lična karta i lekarsko uverenje'],
      obuka: ['7 časova praktične obuke',
              'Polaže se praktični ispit']
    },
    C: {
      naslov: 'C kategorija',
      opis: 'Teretna vozila najveće dozvoljene mase preko 12.000 kg, duža od 8 m, šira od 2,4 m, konstruktivne brzine veće od 80 km/h, sa zatvorenim tovarnim sandukom.',
      uslovi: ['Upis sa 20 godina, praktični ispit sa navršene 21',
               'Vozačka dozvola B kategorije, koja ne sme biti probna'],
      obuka: ['7 časova teorijske nastave',
              'polaganje testa',
              '15 časova praktične obuke',
              'polaganje vožnje']
    },
    CE: {
      naslov: 'CE kategorija',
      opis: 'Teretno vozilo sa priključnim vozilom — skup preko 12.000 kg, sa zatvorenim tovarnim sandukom, gde priključno vozilo ima najmanje 7,5 m dužine.',
      uslovi: ['Vozačka dozvola C kategorije'],
      obuka: ['7 časova teorijske nastave',
              'Polaže se praktični deo']
    }
  };

  var panel = document.getElementById('panelKat');
  var tabovi = Array.prototype.slice.call(document.querySelectorAll('.kat'));

  function stavke(niz) {
    return niz.map(function (s) { return '<li>' + s + '</li>'; }).join('');
  }

  function prikaziKategoriju(kljuc, fokusiraj) {
    var k = KATEGORIJE[kljuc];
    if (!k) return;
    tabovi.forEach(function (t) {
      var aktivan = t.dataset.kat === kljuc;
      t.setAttribute('aria-selected', String(aktivan));
      t.tabIndex = aktivan ? 0 : -1;
      if (aktivan) {
        panel.setAttribute('aria-labelledby', t.id);
        if (fokusiraj) t.focus();
      }
    });
    panel.innerHTML =
      '<h3>' + k.naslov + '</h3>' +
      '<p class="uvod">' + k.opis + '</p>' +
      '<div class="kat-panel__mreza">' +
        '<div><h4>Uslovi</h4><ul>' + stavke(k.uslovi) + '</ul></div>' +
        '<div><h4>Trajanje obuke</h4><ul>' + stavke(k.obuka) + '</ul></div>' +
      '</div>' +
      '<p style="margin-top:1.75rem"><a class="dugme dugme--puno" href="#upis">Upiši ' +
        kljuc + ' kategoriju <span class="strelica" aria-hidden="true">&rarr;</span></a></p>';
  }

  tabovi.forEach(function (t, indeks) {
    t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
    t.addEventListener('click', function () { prikaziKategoriju(t.dataset.kat, false); });
    t.addEventListener('keydown', function (e) {
      var pomeraj = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!pomeraj) return;
      e.preventDefault();
      var sledeci = tabovi[(indeks + pomeraj + tabovi.length) % tabovi.length];
      prikaziKategoriju(sledeci.dataset.kat, true);
    });
  });

  prikaziKategoriju('A', false);

  /* =======================================================
     8. FORMA — bez backenda, samo osnovna provera
     ======================================================= */
  var forma = document.getElementById('formaKontakt');
  var status = document.getElementById('statusForme');
  forma.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!forma.checkValidity()) {
      status.textContent = 'Popuni ime, telefon i poruku pa pokušaj ponovo.';
      var prvo = forma.querySelector(':invalid');
      if (prvo) prvo.focus();
      return;
    }
    /* Dok forma nije povezana sa serverom, poruka se sastavlja kao mejl
       i otvara u programu za poštu koji korisnik već koristi. */
    var uzmi = function (ime) {
      var p = forma.querySelector('[name="' + ime + '"]');
      return p ? p.value.trim() : '';
    };
    var telo =
      'Ime i prezime: ' + uzmi('ime') + '\n' +
      'Telefon: ' + uzmi('telefon') + '\n' +
      'Mejl: ' + uzmi('email') + '\n' +
      'Lokacija: ' + uzmi('lokacija') + '\n\n' +
      'Poruka:\n' + uzmi('poruka');

    window.location.href = 'mailto:autoskoladule@gmail.com'
      + '?subject=' + encodeURIComponent('Upit sa sajta — ' + (uzmi('ime') || 'novi upit'))
      + '&body=' + encodeURIComponent(telo);

    status.textContent = 'Otvara se tvoj program za poštu sa popunjenom porukom. '
      + 'Ako se ne otvori, piši nam na autoskoladule@gmail.com ili pozovi 060 6 037 037.';
  });

  /* =======================================================
     9. LOKACIJE — prava mapa se učitava tek na klik
     Time se Google embed ne poziva pri svakom učitavanju
     stranice, nego samo kad korisnik to zatraži.
     ======================================================= */
  Array.prototype.forEach.call(document.querySelectorAll('[data-mapa]'), function (dugme) {
    dugme.addEventListener('click', function () {
      var mapa = document.getElementById(dugme.dataset.mapa);
      if (!mapa) return;

      var okvir = mapa.querySelector('iframe');
      if (!okvir) {
        okvir = document.createElement('iframe');
        okvir.src = mapa.dataset.embed;
        okvir.loading = 'lazy';
        okvir.title = 'Google mapa — ' + (mapa.id.indexOf('varvarin') > -1 ? 'Varvarin' : 'Kruševac');
        okvir.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        mapa.appendChild(okvir);
        mapa.classList.add('mapa--stvarna');
        dugme.textContent = 'Prikaži ilustraciju';
        return;
      }

      var stvarna = mapa.classList.toggle('mapa--stvarna');
      okvir.style.display = stvarna ? '' : 'none';
      dugme.textContent = stvarna ? 'Prikaži ilustraciju' : 'Prikaži pravu mapu';
    });
  });

  /* godina u podnožju */
  document.getElementById('godina').textContent = new Date().getFullYear();
})();
