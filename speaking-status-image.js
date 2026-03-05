let speakingSocket

Hooks.once("socketlib.ready", () => {
  function speak(userId, speaking) {
	  
	if (!canvas.scene?.getFlag("speaking-status-image", "enabled")) return;
	
    let user = game.users.get(userId);
    const tokens = (user.character?.getActiveTokens?.() ?? []).filter(t => {
  		const tokenDoc = t.document ?? t;
  		return tokenDoc.isOwner; // only tokens this client can update
	});
	
	const basePath = `worlds/${game.world.id}/speaking-status-image/${user.id}/tokens`;
	
	const IDLE_IMG = `${basePath}/idle.jpg`;
	const CHAT_IMG = `${basePath}/chat.jpg`;
	
    Hooks.call('changeSpeakingStatus', user, speaking)
    tokens.forEach(t => {
    const tokenDoc = t.document ?? t;
    const newImg = speaking ? CHAT_IMG : IDLE_IMG;

    // Only update if the image actually needs to change
    if (tokenDoc.texture.src !== newImg) {
      tokenDoc.update({
        "texture.src": newImg
      });
    }
  });
  }
  speakingSocket = socketlib.registerModule("speaking-status-image");
  speakingSocket.register("speak", speak);
  speakingSocket.emit = function(userId, speaking) { speakingSocket.executeForEveryone(speak, userId, speaking); }
});

Hooks.on('ready',()=>{
  game.user.speaking = false;
  game.user.speakingThreshold = game.settings.get('speaking-status-image', 'threshold')
  startMicrophoneMonitor()
});

startMicrophoneMonitor = function () {
  // Stop any previous run
  try { game.audio.stopLevelReports("speaking-status-image"); } catch (e) {}
  if (game.user._speakingWatchdog) clearInterval(game.user._speakingWatchdog);
  game.user._speakingWatchdog = null;

  game.user.speaking = false;

  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
    const SAMPLE_MS = 50;

    // Tuning (works well in practice)
    const HYST_DB = 8;          // OFF threshold = ON - HYST_DB
    const MIN_ON_MS = 250;      // don't allow OFF immediately after ON
    const HANGOVER_MS = 700;    // must be quiet this long to turn OFF
    const NO_REPORT_OFF_MS = 1500;

    // Smoothing: higher = smoother (less mid-sentence drop), lower = snappier
    const EMA_ALPHA = 0.25;

    let emaDb = -120;
    let lastReportTime = Date.now();

    let speakingSince = 0; // timestamp when we turned ON
    let quietSince = 0;    // timestamp when we first went below OFF

    function thresholds() {
      const onDb = Number(game.user.speakingThreshold ?? -55);
      return { onDb, offDb: onDb - HYST_DB };
    }

    function setSpeaking(val) {
      if (game.user.speaking === val) return;
      game.user.speaking = val;
      speakingSocket?.emit?.(game.user.id, val);
    }

    // Watchdog: if reports stop, force idle
    game.user._speakingWatchdog = setInterval(() => {
      if (!game.user.speaking) return;
      if (Date.now() - lastReportTime > NO_REPORT_OFF_MS) setSpeaking(false);
    }, 250);

    game.audio.startLevelReports("speaking-status-image", stream, (db) => {
      lastReportTime = Date.now();
      if (!Number.isFinite(db)) db = -120;

      // Smooth the db so syllable dips don't flip state
      emaDb = (EMA_ALPHA * db) + ((1 - EMA_ALPHA) * emaDb);

      const now = Date.now();
      const { onDb, offDb } = thresholds();

      if (!game.user.speaking) {
        // Turn ON when smoothed level crosses ON threshold
        if (emaDb > onDb) {
          speakingSince = now;
          quietSince = 0;
          setSpeaking(true);
        }
      } else {
        // Don't turn OFF too soon
        if (now - speakingSince < MIN_ON_MS) return;

        // Start/clear quiet timer based on OFF threshold
        if (emaDb < offDb) {
          if (!quietSince) quietSince = now;
        } else {
          quietSince = 0;
        }

        // Turn OFF only after sustained quiet (hangover)
        if (quietSince && (now - quietSince) > HANGOVER_MS) {
          setSpeaking(false);
          quietSince = 0;
        }
      }

      // Optional: drive your UI meter if you want
      const level = Math.max(0, Math.min(100, ((emaDb + 120) / 120) * 100));
      $("#speaking-level").css({ width: `${level}%` });

    }, SAMPLE_MS);
  }).catch(err => {
    console.error("Microphone permission/stream error:", err);
  });
};

stopMicrophoneMonitor = function () {
  speakingSocket.emit(game.user.id, false);
  game.audio.stopLevelReports("speaking-status-image");

  if (game.user._speakingWatchdog) {
    clearInterval(game.user._speakingWatchdog);
    game.user._speakingWatchdog = null;
  }
};

cleanSpeakingMarkers = function () {
  $(`#player-list > li span:first-child`).css({outline: 'unset'});
  $('#hud').find(`div.speaking-token-marker`).remove(); 
  $(`#token-action-bar li`).css({outline: 'unset'});
}

Hooks.on('refreshToken', (t)=>{
	if (t.isPreview) return;
  $(`#hud > div.speaking-token-marker.${t.id}`).css({ top: `${t.y}px`, left: `${t.x}px`});
});

Hooks.once("init", async () => {
  game.settings.register('speaking-status-image', 'threshold', {
    name: `Speaking Threshold`,
    hint: `In dB. Somewhere between -50 and -60 generally works best.`,
    scope: "client",
    config: true,
    type: Number,
    default: -55,
    requiresReload: false,
    onChange: (value)=>{game.user.speakingThreshold = value}
  });
  game.settings.register('speaking-status-image', 'token', {
    name: `Show Token Indicator`,
    hint: `Tokens for the speaking user's assigned actor will have border shown when speaking`,
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    requiresReload: false,
    onChange: (value)=>{}
  });
  game.settings.register('speaking-status-image', 'round', {
    name: `Round Token Indicator`,
    hint: `Border around token will be round if checked`,
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    requiresReload: false,
    onChange: (value)=>{}
  });
});

Hooks.on('renderSettingsConfig', (app, html, options)=>{
  let input = html.find('input[name="speaking-status-image.threshold"]')
  input.parent().next().prepend(`
  <input type="range" min="-120" max="0" value="0" class="slider" id="speaking-threshold">
  `)

  input.parent().next().prepend(`
  <div style="background: grey; height: 20px; width: 100%">
  <div id="speaking-level" style="background: white; height: 100%;"></div>
  </div>
  `)

  html.find('#speaking-threshold').val(+input.val())
  html.find('#speaking-threshold').change(function(){
    input.val(this.value)
    game.user.speakingThreshold = this.value;
  })
});

Hooks.on("renderSceneConfig", (app, html) => {
  const $html = html?.find ? html : $(html);
  const scene = app.document;
  console.log("renderSceneConfig fired", { app, html, scene });

  if (!scene) return;

  const scope = "speaking-status-image";
  const enabled = scene.getFlag(scope, "enabled") ?? false;

  const block = `
    <div class="form-group">
      <label>Enable Speaking Token Images</label>
      <div class="form-fields">
        <input type="checkbox" name="flags.${scope}.enabled" ${enabled ? "checked" : ""}>
      </div>
      <p class="hint">If enabled, idle/chat token swapping runs on this scene.</p>
    </div>
  `;

  // In V12, html is often the <form>. Make sure we target the form.
  const $form = $html.is("form") ? $html : $html.find("form");

  // Insert somewhere guaranteed: right after the Scene Name field
  const $nameGroup = $form.find('input[name="name"]').closest(".form-group");

  if ($nameGroup.length) $nameGroup.after(block);
  else $form.append(block);
});
