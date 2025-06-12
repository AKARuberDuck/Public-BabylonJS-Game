window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);

  let scene, player, score = 0, timer, gameTime, ws;
  let scoreEl = document.getElementById("score");
  let timeEl = document.getElementById("time");
  let finalScoreEl = document.getElementById("finalScore");
  let playersEl = document.getElementById("players");
  let nameOverlay = document.getElementById("nameOverlay");

  function createScene() {
    scene = new BABYLON.Scene(engine);
    scene.gravity = new BABYLON.Vector3(0, -0.5, 0);
    scene.collisionsEnabled = true;
    scene.enablePhysics();

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 4, Math.PI / 4, 30, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // ✅ Ground with Babylon-hosted texture
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
      width: 20,
      height: 20,
      subdivisions: 50
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
    player.position.y = 5;
    player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.SphereImpostor, {
      mass: 1,
      restitution: 0.1
    }, scene);

    // 🎯 Goal zone
    const goal = BABYLON.MeshBuilder.CreateDisc("goal", { radius: 2, tessellation: 32 }, scene);
    goal.position = new BABYLON.Vector3(8, 0.05, 8);
    goal.rotation.x = Math.PI / 2;
    goal.material = new BABYLON.StandardMaterial("goalMat", scene);
    goal.material.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);

    // 🎮 Input
    const input = { up: false, down: false, left: false, right: false };
    window.addEventListener("keydown", (e) => {
      if (e.code === "ArrowUp") input.up = true;
      if (e.code === "ArrowDown") input.down = true;
      if (e.code === "ArrowLeft") input.left = true;
      if (e.code === "ArrowRight") input.right = true;
      if (e.code === "Space" && !timer) startGame();
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowUp") input.up = false;
      if (e.code === "ArrowDown") input.down = false;
      if (e.code === "ArrowLeft") input.left = false;
      if (e.code === "ArrowRight") input.right = false;
    });

    // 🔁 Game Loop
    scene.onBeforeRenderObservable.add(() => {
      if (timer) {
        const force = 3;
        let dir = BABYLON.Vector3.Zero();
        if (input.up) dir.z -= 1;
        if (input.down) dir.z += 1;
        if (input.left) dir.x -= 1;
        if (input.right) dir.x += 1;
        player.physicsImpostor.applyImpulse(dir.normalize().scale(force), player.getAbsolutePosition());
      }
    });
  }

  function startGame() {
    score = 0;
    scoreEl.textContent = score;
    gameTime = parseInt(document.getElementById("gameTime").value) || 30;
    timeEl.textContent = gameTime;
    nameOverlay.style.display = "none";
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
  engine.runRenderLoop(() => {
    scene.render();
  });

  // 🌐 WebSocket player count
  ws = new WebSocket("wss://public-babylonjs-game.onrender.com/");
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === "players") playersEl.textContent = data.count;
  };
});
