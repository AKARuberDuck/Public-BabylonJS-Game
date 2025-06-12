window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  let scene, player, goalZone, score = 0, timer, gameTime, ws;

  let scoreEl = document.getElementById("score");
  let timeEl = document.getElementById("time");
  let finalScoreEl = document.getElementById("finalScore");
  let playersEl = document.getElementById("players");
  let nameOverlay = document.getElementById("nameOverlay");

  function createScene() {
    scene = new BABYLON.Scene(engine);
    scene.enablePhysics();
    // 🎶 Background Music
const music = new BABYLON.Sound(
  "backgroundMusic",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  scene,
  null,
  {
    loop: true,
    autoplay: true,
    volume: 0.3
  }
);
    scene.gravity = new BABYLON.Vector3(0, -0.5, 0);

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2.5, Math.PI / 2.7, 30, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // ✅ Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
      width: 20, height: 20, subdivisions: 50
    }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/ground.jpg", scene);
    groundMat.diffuseTexture.uScale = 4;
    groundMat.diffuseTexture.vScale = 4;
    ground.material = groundMat;
    ground.checkCollisions = true;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    // 🧍 Player
    player = BABYLON.MeshBuilder.CreateSphere("player", { diameter: 2 }, scene);
    player.position = new BABYLON.Vector3(0, 5, 0);
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.SphereImpostor, {
      mass: 1, restitution: 0.2
    }, scene);

    // 🎯 Goal zone
    goalZone = BABYLON.MeshBuilder.CreateDisc("goal", { radius: 2, tessellation: 32 }, scene);
    goalZone.rotation.x = Math.PI / 2;
    goalZone.position = new BABYLON.Vector3(6, 0.05, -6);
    const goalMat = new BABYLON.StandardMaterial("goalMat", scene);
    goalMat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);
    goalZone.material = goalMat;

    // 🎮 Input
    const input = { up: false, down: false, left: false, right: false };
    window.addEventListener("keydown", e => {
      if (e.code === "ArrowUp") input.up = true;
      if (e.code === "ArrowDown") input.down = true;
      if (e.code === "ArrowLeft") input.left = true;
      if (e.code === "ArrowRight") input.right = true;
      if (e.code === "Space" && !timer) startGame();
    });
    window.addEventListener("keyup", e => {
      if (e.code === "ArrowUp") input.up = false;
      if (e.code === "ArrowDown") input.down = false;
      if (e.code === "ArrowLeft") input.left = false;
      if (e.code === "ArrowRight") input.right = false;
    });

    // 🔁 Game loop
    scene.onBeforeRenderObservable.add(() => {
      if (timer) {
        const force = 3;
        let direction = new BABYLON.Vector3(
          (input.right ? 1 : 0) - (input.left ? 1 : 0),
          0,
          (input.down ? 1 : 0) - (input.up ? 1 : 0)
        );
        if (!direction.equals(BABYLON.Vector3.Zero())) {
          player.physicsImpostor.applyImpulse(direction.normalize().scale(force), player.getAbsolutePosition());
        }

        // 🎯 Scoring on overlap
        const dist = BABYLON.Vector3.Distance(player.position, goalZone.position);
        if (dist < 2.5) {
          score++;
          scoreEl.textContent = score;
          player.position = new BABYLON.Vector3(0, 5, 0); // reset
        }
      }
    });
  }

  function startGame() {
    score = 0;
    scoreEl.textContent = score;
    gameTime = parseInt(document.getElementById("gameTime").value) || 30;
    timeEl.textContent = gameTime;
    nameOverlay.style.display = "none";
    document.getElementById("scoreboard").style.display = "none";
    player.position = new BABYLON.Vector3(0, 5, 0);

    clearInterval(timer);
    timer = setInterval(() => {
      gameTime--;
      timeEl.textContent = gameTime;
      if (gameTime <= 0) {
        clearInterval(timer);
        timer = null;
        finalScoreEl.textContent = score;
        document.getElementById("scoreboard").style.display = "block";
      }
    }, 1000);
  }

  createScene();
  engine.runRenderLoop(() => scene.render());

  // 🌐 Multiplayer counter
  ws = new WebSocket("wss://public-babylonjs-game.onrender.com");
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === "players") {
      playersEl.textContent = data.count;
    }
  };

  // 🕹️ Expose startGame globally for button
  window.startGame = startGame;
});
    player.position = new BABYLON.Vector3(0, 5, 0);
  }

  createScene();
  engine.runRenderLoop(() => {
    scene.render();
  });

  // 🌐 Multiplayer connection
  ws = new WebSocket("wss://public-babylonjs-game.onrender.com");
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === "players") {
      playersEl.textContent = data.count;
    }
  };

  // 🟢 Attach startGame to window for HTML button
  window.startGame = startGame;
});
