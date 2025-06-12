window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  let scene, player, goalZone, score = 0, timer, gameTime, ws;

  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const finalScoreEl = document.getElementById("finalScore");
  const playersEl = document.getElementById("players");
  const nameOverlay = document.getElementById("nameOverlay");

  function createScene() {
    scene = new BABYLON.Scene(engine);
    scene.enablePhysics();
    scene.gravity = new BABYLON.Vector3(0, -0.5, 0);

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2.5, Math.PI / 2.7, 30, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // 🌄 Textured ground (CDN-based)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20, subdivisions: 50 }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/ground.jpg", scene);
    groundMat.diffuseTexture.uScale = 4;
    groundMat.diffuseTexture.vScale = 4;
    ground.material = groundMat;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    // 🎶 Background music via SoundHelix CDN
    const music = new BABYLON.Sound(
      "backgroundMusic",
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      scene,
      null,
      { loop: true, autoplay: true, volume: 0.3 }
    );
    window.addEventListener("click", () => {
      if (!music.isPlaying) music.play();
    });

    // 🧍 Player setup
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

    // 🎮 Player input
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

    // 🔁 Physics + scoring loop
    scene.onBeforeRenderObservable.add(() => {
      if (timer) {
        const force = 3;
        let dir = new BABYLON.Vector3(
          (input.right ? 1 : 0) - (input.left ? 1 : 0),
          0,
          (input.down ? 1 : 0) - (input.up ? 1 : 0)
        );
        if (!dir.equals(BABYLON.Vector3.Zero())) {
          player.physicsImpostor.applyImpulse(dir.normalize().scale(force), player.getAbsolutePosition());
        }

        const dist
