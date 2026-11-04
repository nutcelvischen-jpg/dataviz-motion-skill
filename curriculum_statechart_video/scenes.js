// scenes.js — 《從大模型認知到打造 Tableau-like 儀表板》
// SCENES[n] = { bg($) static, fg($, S) every frame }. Units: poster is 1000 x 1333.
const after = (S, k) => S.step > k || (S.step === k && S.t > .9);
const grow = (S, k, d = 1.2) => S.step > k ? 1 : S.step === k ? Math.max(0, Math.min(1, (S.t - .6) / d)) : 0;

/* ------------------------------------------------------------------ I 大語言模型認知篇 */
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
    $.laptop(280, 500, .75, { t: T, typing: S.on('token') || S.on('agent') });
    $.bulb(160, 320, .8, T, S.on('rag') || S.on('tool'));

    // Server & Agent
    $.server(920, 1280, .75, { t: T, busy: S.on('tool') || S.on('agent'), units: 3 });
    $.who('student', 'stand', 780, 1280, .78, -1, { t: T, arms: S.on('agent') ? 'wave' : 'hold' });
  }
};

/* ------------------------------------------------------------------ II 日本官方真實數據源 */
SCENES[2] = {
  bg($) {
    $.building(900, 1280, 160, 520, { color: 'sky', sign: 'e-Stat 統計局' });
    $.ground(30, 780, 1280, 8, 'g2');
    $.shelf(40, 520, 150, 3, { rowH: 45 });
  },
  fg($, S) {
    const T = S.T;
    $.sun(890, 90, 32, T);
    $.tower(120, 320, .75, T, S.on('list_api') || S.on('data_api'));

    // Officer / Engineer retrieving data
    const dev = $.pose.stand(240, 1280, .82, 1, { t: T, arms: 'phone' });
    $.person(dev, { ...$.K.outfits.office, t: T });
    $.phone(dev.haF[0] + 6, dev.haF[1] + 2, .42, { screen: 'order', text: 'e-Stat API', t: T, badge: '47', pop: 1 });

    // Database cache storage
    $.server(680, 1280, .8, { t: T, busy: S.on('cache'), units: 4 });
  }
};

/* ------------------------------------------------------------------ III 分析師 5 階段生產線 */
SCENES[3] = {
  bg($) {
    $.ground(20, 950, 1280, 8, 'g3');
    $.counter(40, 480, 960, 65, { sign: 'SOP 產線' });
    $.ground(520, 920, 960, 6, 'g3b');
  },
  fg($, S) {
    const T = S.T;
    $.sun(910, 90, 32, T);

    // Analyst conducting clean & verification
    const analyst = $.pose.stand(200, 960, .82, 1, { t: T, arms: S.on('cleaned') ? 'stir' : 'point' });
    $.person(analyst, { ...$.K.outfits.student, glasses: true, t: T });

    // Senior reviewer checking cross-check
    const reviewer = $.pose.stand(750, 960, .82, -1, { t: T, arms: S.on('verified') ? 'up' : 'hold' });
    $.person(reviewer, { ...$.K.outfits.office, t: T, talk: S.on('report') ? T : 0 });

    // Certificate / Report star
    if (S.on('report')) {
      $.sparkle(750, 680, 28, T);
    }
    $.magnifier(340, 940, .8, T);
  }
};

/* ------------------------------------------------------------------ IV Data Atoms 互動儀表板 */
SCENES[4] = {
  bg($) {
    $.ground(30, 950, 1280, 8, 'g4');
    $.table(280, 950, 180, 65, 'tan');
    $.shelf(820, 560, 140, 2, { rowH: 50 });
  },
  fg($, S) {
    const T = S.T;
    $.sun(910, 92, 34, T);

    // Big interactive display board
    $.laptop(360, 950, .85, { t: T, typing: true });

    // Joyful user exploring dashboard
    const user = $.pose.stand(180, 1280, .82, 1, { t: T, arms: S.on('filter') ? 'wave' : 'point' });
    $.person(user, { ...$.K.outfits.customer, t: T });

    $.gear(820, 1280, .8, T);
    if (S.on('export')) {
      $.sparkle(820, 1100, 26, T);
    }
  }
};

/* ------------------------------------------------------------------ V 自學導師與避坑守則 */
SCENES[5] = {
  bg($) {
    $.ground(30, 950, 1280, 8, 'g5');
    $.building(880, 1280, 180, 480, { color: 'mint', sign: 'DeepTutor' });
  },
  fg($, S) {
    const T = S.T;
    $.sun(910, 90, 32, T);

    // Warning barrier on the bad path
    if (S.on('blind') || S.on('nan_bug') || S.on('hallucinate')) {
      $.trafficLight(260, 1280, .8, 'red');
    }

    // DeepTutor mentor guiding student
    const mentor = $.pose.stand(680, 1280, .84, -1, { t: T, arms: 'point' });
    $.person(mentor, { ...$.K.outfits.doctor, glasses: true, t: T, talk: S.on('deeptutor') ? T : 0 });

    const student = $.pose.stand(520, 1280, .8, 1, { t: T, arms: S.on('mastery') ? 'up' : 'hold' });
    $.person(student, { ...$.K.outfits.student, t: T });

    if (S.on('mastery')) {
      $.sparkle(520, 980, 32, T);
    }
  }
};
