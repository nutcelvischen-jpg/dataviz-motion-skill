// scenes.js — 《Antigravity 實作工作坊：從大模型到動態數據影音》
// SCENES[n] = { bg($) static, fg($, S) every frame }. Units: poster is 1000 x 1333.
const after = (S, k) => S.step > k || (S.step === k && S.t > .9);
const grow = (S, k, d = 1.2) => S.step > k ? 1 : S.step === k ? Math.max(0, Math.min(1, (S.t - .6) / d)) : 0;

/* ------------------------------------------------------------------ I 大語言模型與 Agent AI */
SCENES[1] = {
  bg($) {
    $.ground(20, 360, 560, 8, 'g1');
    $.table(280, 500, 110, 60, 'tan');
    $.shelf(30, 780, 140, 2, { rowH: 50 });
    $.ground(20, 380, 1280, 6, 'g1b');
  },
  fg($, S) {
    const T = S.T;
    $.sun(905, 95, 34, T);
    $.cloud(850 + Math.sin(T * .3) * 16, 220, 120, 50, { fill: 'white', hatch: 'sky' });

    // Coder at desk asking LLM
    const coder = $.pose.stand(160, 560, .82, 1, { t: T, arms: S.on('prompt') ? 'wave' : 'type' });
    $.person(coder, { ...$.K.outfits.coder, glasses: true, t: T, talk: S.on('prompt') ? T : 0 });
    $.laptop(280, 500, .75, { t: T, typing: S.on('chat') || S.on('loop') });
    $.bulb(160, 320, .8, T, S.on('agent') || S.on('loop'));

    // Server & Agent buddy
    $.server(920, 1280, .75, { t: T, busy: S.on('agent') || S.on('loop'), units: 3 });
    $.who('student', 'stand', 780, 1280, .78, -1, { t: T, arms: S.on('loop') ? 'wave' : 'hold' });
    if (S.on('limit')) {
      $.cross(480, 500, 32, 'red');
    }
  }
};

/* ------------------------------------------------------------------ II 認識 Antigravity 與 Harness */
SCENES[2] = {
  bg($) {
    $.ground(30, 950, 1280, 8, 'g2');
    $.table(260, 950, 180, 65, 'tan');
    $.building(880, 1280, 180, 480, { color: 'sky', sign: 'Harness 座艙' });
  },
  fg($, S) {
    const T = S.T;
    $.sun(890, 90, 32, T);
    $.tower(120, 320, .75, T, S.on('terminal') || S.on('skills'));

    // Professional developer in cockpit
    const dev = $.pose.stand(180, 950, .84, 1, { t: T, arms: S.on('pairing') ? 'wave' : 'type' });
    $.person(dev, { ...$.K.outfits.coder, glasses: true, t: T, talk: S.on('pairing') ? T : 0 });
    $.laptop(320, 950, .85, { t: T, typing: true });

    // Modular skills server rack
    $.server(680, 1280, .85, { t: T, busy: S.on('skills') || S.on('pairing'), units: 4 });
    $.gear(820, 1280, .8, T);
    if (S.on('pairing')) {
      $.sparkle(320, 780, 32, T);
    }
  }
};

/* ------------------------------------------------------------------ III 打造 Tableau-like 儀表板 */
SCENES[3] = {
  bg($) {
    $.ground(20, 950, 1280, 8, 'g3');
    $.counter(40, 480, 960, 65, { sign: 'Data Atoms' });
    $.shelf(820, 560, 140, 2, { rowH: 50 });
  },
  fg($, S) {
    const T = S.T;
    $.sun(910, 90, 32, T);

    // Analyst exploring Tableau-like dashboard
    const analyst = $.pose.stand(200, 960, .82, 1, { t: T, arms: S.on('shelves') ? 'stir' : 'point' });
    $.person(analyst, { ...$.K.outfits.student, glasses: true, t: T });

    // Reviewer verifying interactive links
    const reviewer = $.pose.stand(750, 960, .82, -1, { t: T, arms: S.on('explore') ? 'up' : 'hold' });
    $.person(reviewer, { ...$.K.outfits.office, t: T, talk: S.on('explore') ? T : 0 });

    $.magnifier(340, 940, .8, T);
    if (S.on('atoms') || S.on('explore')) {
      $.sparkle(750, 680, 28, T);
    }
  }
};

/* ------------------------------------------------------------------ IV Presentation 與動態影音輸出 */
SCENES[4] = {
  bg($) {
    $.ground(30, 950, 1280, 8, 'g4');
    $.table(280, 950, 180, 65, 'tan');
    $.building(880, 1280, 180, 480, { color: 'mint', sign: '成果發表' });
  },
  fg($, S) {
    const T = S.T;
    $.sun(910, 92, 34, T);

    // Presenter pitching to audience
    const presenter = $.pose.stand(180, 950, .85, 1, { t: T, arms: S.on('video') ? 'up' : 'point' });
    $.person(presenter, { ...$.K.outfits.office, t: T, talk: T });

    // Video display and gears
    $.laptop(360, 950, .85, { t: T, typing: true });
    $.gear(820, 1280, .8, T);

    const audience = $.pose.stand(680, 1280, .82, -1, { t: T, arms: S.on('success') ? 'up' : 'hold' });
    $.person(audience, { ...$.K.outfits.customer, t: T });

    if (S.on('video') || S.on('success')) {
      $.sparkle(520, 980, 36, T);
      $.sparkle(820, 1100, 30, T);
    }
  }
};
