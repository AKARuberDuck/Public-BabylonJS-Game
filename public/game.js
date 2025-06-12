window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  let scene, playerAnchor, score = 0, timer, gameTime, ws;

  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const finalScoreEl = document.getElementById("finalScore");
  const playersEl = document.getElementById("players");
  const nameOverlay = document.getElementById("nameOverlay");
  const toggleBtn = document.getElementById("toggleMusic");

  let playerName = prompt("Enter your name:") || "Player";

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
    window.addEventListener("click", () => {
      if (!music.isPlaying) music.play();
    });

    playerAnchor = new BABYLON.TransformNode("playerRoot", scene);
    const mat = new BABYLON.StandardMaterial("bodyMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);

    const playerParts = {
      head: makeOrb("head", new BABYLON.Vector3(0, 3.2, 0)),
      torso: makeOrb("torso", new BABYLON.Vector3(0, 2, 0)),
      leftArm: makeOrb("lArm", new BABYLON.Vector3(-1, 2, 0)),
      rightArm: makeOrb("rArm", new BABYLON.Vector3(1, 2, 0)),
      leftLeg: makeOrb("lLeg", new BABYLON.Vector3(-0.5, 1, 0)),
      rightLeg: makeOrb("rLeg", new BABYLON.Vector3(0.5, 1, 0))
    };

    function makeOrb(name, pos) {
      const orb = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1 }, scene);
      orb.material = mat;
      orb.parent = playerAnchor;
      orb.position = pos;
      return orb;
    }

    playerAnchor.position = new BABYLON.Vector3(0, 5, 0);
    playerAnchor.physicsImpostor = new BABYLON.PhysicsImpostor(playerAnchor, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 2, restitution: 0.2 }, scene);

    const goal = BABYLON.MeshBuilder.CreateDisc("goal", { radius: 2 }, scene);
    goal.rotation.x = Math.PI / 2;
    goal.position = new BABYLON.Vector3(6, 0.05, -6);
    const goalMat = new BABYLON.StandardMaterial("goalMat", scene);
    goalMat.diffuseColor = new BABYLON.Color3(0.2, 1, 0.2);
    goal.material = goalMat;

    const spinner = BABYLON.MeshBuilder.CreateBox("spinner", { size: 3 }, scene);
    spinner.position = new BABYLON.Vector3(0, 1.5, 10);
    spinner.physicsImpostor = new BABYLON.PhysicsImpostor(spinner, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    scene.registerBeforeRender(() => {
      spinner.rotation.y += 0.03;
    });

    const powerMat = new BABYLON.StandardMaterial("powerMat", scene);
    powerMat.emissiveColor = new BABYLON.Color3(1, 0.6, 0.2);
    function spawnPowerUp() {
      const orb = BABYLON.MeshBuilder.CreateSphere("power", { diameter: 0.8 }, scene);
      orb.material = powerMat;
      orb.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 90,
        1,
        (Math.random() - 0.5) * 90
      );
      orb.actionManager = new BABYLON.ActionManager(scene);
      orb.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        orb.dispose();
        score++;
        scoreEl.textContent = score;
        setTimeout(spawnPowerUp, 3000);
      }));
    }
    for (let i = 0; i < 8; i++) spawnPowerUp();

    const input = { up: false, down: false, left: false, right: false, jump: false };
    window.addEventListener("keydown", e => {
      if (e.code === "ArrowUp") input.up = true;
      if (e.code === "ArrowDown") input.down = true;
      if (e.code === "ArrowLeft") input.left = true;
      if (e.code === "ArrowRight") input.right = true;
      if (e.code === "Space") input.jump = true;
    });
    window.addEventListener("keyup", e => {
      if (e.code === "ArrowUp") input.up = false;
      if (e.code === "ArrowDown") input.down = false;
      if (e.code === "ArrowLeft") input.left = false;
      if (e.code === "ArrowRight") input.right = false;
      if (e.code === "Space") input.jump = false;
    });

    scene.onBeforeRenderObservable.add(() => {
      if (timer) {
        const dir = new BABYLON.Vector3(
          (input.right ? 1 : 0) - (input.left ? 1 : 0),
          0,
          (input.down ? 1 : 0) - (input.up ? 1 : 0)
        );
        if (!dir.equals(BABYLON.Vector3.Zero())) {
          playerAnchor.physicsImpostor.applyImpulse(dir.normalize().scale(3), playerAnchor.getAbsolutePosition());

          const sway = Math.sin(performance.now() * 0.005) * 0.3;
          playerParts.leftLeg.position.z = sway;
          playerParts.rightLeg.position.z = -sway;
          playerParts.leftArm.position.z = -sway;
          playerParts.rightArm.position.z = sway;
        }

        if (input.jump && Math.abs(playerAnchor.physicsImpostor.getLinearVelocity().y) < 0.05) {
          playerAnchor.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 4, 0), playerAnchor.getAbsolutePosition());
        }

        if (BABYLON.Vector3.Distance(playerAnchor.position, goal.position) < 2.5) {
          score++;
          scoreEl.textContent = score;
          playerAnchor.position = new BABYLON.Vector3(0, 5, 0);
        }
      }
    });
  }

  function submitScore(name, score) {
    fetch("https://public-babylonjs-game.onrender.com/submit-score", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: playerName, score })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log("🎯 Score submitted!");
  } else {
    console.warn("⚠️ Submission failed:", data.error);
  }
});
