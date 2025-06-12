window.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  let scene, score = 0, timer, gameTime, ws;

  let playerParts = {}, powerUps = [], playerAnchor;

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

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2.5, Math.PI / 2.7, 50, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Ground
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

    window.addEventListener("click", () => {
      if (!music.isPlaying) music.play();
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
    playerAnchor = new BABYLON.TransformNode("playerRoot", scene);
    const mat = new BABYLON.StandardMaterial("bodyMat", scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1);

    function makeOrb(name, pos) {
      const orb = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1 }, scene);
      orb.material = mat;
      orb.parent = playerAnchor;
      orb.position = pos;
      return orb;
    }

    playerParts.head = makeOrb("head", new BABYLON.Vector3(0, 3.2, 0));
    playerParts.torso = makeOrb("torso", new BABYLON.Vector3(0, 2, 0));
    playerParts.leftArm = makeOrb("lArm", new BABYLON.Vector3(-1, 2, 0));
    playerParts.rightArm = makeOrb("rArm", new BABYLON.Vector3(1, 2, 0));
    playerParts.leftLeg = makeOrb("lLeg", new BABYLON.Vector3(-0.5, 1, 0));
    playerParts.rightLeg = makeOrb("rLeg", new BABYLON.Vector3(0.5, 1, 0));

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
    spinner.rotation.y = 0;
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
      powerUps.push(orb);
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
        const force = 3;
        const dir = new BABYLON.Vector3(
          (input.right ? 1 : 0) - (input.left ? 1 : 0),
          0,
          (input.down ? 1 : 0) - (input.up ? 1 : 0)
        );
        if (!dir.equals(BABYLON.Vector3.Zero())) {
          playerAnchor.physicsImpostor.applyImpulse(dir.normalize().scale(force), playerAnchor.getAbsolutePosition());

          const sway = Math.sin(performance.now() * 0.005) * 0.3;
          playerParts.leftLeg.position.z = sway;
          playerParts.rightLeg.position.z = -sway;
          playerParts.leftArm.position.z = -sway;
          playerParts.rightArm.position.z = sway;
        }

        if (input.jump && Math.abs(playerAnchor.physicsImpostor.getLinearVelocity().y) < 0.05) {
          playerAnchor.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 4, 0), playerAnchor.getAbsolutePosition());
        }

        const dist = BABYLON.Vector3.Distance(playerAnchor.position, goal.position);
        if (dist < 2.5) {
          score++;
          scoreEl.textContent = score;
          playerAnchor.position = new BABYLON.Vector3(0, 5, 0);
        }
      }
    });
  }
  function startGame() {
    score = 0;
    scoreEl.textContent = score;
    gameTime = parseInt(document.getElementById("gameTime")?.value) || 30;
    timeEl.textContent = gameTime;
    nameOverlay.style.display = "none";
    document.getElementById("scoreboard").style.display = "none";
    playerAnchor.position = new BABYLON.Vector3(0, 5, 0);

    clearInterval(timer);
    timer = setInterval(() => {
      gameTime--;
      timeEl.textContent = gameTime;
      if (gameTime <= 0) {
        clearInterval(timer);
        timer = null;
        finalScoreEl.textContent = score;
        document.getElementById("scoreboard").style.display = "block";
        submitScoreToGitHub(playerName, score);
        fetchLeaderboard(); // optional display
      }
    }, 1000);
  }
  const GITHUB_API_URL = "https://api.github.com/repos/AKARuberDuck/Public-BabylonJS-Game/contents/public/highscores.json";
  const GITHUB_TOKEN = "ghp_your_personal_access_token_here"; // 🔐 Replace this safely or proxy it!

  function submitScoreToGitHub(name, scoreValue) {
    fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        const currentScores = JSON.parse(atob(data.content));
        currentScores.push({ name, score: scoreValue });
        const updated = btoa(JSON.stringify(currentScores, null, 2));

        return fetch(GITHUB_API_URL, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json"
          },
          body: JSON.stringify({
            message: `Add score: ${name} - ${scoreValue}`,
            content: updated,
            sha: data.sha
          })
        });
      })
      .then(() => console.log("Score submitted to GitHub"))
      .catch(err => console.error("GitHub submission failed:", err));
  }

  function fetchLeaderboard() {
    fetch("https://raw.githubusercontent.com/AKARuberDuck/Public-BabylonJS-Game/main/public/highscores.json")
      .then((res) => res.json())
      .then((scores) => {
        const top = scores.sort((a, b) => b.score - a.score).slice(0, 5);
        console.table(top);
        // Optionally: render to your scoreboard UI
      });
  }
  createScene();
  engine.runRenderLoop(() => scene.render());

  ws = new WebSocket("wss://public-babylonjs-game.onrender.com");
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === "players") playersEl.textContent = data.count;
  };

  window.startGame = startGame;
});
