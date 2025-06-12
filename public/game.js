window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);

  let scene, playerAnchor, score = 0, timer, gameTime, ws;
  let input = {}, magnetPowerUpActive = false, magnetTimeout;

  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const finalScoreEl = document.getElementById("finalScore");
  const playersEl = document.getElementById("players");
  const nameOverlay = document.getElementById("nameOverlay");
  const toggleBtn = document.getElementById("toggleMusic");
  const leaderBoardBox = document.getElementById("leaderboard");
  const leaderList = document.getElementById("leaderList");

  let playerName = localStorage.getItem("orbPlayerName") || prompt("Enter your name:") || "Player";
  localStorage.setItem("orbPlayerName", playerName);

  const colorChoice = prompt("Pick orb color (blue, red, green):") || "blue";
  const orbColor = { blue: new BABYLON.Color3(0.2, 0.6, 1), red: BABYLON.Color3.Red(), green: BABYLON.Color3.Green() }[colorChoice] || BABYLON.Color3.Blue();
  function createScene() {
    scene = new BABYLON.Scene(engine);
    scene.enablePhysics();
    scene.gravity = new BABYLON.Vector3(0, -0.5, 0);

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2.5, Math.PI / 2.7, 70, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/ground.jpg", scene);
    groundMat.diffuseTexture.uScale = 10;
    groundMat.diffuseTexture.vScale = 10;
    ground.material = groundMat;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.01;
    scene.fogColor = new BABYLON.Color3(0.85, 0.9, 1);
    const music = new BABYLON.Sound("bgMusic", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", scene, null, {
      loop: true,
      autoplay: true,
      volume: 0.3
    });

    toggleBtn.addEventListener("click", () => {
      if (music.isPlaying) {
        music.pause();
        toggleBtn.textContent = "🔈 Unmute";
      } else {
        music.play();
        toggleBtn.textContent = "🔊 Mute";
      }
    });
    window.addEventListener("click", () => { if (!music.isPlaying) music.play(); });
    playerAnchor = new BABYLON.TransformNode("playerRoot", scene);
    const mat = new BABYLON.StandardMaterial("bodyMat", scene);
    mat.diffuseColor = orbColor;

    function makeOrb(pos) {
      const orb = BABYLON.MeshBuilder.CreateSphere("orb", { diameter: 1 }, scene);
      orb.material = mat;
      orb.parent = playerAnchor;
      orb.position = pos;
      return orb;
    }

    const parts = {
      head: makeOrb(new BABYLON.Vector3(0, 3.2, 0)),
      torso: makeOrb(new BABYLON.Vector3(0, 2, 0)),
      leftArm: makeOrb(new BABYLON.Vector3(-1, 2, 0)),
      rightArm: makeOrb(new BABYLON.Vector3(1, 2, 0)),
      leftLeg: makeOrb(new BABYLON.Vector3(-0.5, 1, 0)),
      rightLeg: makeOrb(new BABYLON.Vector3(0.5, 1, 0))
    };

    playerAnchor.position = new BABYLON.Vector3(0, 5, 0);
    playerAnchor.physicsImpostor = new BABYLON.PhysicsImpostor(playerAnchor, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 2 }, scene);

    // 🌀 Trail
    const trail = new BABYLON.TrailMesh("trail", parts.torso, scene, 0.2, 30, true);
    trail.material = new BABYLON.StandardMaterial("trailMat", scene);
    trail.material.emissiveColor = orbColor;
    const powerMat = new BABYLON.StandardMaterial("powerMat", scene);
    powerMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0.2);

    function spawnPowerUp() {
      const orb = BABYLON.MeshBuilder.CreateSphere("power", { diameter: 0.8 }, scene);
      orb.material = powerMat;
      orb.position = new BABYLON.Vector3((Math.random() - 0.5) * 90, 1, (Math.random() - 0.5) * 90);
      orb.actionManager = new BABYLON.ActionManager(scene);
      orb.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        orb.dispose();
        score++;
        scoreEl.textContent = score;
        magnetPowerUpActive = true;
        clearTimeout(magnetTimeout);
        magnetTimeout = setTimeout(() => { magnetPowerUpActive = false; }, 5000);
        setTimeout(spawnPowerUp, 3000);
      }));
    }
    for (let i = 0; i < 8; i++) spawnPowerUp();
